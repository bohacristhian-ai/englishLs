import { microphoneMessage } from './azureAssessor';

describe('microphoneMessage', () => {
  it('names the fix for a denied microphone', () => {
    expect(
      microphoneMessage('Error occurred during microphone initialization: NotAllowedError'),
    ).toContain('Browsereinstellungen');
  });

  it('says plainly when there is no microphone at all', () => {
    expect(
      microphoneMessage(
        'Error occurred during microphone initialization: NotFoundError: Requested device not found',
      ),
    ).toBe('Kein Mikrofon gefunden.');
  });

  it('names a microphone another program is holding', () => {
    expect(microphoneMessage('NotReadableError: Could not start audio source')).toContain(
      'belegt',
    );
  });

  it('keeps an unknown detail rather than swallowing it', () => {
    // Losing the cause would make an unfamiliar failure undiagnosable.
    expect(microphoneMessage('websocket 1006')).toBe(
      'Die Aufnahme ist fehlgeschlagen: websocket 1006',
    );
  });
});
