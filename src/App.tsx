/**
 * Placeholder shell. The real screens (Home, SessionSetup, Session, Summary,
 * Stats, Settings) arrive with M4 and M6 — this exists so M0 has something
 * running to verify the toolchain against.
 */
export default function App() {
  return (
    <main className="app">
      <h1 className="app__title">englishLs</h1>
      <p className="app__tagline">Englisch B2 — Aussprache mit Leitner-System</p>
      <p className="app__status">
        Projektgerüst steht (M0). Als Nächstes folgen die Leitner-Logik (M1) und
        die 50 Wörter aus Level 1 (M2).
      </p>
    </main>
  );
}
