import { useState } from 'react';

import Session from './screens/Session';
import SessionSetup from './screens/SessionSetup';
import Summary from './screens/Summary';
import type { SessionResult } from './screens/Summary';
import { useProgressStore } from './store/progressStore';
import { useSettingsStore } from './store/settingsStore';

type View = 'setup' | 'session' | 'summary';

export default function App() {
  const [view, setView] = useState<View>('setup');
  const [result, setResult] = useState<SessionResult | null>(null);

  const { direction, level, sessionSize, update } = useSettingsStore();
  const seenWords = useProgressStore((state) => Object.keys(state.cards).length);
  const streak = useProgressStore((state) => state.streak.current);

  return (
    <main className="app">
      <h1 className="app__title">englishLs</h1>
      <p className="app__tagline">Englisch B2 — Aussprache mit Leitner-System</p>

      {view === 'setup' && (
        <>
          <p className="app__progress">
            {seenWords === 0
              ? 'Noch keine Wörter begonnen.'
              : `${seenWords} von 500 Wörtern begonnen · Streak ${streak} ${streak === 1 ? 'Tag' : 'Tage'}`}
          </p>

          <SessionSetup
            initial={{ level, direction, targetCards: sessionSize }}
            onStart={(next) => {
              update({
                level: next.level,
                direction: next.direction,
                sessionSize: next.targetCards,
              });
              setView('session');
            }}
          />
        </>
      )}

      {view === 'session' && (
        <Session
          level={level}
          direction={direction}
          targetCards={sessionSize}
          onFinish={(finished) => {
            setResult(finished);
            setView('summary');
          }}
          onQuit={() => setView('setup')}
        />
      )}

      {view === 'summary' && result && (
        <Summary result={result} onRestart={() => setView('setup')} />
      )}
    </main>
  );
}
