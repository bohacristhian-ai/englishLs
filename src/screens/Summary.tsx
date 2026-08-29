export interface SessionResult {
  presented: number;
  again: number;
  unsure: number;
  sure: number;
}

interface SummaryProps {
  result: SessionResult;
  onRestart: () => void;
}

export default function Summary({ result, onRestart }: SummaryProps) {
  const rated = result.again + result.unsure + result.sure;
  const share = rated === 0 ? 0 : Math.round((result.sure / rated) * 100);

  return (
    <section className="summary">
      <h2>Session beendet</h2>

      <dl className="summary__stats">
        <div>
          <dt>Karten</dt>
          <dd>{result.presented}</dd>
        </div>
        <div>
          <dt>Sicher</dt>
          <dd>{result.sure}</dd>
        </div>
        <div>
          <dt>Unsicher</dt>
          <dd>{result.unsure}</dd>
        </div>
        <div>
          <dt>Nochmal</dt>
          <dd>{result.again}</dd>
        </div>
      </dl>

      <p className="summary__share">{share} % sicher</p>

      <button type="button" onClick={onRestart}>
        Zurück zum Start
      </button>
    </section>
  );
}
