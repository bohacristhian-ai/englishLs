import { AssessmentError, parseAzureResult } from './assessment';
import type { PronunciationAssessor, WordAssessment } from './assessment';

/**
 * Azure adapter for the pronunciation assessment port.
 *
 * The SDK is loaded lazily: it is around 1.5 MB, and the app has to stay fully
 * usable without it — no key configured, no microphone, or simply offline.
 */

const KEY = import.meta.env.VITE_AZURE_SPEECH_KEY;
const REGION = import.meta.env.VITE_AZURE_SPEECH_REGION;

export function hasCredentials(): boolean {
  return Boolean(KEY && REGION);
}

/** Phoneme granularity in IPA, so scores line up with the ipaGb field. */
const ASSESSMENT_CONFIG = JSON.stringify({
  referenceText: '',
  gradingSystem: 'HundredMark',
  granularity: 'Phoneme',
  phonemeAlphabet: 'IPA',
  enableMiscue: false,
});

export class AzurePronunciationAssessor implements PronunciationAssessor {
  isAvailable(): boolean {
    return hasCredentials() && typeof navigator !== 'undefined' && Boolean(navigator.mediaDevices);
  }

  async assess(referenceText: string): Promise<WordAssessment> {
    if (!KEY || !REGION) {
      throw new AssessmentError('Kein Azure-Schlüssel hinterlegt.');
    }

    const sdk = await import('microsoft-cognitiveservices-speech-sdk');

    const speechConfig = sdk.SpeechConfig.fromSubscription(KEY, REGION);
    speechConfig.speechRecognitionLanguage = 'en-GB';

    const audioConfig = sdk.AudioConfig.fromDefaultMicrophoneInput();
    const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);

    const assessmentConfig = sdk.PronunciationAssessmentConfig.fromJSON(
      JSON.stringify({ ...JSON.parse(ASSESSMENT_CONFIG), referenceText }),
    );
    assessmentConfig.applyTo(recognizer);

    try {
      const raw = await recogniseOnce(sdk, recognizer);

      return parseAzureResult(JSON.parse(raw));
    } finally {
      recognizer.close();
    }
  }
}

type SpeechSdk = typeof import('microsoft-cognitiveservices-speech-sdk');

function recogniseOnce(
  sdk: SpeechSdk,
  recognizer: InstanceType<SpeechSdk['SpeechRecognizer']>,
): Promise<string> {
  return new Promise((resolve, reject) => {
    recognizer.recognizeOnceAsync(
      (result) => {
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
      (error: string) => reject(new AssessmentError(error)),
    );
  });
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
