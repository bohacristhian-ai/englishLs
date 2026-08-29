import { useState } from 'react';

import Session from './screens/Session';
import SessionSetup from './screens/SessionSetup';
import type { SessionOptions } from './screens/SessionSetup';
import Summary from './screens/Summary';
import type { SessionResult } from './screens/Summary';
import type { CardState } from './domain/types';

type View = 'setup' | 'session' | 'summary';

const DEFAULT_OPTIONS: SessionOptions = { level: 1, direction: 'de-en', targetCards: 20 };

export default function App() {
  const [view, setView] = useState<View>('setup');
  const [options, setOptions] = useState<SessionOptions>(DEFAULT_OPTIONS);
  // Progress lives in memory until M5 adds the persisted store.
  const [cards, setCards] = useState<Record<string, CardState>>({});
  const [result, setResult] = useState<SessionResult | null>(null);

  return (
    <main className="app">
      <h1 className="app__title">englishLs</h1>
      <p className="app__tagline">Englisch B2 — Aussprache mit Leitner-System</p>

      {view === 'setup' && (
        <SessionSetup
          initial={options}
          onStart={(next) => {
            setOptions(next);
            setView('session');
          }}
        />
      )}

      {view === 'session' && (
        <Session
          level={options.level}
          direction={options.direction}
          targetCards={options.targetCards}
          cards={cards}
          onCardsChange={setCards}
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

      <p className="app__status">
        Fortschritt wird noch nicht gespeichert — das kommt mit M5.
      </p>
    </main>
  );
}
