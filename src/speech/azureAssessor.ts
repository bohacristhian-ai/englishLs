import { AssessmentError, parseAzureResult } from './assessment';
import type { AssessOptions, PronunciationAssessor, WordAssessment } from './assessment';

/**
 * Azure adapter for the pronunciation assessment port.
 *
 * The SDK is loaded lazily: it is around 370 kB, and the app has to stay fully
 * usable without it — no key configured, no microphone, or simply offline.
 *
 * A recogniser is used for exactly one recognition and then closed, but the
 * *next* one is built and connected in the background while the learner is
 * reading the result and rating the card. That keeps the websocket handshake
 * (TCP, TLS, upgrade, auth) off the path the learner waits on without ever
 * reusing a recogniser whose connection the service has already closed.
 */

const KEY = import.meta.env.VITE_AZURE_SPEECH_KEY;
const REGION = import.meta.env.VITE_AZURE_SPEECH_REGION;

export function hasCredentials(): boolean {
  return Boolean(KEY && REGION);
}

/**
 * How much silence ends the utterance.
 *
 * The service default of 500 ms is tuned for sentences. Here a single word is
 * spoken, so half a second of the wait is the service making sure nothing else
 * follows. The documented range is 100–5000 ms; going much lower risks
 * splitting one word into two results, which would read as "wrong word".
 */
const SEGMENTATION_SILENCE_MS = 300;

/** Phoneme granularity in IPA, so scores line up with the ipaGb field. */
const ASSESSMENT_CONFIG = {
  gradingSystem: 'HundredMark',
  granularity: 'Phoneme',
  phonemeAlphabet: 'IPA',
  enableMiscue: false,
};

type SpeechSdk = typeof import('microsoft-cognitiveservices-speech-sdk');
type Recognizer = InstanceType<SpeechSdk['SpeechRecognizer']>;

interface Attempt {
  sdk: SpeechSdk;
  recognizer: Recognizer;
}

/** The connection died before anything was said — safe to redo unseen. */
export class ConnectionLostError extends AssessmentError {}

export class AzurePronunciationAssessor implements PronunciationAssessor {
  private ready: Promise<Attempt> | null = null;
  private closed = false;

  isAvailable(): boolean {
    return hasCredentials() && typeof navigator !== 'undefined' && Boolean(navigator.mediaDevices);
  }

  /**
   * Warms up on the session's opening gesture, so the first press is as quick
   * as the tenth. Best effort by design: a failure here stays silent and the
   * real attempt reports what went wrong, in place and in German.
   */
  async prepare(): Promise<void> {
    if (!this.isAvailable()) return;

    this.closed = false;

    try {
      await this.warm();
    } catch {
      this.ready = null;
    }
  }

  async assess(referenceText: string, options: AssessOptions = {}): Promise<WordAssessment> {
    let heardSpeech = false;

    try {
      return await this.run(referenceText, {
        onSpeechEnd: () => {
          heardSpeech = true;
          options.onSpeechEnd?.();
        },
      });
    } catch (caught) {
      // A connection the service closed while the learner was still thinking
      // fails before a single sound is sent. Redoing that is invisible; redoing
      // it after they have spoken would ask them to say the word twice.
      if (heardSpeech || !(caught instanceof ConnectionLostError)) throw caught;

      return await this.run(referenceText, options);
    }
  }

  /** Ends the session and hands the prepared connection back. */
  dispose(): void {
    const pending = this.ready;

    this.closed = true;
    this.ready = null;
    void pending?.then(({ recognizer }) => recognizer.close()).catch(() => undefined);
  }

  private async run(referenceText: string, options: AssessOptions): Promise<WordAssessment> {
    const { sdk, recognizer } = await this.take();

    try {
      const assessmentConfig = sdk.PronunciationAssessmentConfig.fromJSON(
        JSON.stringify({ ...ASSESSMENT_CONFIG, referenceText }),
      );
      assessmentConfig.applyTo(recognizer);

      return parseAzureResult(JSON.parse(await recogniseOnce(sdk, recognizer, options)));
    } finally {
      // A throw in here would replace the real failure with a teardown detail.
      try {
        recognizer.close();
      } catch {
        // Already gone — which is exactly the state we wanted.
      }

      // Build the replacement now, while the learner reads the result: by the
      // time they reach the next card its connection is already standing.
      if (!this.closed) void this.warm().catch(() => undefined);
    }
  }

  /** Hands over the prepared recogniser and leaves none behind. */
  private take(): Promise<Attempt> {
    const next = this.ready ?? this.create();

    this.ready = null;

    return next;
  }

  private warm(): Promise<Attempt> {
    this.ready ??= this.create();

    return this.ready;
  }

  private async create(): Promise<Attempt> {
    if (!KEY || !REGION) {
      throw new AssessmentError('Kein Azure-Schlüssel hinterlegt.');
    }

    const sdk = await import('microsoft-cognitiveservices-speech-sdk');

    const speechConfig = sdk.SpeechConfig.fromSubscription(KEY, REGION);
    speechConfig.speechRecognitionLanguage = 'en-GB';
    speechConfig.setProperty(
      sdk.PropertyId.Speech_SegmentationSilenceTimeoutMs,
      String(SEGMENTATION_SILENCE_MS),
    );

    const audioConfig = sdk.AudioConfig.fromDefaultMicrophoneInput();
    const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);

    // Without this the handshake happens on the first recognition, in full
    // view of the learner. The microphone is not held open by it: the SDK
    // acquires and releases the device around each recognition.
    sdk.Connection.fromRecognizer(recognizer).openConnection();

    return { sdk, recognizer };
  }
}

function recogniseOnce(
  sdk: SpeechSdk,
  recognizer: Recognizer,
  options: AssessOptions,
): Promise<string> {
  return new Promise((resolve, reject) => {
    recognizer.speechEndDetected = () => options.onSpeechEnd?.();

    recognizer.recognizeOnceAsync(
      (result) => {
        if (result.reason === sdk.ResultReason.NoMatch) {
          reject(new AssessmentError('Nichts verstanden — bitte noch einmal.'));

          return;
        }

        if (result.reason === sdk.ResultReason.Canceled) {
          const details = sdk.CancellationDetails.fromResult(result);
          const isError = details.reason === sdk.CancellationReason.Error;
          const raw = isError ? details.errorDetails : '';

          reject(
            isConnectionLost(raw)
              ? new ConnectionLostError(connectionMessage())
              : new AssessmentError(cancellationMessage(isError, raw)),
          );

          return;
        }

        resolve(
          result.properties.getProperty(sdk.PropertyId.SpeechServiceResponse_JsonResult, '{}'),
        );
      },
      (error: string) =>
        reject(
          isConnectionLost(error)
            ? new ConnectionLostError(connectionMessage())
            : new AssessmentError(microphoneMessage(error)),
        ),
    );
  });
}

/**
 * The service closes an idle websocket, and a recogniser whose connection is
 * gone reports it in an English sentence about socket state. It says nothing
 * the learner can act on — it is ours to retry, not theirs to read.
 */
export function isConnectionLost(raw: string): boolean {
  return /Disconnected state|connection is closed|websocket|1006/i.test(raw);
}

function connectionMessage(): string {
  return 'Die Verbindung zum Dienst wurde unterbrochen. Bitte noch einmal.';
}

/**
 * Turns the SDK's raw English error into something the learner can act on.
 *
 * Left alone it puts a sentence like "NotFoundError: Requested device not
 * found" into a German interface — technically true and useless: it names a
 * DOM exception rather than the thing to do about it.
 */
export function microphoneMessage(raw: string): string {
  if (/NotAllowedError|PermissionDenied|denied/i.test(raw)) {
    return 'Kein Zugriff auf das Mikrofon. Gib es in den Browsereinstellungen frei.';
  }

  if (/NotFoundError|DevicesNotFound|device not found/i.test(raw)) {
    return 'Kein Mikrofon gefunden.';
  }

  if (/NotReadableError|TrackStartError/i.test(raw)) {
    return 'Das Mikrofon ist gerade von einem anderen Programm belegt.';
  }

  return `Die Aufnahme ist fehlgeschlagen: ${raw}`;
}

export function cancellationMessage(isError: boolean, raw: string): string {
  if (!isError) return 'Bewertung abgebrochen.';

  // Quota first: an exhausted free tier also mentions the subscription, and
  // sending the learner to check a key that is perfectly fine wastes their time.
  if (/quota|429|too many requests/i.test(raw)) {
    return 'Das Kontingent des Dienstes ist aufgebraucht.';
  }

  if (/401|403|Forbidden|Unauthorized|invalid subscription key/i.test(raw)) {
    return 'Der Azure-Schlüssel wurde abgelehnt.';
  }

  // An unknown cause stays attached: swallowing it would make a new failure
  // impossible to diagnose from a screenshot.
  return `Bewertung abgebrochen: ${raw}`;
}
