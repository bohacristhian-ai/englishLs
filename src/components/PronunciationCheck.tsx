import { useCallback, useState } from 'react';

import { AssessmentError, WEAK_THRESHOLD, summarise } from '../speech/assessment';
import type { PronunciationAssessor, Verdict } from '../speech/assessment';

interface PronunciationCheckProps {
  term: string;
  assessor: PronunciationAssessor;
}

type Phase = 'idle' | 'listening' | 'done' | 'failed';

/**
 * Microphone check against Azure's pronunciation assessment.
 *
 * The verdict *informs* the self-assessment, it does not replace it: the
 * learner still presses the rating button. Handing the Leitner box straight to
 * a machine score is a one-way door — easy to switch on later, unpleasant to
 * undo once progress has been shaped by it.
 */
export default function PronunciationCheck({ term, assessor }: PronunciationCheckProps) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [error, setError] = useState<string | null>(null);

  const listen = useCallback(async () => {
    setPhase('listening');
    setError(null);
    setVerdict(null);

    try {
      const assessment = await assessor.assess(term);

      setVerdict(summarise(assessment, term));
      setPhase('done');
    } catch (caught) {
      setError(
        caught instanceof AssessmentError
          ? caught.message
          : 'Die Bewertung ist fehlgeschlagen. Mikrofon freigegeben?',
      );
      setPhase('failed');
    }
  }, [assessor, term]);

  if (!assessor.isAvailable()) return null;

  return (
    <div className="check">
      <button
        type="button"
        className="check__button"
        onClick={() => void listen()}
        disabled={phase === 'listening'}
      >
        {phase === 'listening' ? '● Hört zu …' : '🎤 Aussprache prüfen'}
      </button>

      {phase === 'listening' && (
        <p className="check__hint" role="status">
          Sprich das Wort jetzt.
        </p>
      )}

      {error && (
        <p className="check__error" role="status">
          {error}
        </p>
      )}

      {verdict && (
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
