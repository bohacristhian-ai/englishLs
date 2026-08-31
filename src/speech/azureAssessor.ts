import { AssessmentError, parseAzureResult } from './assessment';
import type { AssessOptions, PronunciationAssessor, WordAssessment } from './assessment';

/**
 * Azure adapter for the pronunciation assessment port.
 *
 * The SDK is loaded lazily: it is around 1.5 MB, and the app has to stay fully
 * usable without it — no key configured, no microphone, or simply offline.
 *
 * Everything expensive is set up once per session rather than per word. A
 * fresh recogniser costs a full websocket handshake (TCP, TLS, upgrade, auth)
 * before a single sound is sent, and paying that on every card is most of the
 * wait the learner feels between speaking and seeing a score.
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

interface Live {
  sdk: SpeechSdk;
  recognizer: Recognizer;
}

export class AzurePronunciationAssessor implements PronunciationAssessor {
  private live: Promise<Live> | null = null;

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

    try {
      await this.connect();
    } catch {
      this.live = null;
    }
  }

  async assess(referenceText: string, options: AssessOptions = {}): Promise<WordAssessment> {
    const { sdk, recognizer } = await this.connect();

    const assessmentConfig = sdk.PronunciationAssessmentConfig.fromJSON(
      JSON.stringify({ ...ASSESSMENT_CONFIG, referenceText }),
    );
    assessmentConfig.applyTo(recognizer);

    const raw = await recogniseOnce(sdk, recognizer, options);

    return parseAzureResult(JSON.parse(raw));
  }

  /** Ends the session and hands the connection back. */
  dispose(): void {
    const pending = this.live;

    this.live = null;
    void pending?.then(({ recognizer }) => recognizer.close()).catch(() => undefined);
  }

  private connect(): Promise<Live> {
    // One in-flight creation, shared: pressing the button during the warm-up
    // must join it rather than open a second connection.
    this.live ??= this.create();

    return this.live;
  }

  private async create(): Promise<Live> {
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
    // view of the learner. The microphone itself is not held open: the SDK
    // acquires and releases it around each recognition.
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
    let settled = false;

    recognizer.speechEndDetected = () => {
      if (!settled) options.onSpeechEnd?.();
    };

    const finish = (): void => {
      settled = true;
      recognizer.speechEndDetected = () => undefined;
    };

    recognizer.recognizeOnceAsync(
      (result) => {
        finish();

        if (result.reason === sdk.ResultReason.NoMatch) {
          reject(new AssessmentError('Nichts verstanden — bitte noch einmal.'));

          return;
        }

        if (result.reason === sdk.ResultReason.Canceled) {
          const details = sdk.CancellationDetails.fromResult(result);

          reject(new AssessmentError(cancellationMessage(sdk, details)));

          return;
        }

        resolve(
          result.properties.getProperty(sdk.PropertyId.SpeechServiceResponse_JsonResult, '{}'),
        );
      },
      (error: string) => {
        finish();
        reject(new AssessmentError(microphoneMessage(error)));
      },
    );
  });
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

function cancellationMessage(
  sdk: SpeechSdk,
  details: ReturnType<SpeechSdk['CancellationDetails']['fromResult']>,
): string {
  if (details.reason === sdk.CancellationReason.Error) {
    // The overwhelmingly common causes: a wrong key, an exhausted free tier,
    // or a denied microphone. Naming them beats echoing an opaque code.
    return `Bewertung abgebrochen: ${details.errorDetails}`;
  }

  return 'Bewertung abgebrochen.';
}
