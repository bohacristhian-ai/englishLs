import { useCallback, useState } from 'react';

import { AssessmentError, WEAK_THRESHOLD, summarise } from '../speech/assessment';
import type { PronunciationAssessor, Verdict } from '../speech/assessment';

interface PronunciationCheckProps {
  term: string;
  assessor: PronunciationAssessor;
  /**
   * The verdict names the recognised word and the weakest syllable — on the
   * de-en front that is the answer. It is therefore only ever rendered after
   * the reveal, no matter when it was recorded.
   */
  revealed: boolean;
  /** Called once a recording succeeded, so the card can turn itself over. */
  onRecorded: () => void;
}

type Phase = 'idle' | 'listening' | 'scoring' | 'done' | 'failed';

const BUSY: readonly Phase[] = ['listening', 'scoring'];

/**
 * Microphone check against Azure's pronunciation assessment.
 *
 * It sits on the front of the card on purpose: saying the word out loud is the
 * work, and a card that can be flipped without doing it invites flipping too
 * fast. Recording therefore also turns the card over — the answer is earned.
 *
 * The verdict *informs* the self-assessment, it does not replace it: the
 * learner still presses the rating button. Handing the Leitner box straight to
 * a machine score is a one-way door — easy to switch on later, unpleasant to
 * undo once progress has been shaped by it.
 */
export default function PronunciationCheck({
  term,
  assessor,
  revealed,
  onRecorded,
}: PronunciationCheckProps) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [error, setError] = useState<string | null>(null);

  const listen = useCallback(async () => {
    setPhase('listening');
    setError(null);
    setVerdict(null);

    try {
      const assessment = await assessor.assess(term, {
        onSpeechEnd: () => setPhase((current) => (current === 'listening' ? 'scoring' : current)),
      });

      setVerdict(summarise(assessment, term));
      setPhase('done');
      onRecorded();
    } catch (caught) {
      // A failed attempt is no attempt: stay on the front so it can be retried
      // rather than handing over the answer for a recording that never was.
      setError(
        caught instanceof AssessmentError
          ? caught.message
          : 'Die Bewertung ist fehlgeschlagen. Mikrofon freigegeben?',
      );
      setPhase('failed');
    }
  }, [assessor, term, onRecorded]);

  if (!assessor.isAvailable()) return null;

  return (
    <div className="check">
      <button
        type="button"
        className={revealed ? 'check__button' : 'check__button check__button--primary'}
        onClick={() => void listen()}
        disabled={BUSY.includes(phase)}
      >
        {buttonLabel(phase, revealed, verdict !== null)}
      </button>

      {BUSY.includes(phase) && (
        <p className="check__hint" role="status">
          {phase === 'listening' ? 'Sprich das Wort jetzt.' : 'Einen Moment …'}
        </p>
      )}

      {error && (
        <p className="check__error" role="status">
          {error}
        </p>
      )}

      {revealed && verdict && (
        <div className={`check__verdict check__verdict--${verdict.level}`} role="status">
          <p className="check__headline">{verdict.headline}</p>
          {verdict.detail && <p className="check__detail">{verdict.detail}</p>}

          {verdict.weakest.length > 0 && (
            <ul className="check__weak">
              {verdict.weakest.map((syllable) => (
                <li key={syllable.syllable}>
                  <span className="check__syllable">{syllable.syllable}</span>
                  <span
                    className={
                      syllable.accuracy < WEAK_THRESHOLD ? 'check__score check__score--low' : 'check__score'
                    }
                  >
                    {Math.round(syllable.accuracy)}
                  </span>
                </li>
              ))}
            </ul>
          )}

          <p className="check__note">
            Die Maschine bewertet, du entscheidest — wähle unten selbst.
          </p>
        </div>
      )}
    </div>
  );
}

function buttonLabel(phase: Phase, revealed: boolean, hasVerdict: boolean): string {
  if (phase === 'listening') return '● Hört zu …';
  // Saying "listening" while the score is being fetched invites the learner to
  // keep talking into a microphone that has already stopped.
  if (phase === 'scoring') return '● Wertet aus …';
  if (!revealed) return '🎤 Aussprechen';

  return hasVerdict ? '🎤 Nochmal prüfen' : '🎤 Aussprache prüfen';
}
