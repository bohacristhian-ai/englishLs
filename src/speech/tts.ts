/**
 * The only place in the app that touches the Web Speech API.
 *
 * Two things make this more than a thin wrapper:
 *
 * 1. Voices load asynchronously and the list is empty on first call in most
 *    browsers — `voiceschanged` has to be awaited or the first card is silent.
 * 2. Many of the best English voices are *network-based* (Chrome and Android
 *    ship Google voices that synthesise server-side). Offline they produce
 *    nothing at all, so when there is no connection a worse-sounding local
 *    voice beats a better one that stays silent.
 *
 * The selection logic is pure and exported separately so it can be tested
 * without a browser.
 */

export const RATE_NORMAL = 1;
/** Slow enough to hear syllable boundaries, fast enough to stay natural. */
export const RATE_SLOW = 0.6;

export type Accent = 'gb' | 'us';

const ACCENT_LANG: Readonly<Record<Accent, string>> = {
  gb: 'en-gb',
  us: 'en-us',
};

/** The parts of SpeechSynthesisVoice the selection actually needs. */
export interface VoiceLike {
  readonly name: string;
  readonly lang: string;
  readonly localService: boolean;
  readonly default: boolean;
}

export interface VoicePreference {
  accent: Accent;
  /**
   * Rank a voice that works without a network connection above the requested
   * accent. Set this when the device is offline: the right accent is worthless
   * if it cannot make a sound.
   */
  preferLocal: boolean;
}

export function isEnglish(voice: VoiceLike): boolean {
  return voice.lang.toLowerCase().startsWith('en');
}

export function isLocalEnglish(voice: VoiceLike): boolean {
  return isEnglish(voice) && voice.localService;
}

/** True when the app can still speak with no network connection. */
export function hasLocalEnglishVoice(voices: readonly VoiceLike[]): boolean {
  return voices.some(isLocalEnglish);
}

function rank(voice: VoiceLike, preference: VoicePreference): number[] {
  const accentMatch = voice.lang.toLowerCase().startsWith(ACCENT_LANG[preference.accent]) ? 1 : 0;
  const local = voice.localService ? 1 : 0;
  const isDefault = voice.default ? 1 : 0;

  // Offline, being audible outranks having the right accent.
  return preference.preferLocal
    ? [local, accentMatch, isDefault]
    : [accentMatch, isDefault, local];
}

function compareRanks(a: readonly number[], b: readonly number[]): number {
  for (let index = 0; index < a.length; index += 1) {
    const difference = (b[index] ?? 0) - (a[index] ?? 0);

    if (difference !== 0) return difference;
  }

  return 0;
}

/**
 * Picks the best English voice, or null when the device has none at all —
 * which is a real case on bare Linux installs and has to stay visible to the
 * user rather than failing silently.
 */
export function selectVoice<T extends VoiceLike>(
  voices: readonly T[],
  preference: VoicePreference,
): T | null {
  const english = voices.filter(isEnglish);

  if (english.length === 0) return null;

  const sorted = [...english].sort((a, b) => {
    const byRank = compareRanks(rank(a, preference), rank(b, preference));

    if (byRank !== 0) return byRank;

    // Stable order so the same device always picks the same voice.
    return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
  });

  return sorted[0] ?? null;
}

export function isSupported(): boolean {
  return typeof globalThis.speechSynthesis !== 'undefined';
}

let cachedVoices: SpeechSynthesisVoice[] | null = null;

/**
 * Resolves once the browser has published its voice list. Chrome returns an
 * empty array on the first call and fires `voiceschanged` later; Safari fills
 * it synchronously. The timeout keeps a browser that never fires the event
 * from hanging the first card forever.
 */
export function loadVoices(timeoutMs = 2000): Promise<SpeechSynthesisVoice[]> {
  if (!isSupported()) return Promise.resolve([]);
  if (cachedVoices && cachedVoices.length > 0) return Promise.resolve(cachedVoices);

  const synth = globalThis.speechSynthesis;
  const immediate = synth.getVoices();

  if (immediate.length > 0) {
    cachedVoices = immediate;

    return Promise.resolve(immediate);
  }

  return new Promise((resolve) => {
    let settled = false;

    const finish = (): void => {
      if (settled) return;
      settled = true;
      synth.removeEventListener('voiceschanged', finish);
      clearTimeout(timer);
      cachedVoices = synth.getVoices();
      resolve(cachedVoices);
    };

    const timer = setTimeout(finish, timeoutMs);
    synth.addEventListener('voiceschanged', finish);
  });
}

/** Drops the cached list — used when the user changes accent in settings. */
export function resetVoiceCache(): void {
  cachedVoices = null;
}

export interface SpeechStatus {
  supported: boolean;
  /** An English voice exists at all. */
  hasEnglishVoice: boolean;
  /** Speech will still work without a network connection. */
  offlineCapable: boolean;
  selectedVoiceName: string | null;
}

export async function getStatus(accent: Accent = 'gb'): Promise<SpeechStatus> {
  if (!isSupported()) {
    return {
      supported: false,
      hasEnglishVoice: false,
      offlineCapable: false,
      selectedVoiceName: null,
    };
  }

  const voices = await loadVoices();
  const selected = selectVoice(voices, { accent, preferLocal: !isOnline() });

  return {
    supported: true,
    hasEnglishVoice: selected !== null,
    offlineCapable: hasLocalEnglishVoice(voices),
    selectedVoiceName: selected?.name ?? null,
  };
}

function isOnline(): boolean {
  return typeof navigator === 'undefined' || navigator.onLine !== false;
}

export interface SpeakOptions {
  accent?: Accent;
  rate?: number;
  onEnd?: () => void;
  onError?: (reason: string) => void;
}

/**
 * Chrome garbage-collects an utterance that nothing else references and cuts
 * the audio off mid-word. That is an engine bug, not misuse of the API, and
 * holding on to the running utterance is the established workaround.
 */
let running: SpeechSynthesisUtterance | null = null;

/**
 * Chrome also drops or truncates an utterance queued in the same tick as a
 * `cancel()`. Cancelling therefore happens only when something is genuinely
 * still speaking, and the queue gets a moment to settle afterwards.
 */
const CANCEL_SETTLE_MS = 80;

export function cancel(): void {
  if (!isSupported()) return;

  running = null;
  globalThis.speechSynthesis.cancel();
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Speaks one phrase. Never called without a preceding user gesture — iOS
 * Safari blocks the first utterance otherwise, and the whole session would
 * stay mute with no visible error.
 */
export async function speak(text: string, options: SpeakOptions = {}): Promise<void> {
  const { accent = 'gb', rate = RATE_NORMAL, onEnd, onError } = options;

  if (!isSupported()) {
    onError?.('Dieser Browser unterstützt keine Sprachausgabe.');

    return;
  }

  const voices = await loadVoices();
  const voice = selectVoice(voices, { accent, preferLocal: !isOnline() });

  if (!voice) {
    onError?.('Auf diesem Gerät ist keine englische Stimme installiert.');

    return;
  }

  const synth = globalThis.speechSynthesis;

  // Overlapping utterances queue up and read the previous card over the new
  // one — but cancelling an idle queue is the truncation bug, not a fix for it.
  if (synth.speaking || synth.pending) {
    cancel();
    await delay(CANCEL_SETTLE_MS);
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.voice = voice;
  utterance.lang = voice.lang;
  utterance.rate = rate;

  const release = (): void => {
    if (running === utterance) running = null;
  };

  utterance.addEventListener('end', () => {
    release();
    onEnd?.();
  });
  utterance.addEventListener('error', (event) => {
    release();

    // Cancelling on a card change fires 'error' with reason 'interrupted' —
    // that is normal operation, not a failure worth showing the user.
    if (event.error === 'interrupted' || event.error === 'canceled') return;

    onError?.(`Sprachausgabe fehlgeschlagen (${event.error}).`);
  });

  running = utterance;
  synth.speak(utterance);
}
