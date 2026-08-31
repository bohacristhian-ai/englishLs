import {
  RATE_NORMAL,
  RATE_SLOW,
  hasLocalEnglishVoice,
  isEnglish,
  isLocalEnglish,
  resetVoiceCache,
  selectVoice,
  speak,
} from './tts';
import type { VoiceLike } from './tts';

function voice(overrides: Partial<VoiceLike> & { name: string; lang: string }): VoiceLike {
  return { localService: false, default: false, ...overrides };
}

const GB_NETWORK = voice({ name: 'Google UK English Female', lang: 'en-GB' });
const GB_LOCAL = voice({ name: 'Daniel', lang: 'en-GB', localService: true });
const US_NETWORK = voice({ name: 'Google US English', lang: 'en-US' });
const US_LOCAL = voice({ name: 'Samantha', lang: 'en-US', localService: true });
const AU_LOCAL = voice({ name: 'Karen', lang: 'en-AU', localService: true });
const GERMAN = voice({ name: 'Anna', lang: 'de-DE', localService: true });

describe('rates', () => {
  it('offers a normal and a slow rate', () => {
    expect(RATE_NORMAL).toBe(1);
    expect(RATE_SLOW).toBeLessThan(RATE_NORMAL);
    expect(RATE_SLOW).toBeGreaterThan(0.4);
  });
});

describe('isEnglish', () => {
  it('accepts every English variant', () => {
    expect(isEnglish(GB_LOCAL)).toBe(true);
    expect(isEnglish(US_NETWORK)).toBe(true);
    expect(isEnglish(AU_LOCAL)).toBe(true);
  });

  it('rejects other languages', () => {
    expect(isEnglish(GERMAN)).toBe(false);
  });

  it('is case-insensitive about the tag', () => {
    expect(isEnglish(voice({ name: 'x', lang: 'EN-gb' }))).toBe(true);
  });
});

describe('isLocalEnglish', () => {
  it('requires both English and a local service', () => {
    expect(isLocalEnglish(GB_LOCAL)).toBe(true);
    expect(isLocalEnglish(GB_NETWORK)).toBe(false);
    expect(isLocalEnglish(GERMAN)).toBe(false);
  });
});

describe('hasLocalEnglishVoice', () => {
  it('is true when an offline English voice exists', () => {
    expect(hasLocalEnglishVoice([GERMAN, GB_NETWORK, US_LOCAL])).toBe(true);
  });

  it('is false when every English voice is network-bound', () => {
    // The case that breaks offline speech on Chrome and Android.
    expect(hasLocalEnglishVoice([GERMAN, GB_NETWORK, US_NETWORK])).toBe(false);
  });

  it('is false without any voices', () => {
    expect(hasLocalEnglishVoice([])).toBe(false);
  });
});

describe('selectVoice while online', () => {
  const online = { accent: 'gb', preferLocal: false } as const;

  it('prefers the requested accent', () => {
    expect(selectVoice([US_LOCAL, GB_NETWORK], online)).toBe(GB_NETWORK);
  });

  it('prefers en-US when that accent is requested', () => {
    const result = selectVoice([GB_LOCAL, US_NETWORK], { accent: 'us', preferLocal: false });

    expect(result).toBe(US_NETWORK);
  });

  it('falls back to another English variant', () => {
    expect(selectVoice([GERMAN, AU_LOCAL], online)).toBe(AU_LOCAL);
  });

  it('never returns a non-English voice', () => {
    expect(selectVoice([GERMAN], online)).toBeNull();
  });

  it('returns null without any voices', () => {
    expect(selectVoice([], online)).toBeNull();
  });

  it('prefers the browser default among equal candidates', () => {
    const plain = voice({ name: 'A voice', lang: 'en-GB' });
    const preferred = voice({ name: 'Z voice', lang: 'en-GB', default: true });

    expect(selectVoice([plain, preferred], online)).toBe(preferred);
  });

  it('picks deterministically when candidates are otherwise equal', () => {
    const a = voice({ name: 'Alpha', lang: 'en-GB' });
    const b = voice({ name: 'Beta', lang: 'en-GB' });

    expect(selectVoice([b, a], online)).toBe(a);
    expect(selectVoice([a, b], online)).toBe(a);
  });
});

describe('selectVoice while offline', () => {
  const offline = { accent: 'gb', preferLocal: true } as const;

  it('takes an audible local voice over a silent network voice in the right accent', () => {
    // The whole point: offline, en-GB from the network produces nothing at all.
    expect(selectVoice([GB_NETWORK, US_LOCAL], offline)).toBe(US_LOCAL);
  });

  it('still prefers the requested accent among local voices', () => {
    expect(selectVoice([US_LOCAL, GB_LOCAL], offline)).toBe(GB_LOCAL);
  });

  it('falls back to a network voice when nothing local exists', () => {
    expect(selectVoice([GB_NETWORK], offline)).toBe(GB_NETWORK);
  });
});

/* --- speak() ---------------------------------------------------------- */

class FakeUtterance extends EventTarget {
  voice: VoiceLike | null = null;
  lang = '';
  rate = 1;

  constructor(public text: string) {
    super();
  }
}

interface Spy {
  calls: string[];
  spoken: FakeUtterance[];
  synth: { speaking: boolean; pending: boolean };
}

function installSynth(state: { speaking?: boolean; pending?: boolean } = {}): Spy {
  const calls: string[] = [];
  const spoken: FakeUtterance[] = [];

  const synth = {
    speaking: state.speaking ?? false,
    pending: state.pending ?? false,
    getVoices: () => [GB_LOCAL],
    addEventListener: () => {},
    removeEventListener: () => {},
    speak(utterance: FakeUtterance) {
      calls.push('speak');
      spoken.push(utterance);
    },
    cancel() {
      calls.push('cancel');
      this.speaking = false;
      this.pending = false;
    },
  };

  vi.stubGlobal('speechSynthesis', synth);
  vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance);

  return { calls, spoken, synth };
}

beforeEach(() => {
  resetVoiceCache();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('speak', () => {
  it('does not cancel an idle queue', async () => {
    // Chrome truncates or drops an utterance queued in the same tick as a
    // cancel(), which is what cut the word off on every reveal.
    const spy = installSynth();

    await speak('acknowledge');

    expect(spy.calls).toEqual(['speak']);
    expect(spy.spoken[0]?.text).toBe('acknowledge');
  });

  it('cancels a running utterance before starting the next', async () => {
    const spy = installSynth({ speaking: true });

    await speak('resilient');

    expect(spy.calls).toEqual(['cancel', 'speak']);
  });

  it('cancels one that is still queued', async () => {
    const spy = installSynth({ pending: true });

    await speak('resilient');

    expect(spy.calls).toEqual(['cancel', 'speak']);
  });

  it('applies voice, language and rate', async () => {
    const spy = installSynth();

    await speak('acknowledge', { rate: RATE_SLOW });

    expect(spy.spoken[0]?.voice).toBe(GB_LOCAL);
    expect(spy.spoken[0]?.lang).toBe(GB_LOCAL.lang);
    expect(spy.spoken[0]?.rate).toBe(RATE_SLOW);
  });

  it('reports the end of an utterance', async () => {
    const spy = installSynth();
    const onEnd = vi.fn();

    await speak('acknowledge', { onEnd });
    spy.spoken[0]?.dispatchEvent(new Event('end'));

    expect(onEnd).toHaveBeenCalledOnce();
  });

  it('stays quiet about an interruption, which is normal card handling', async () => {
    const spy = installSynth();
    const onError = vi.fn();

    await speak('acknowledge', { onError });

    const interrupted = Object.assign(new Event('error'), { error: 'interrupted' });
    spy.spoken[0]?.dispatchEvent(interrupted);

    expect(onError).not.toHaveBeenCalled();
  });

  it('reports a real failure', async () => {
    const spy = installSynth();
    const onError = vi.fn();

    await speak('acknowledge', { onError });

    const failed = Object.assign(new Event('error'), { error: 'synthesis-failed' });
    spy.spoken[0]?.dispatchEvent(failed);

    expect(onError).toHaveBeenCalledWith('Sprachausgabe fehlgeschlagen (synthesis-failed).');
  });

  it('says so when the device has no English voice at all', async () => {
    const onError = vi.fn();

    vi.stubGlobal('speechSynthesis', {
      speaking: false,
      pending: false,
      getVoices: () => [GERMAN],
      addEventListener: () => {},
      removeEventListener: () => {},
      speak: () => {},
      cancel: () => {},
    });
    vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance);

    await speak('acknowledge', { onError });

    expect(onError).toHaveBeenCalledWith(
      'Auf diesem Gerät ist keine englische Stimme installiert.',
    );
  });
});
