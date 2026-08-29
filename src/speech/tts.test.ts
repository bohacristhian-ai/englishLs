import {
  RATE_NORMAL,
  RATE_SLOW,
  hasLocalEnglishVoice,
  isEnglish,
  isLocalEnglish,
  selectVoice,
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
