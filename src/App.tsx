import { useState } from 'react';

import Home from './screens/Home';
import type { StartOptions } from './screens/Home';
import Session from './screens/Session';
import Settings from './screens/Settings';
import Stats from './screens/Stats';
import Summary from './screens/Summary';
import type { SessionResult } from './screens/Summary';

type View = 'home' | 'session' | 'summary' | 'stats' | 'settings';

export default function App() {
  const [view, setView] = useState<View>('home');
  const [options, setOptions] = useState<StartOptions | null>(null);
  const [result, setResult] = useState<SessionResult | null>(null);

  return (
    <main className="app">
      <h1 className="app__title">englishLs</h1>
      <p className="app__tagline">Englisch B2 — Aussprache mit Leitner-System</p>

      {view === 'home' && (
        <Home
          onStart={(next) => {
            setOptions(next);
            setView('session');
          }}
          onShowStats={() => setView('stats')}
          onShowSettings={() => setView('settings')}
        />
      )}

      {view === 'session' && options && (
        <Session
          level={options.level}
          direction={options.direction}
          targetCards={options.targetCards}
          practice={options.practice}
          onFinish={(finished) => {
            setResult(finished);
            setView('summary');
          }}
          onQuit={() => setView('home')}
        />
      )}

      {view === 'summary' && result && (
        <Summary result={result} onRestart={() => setView('home')} />
      )}

      {view === 'stats' && <Stats onBack={() => setView('home')} />}
      {view === 'settings' && <Settings onBack={() => setView('home')} />}
    </main>
  );
}
