import { cancellationMessage, isConnectionLost, microphoneMessage } from './azureAssessor';

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
    expect(microphoneMessage('NotReadableError: Could not start audio source')).toContain('belegt');
  });

  it('keeps an unknown detail rather than swallowing it', () => {
    // Losing the cause would make an unfamiliar failure undiagnosable.
    expect(microphoneMessage('something odd')).toBe(
      'Die Aufnahme ist fehlgeschlagen: something odd',
    );
  });
});

describe('isConnectionLost', () => {
  it('recognises the socket the service closed while nobody was speaking', () => {
    // This exact sentence reached a learner mid-session; it is ours to retry.
    expect(isConnectionLost('Cannot send on connection that is in Disconnected state')).toBe(true);
  });

  it('recognises a dropped websocket', () => {
    expect(isConnectionLost('Unable to contact server. StatusCode: 1006')).toBe(true);
  });

  it('does not mistake a microphone or key problem for a lost connection', () => {
    // Retrying either of those would only fail again, silently and twice.
    expect(isConnectionLost('NotAllowedError: Permission denied')).toBe(false);
    expect(isConnectionLost('401 Unauthorized')).toBe(false);
  });
});

describe('cancellationMessage', () => {
  it('names a rejected key instead of echoing a status code', () => {
    expect(cancellationMessage(true, 'WebSocket upgrade failed: 401 Unauthorized')).toBe(
      'Der Azure-Schlüssel wurde abgelehnt.',
    );
  });

  it('names an exhausted quota', () => {
    expect(cancellationMessage(true, 'Quota exceeded for this subscription')).toContain(
      'Kontingent',
    );
  });

  it('stays plain when the service simply stopped', () => {
    expect(cancellationMessage(false, '')).toBe('Bewertung abgebrochen.');
  });

  it('keeps an unknown cause attached', () => {
    expect(cancellationMessage(true, 'weird failure')).toBe(
      'Bewertung abgebrochen: weird failure',
    );
  });
});
