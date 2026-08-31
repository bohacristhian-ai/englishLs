import { useRef, useState } from 'react';

import { exportProgress, parseImport } from '../domain/progress';
import { ImportError } from '../domain/progress';
import { useProgressStore } from '../store/progressStore';
import { useSettingsStore } from '../store/settingsStore';

interface SettingsProps {
  onBack: () => void;
}

const DAY_START_HOURS = [0, 2, 4, 6] as const;

export default function Settings({ onBack }: SettingsProps) {
  const { accent, autoplay, dayStartHour, update } = useSettingsStore();
  const reset = useProgressStore((state) => state.reset);

  const fileInput = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmingReset, setConfirmingReset] = useState(false);

  const handleExport = (): void => {
    const { cards, history, streak, unlockedLevels, schemaVersion } = useProgressStore.getState();
    const json = exportProgress(
      { cards, history, streak, unlockedLevels, schemaVersion },
      new Date(),
    );

    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `englishls-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);

    setError(null);
    setMessage('Sicherung heruntergeladen.');
  };

  const handleImport = async (file: File): Promise<void> => {
    try {
      const restored = parseImport(await file.text());

      const count = Object.keys(restored.cards).length;

      useProgressStore.setState(restored);
      setError(null);
      setMessage(`${count} ${count === 1 ? 'Wort' : 'Wörter'} wiederhergestellt.`);
    } catch (caught) {
      setMessage(null);
      setError(caught instanceof ImportError ? caught.message : 'Die Datei ließ sich nicht lesen.');
    }
  };

  return (
    <section className="settings">
      <h2>Einstellungen</h2>

      <fieldset className="setup__group">
        <legend>Aussprachevariante</legend>
        <label>
          <input
            type="radio"
            name="accent"
            checked={accent === 'gb'}
            onChange={() => update({ accent: 'gb' })}
          />
          Britisch <span className="setup__note">Standard, passend zur Lautschrift</span>
        </label>
        <label>
          <input
            type="radio"
            name="accent"
            checked={accent === 'us'}
            onChange={() => update({ accent: 'us' })}
          />
          Amerikanisch
        </label>
      </fieldset>

      <fieldset className="setup__group">
        <legend>Sprachausgabe</legend>
        <label>
          <input
            type="checkbox"
            checked={autoplay}
            onChange={(event) => update({ autoplay: event.target.checked })}
          />
          Wort beim Aufdecken automatisch vorlesen
        </label>
      </fieldset>

      <fieldset className="setup__group">
        <legend>Tagesbeginn</legend>
        <p className="setup__note">
          Ab wann ein neuer Lerntag zählt. 04:00 hält eine späte Session in einem Tag.
        </p>
        <div className="setup__sizes">
          {DAY_START_HOURS.map((hour) => (
            <label key={hour}>
              <input
                type="radio"
                name="dayStart"
                checked={dayStartHour === hour}
                onChange={() => update({ dayStartHour: hour })}
              />
              {String(hour).padStart(2, '0')}:00
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="setup__group">
        <legend>Sicherung</legend>
        <p className="setup__note">
          Der Fortschritt liegt nur auf diesem Gerät. Wird der Browserspeicher geleert, ist er
          ohne Sicherung verloren.
        </p>
        <div className="settings__actions">
          <button type="button" onClick={handleExport}>
            Exportieren
          </button>
          <button type="button" onClick={() => fileInput.current?.click()}>
            Importieren
          </button>
        </div>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          hidden
          aria-label="Sicherungsdatei auswählen"
          onChange={(event) => {
            const file = event.target.files?.[0];

            if (file) void handleImport(file);
            event.target.value = '';
          }}
        />
      </fieldset>

      {message && (
        <p className="settings__message" role="status">
          {message}
        </p>
      )}
      {error && (
        <p className="settings__error" role="status">
          {error}
        </p>
      )}

      <fieldset className="setup__group setup__group--danger">
        <legend>Fortschritt zurücksetzen</legend>
        {confirmingReset ? (
          <>
            <p className="setup__note">
              Das löscht alle Fächer, den Streak und die Historie. Nicht umkehrbar.
            </p>
            <div className="settings__actions">
              <button
                type="button"
                className="settings__danger"
                onClick={() => {
                  reset();
                  setConfirmingReset(false);
                  setError(null);
                  setMessage('Fortschritt zurückgesetzt.');
                }}
              >
                Endgültig löschen
              </button>
              <button type="button" onClick={() => setConfirmingReset(false)}>
                Abbrechen
              </button>
            </div>
          </>
        ) : (
          <button type="button" onClick={() => setConfirmingReset(true)}>
            Zurücksetzen …
          </button>
        )}
      </fieldset>

      <button type="button" className="setup__start" onClick={onBack}>
        Zurück
      </button>
    </section>
  );
}
