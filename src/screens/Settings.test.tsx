import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import App from '../App';
import { learningDay } from '../domain/dates';
import { createCardState } from '../domain/leitner';
import { emptyProgress, exportProgress, parseImport } from '../domain/progress';
import { useProgressStore } from '../store/progressStore';
import { DEFAULT_SETTINGS, useSettingsStore } from '../store/settingsStore';

const TODAY = learningDay(new Date(), DEFAULT_SETTINGS.dayStartHour);

beforeEach(() => {
  localStorage.clear();
  useProgressStore.setState(emptyProgress());
  useSettingsStore.setState(DEFAULT_SETTINGS);
});

async function openSettings() {
  const user = userEvent.setup();

  render(<App />);
  await user.click(screen.getByRole('button', { name: 'Einstellungen' }));

  return user;
}

function backup(): File {
  const json = exportProgress(
    {
      ...emptyProgress(),
      cards: { 'l01-w001': { ...createCardState('l01-w001', TODAY), box: 4 } },
      streak: { current: 6, longest: 6, lastSessionDay: TODAY },
    },
    new Date(),
  );

  return new File([json], 'englishls.json', { type: 'application/json' });
}

describe('settings', () => {
  it('offers the progress as a file to keep', async () => {
    // jsdom has neither object URLs nor a download, so the round trip is
    // checked at the Blob — that is what would land on the learner's disk.
    const blobs: Blob[] = [];

    vi.spyOn(URL, 'createObjectURL').mockImplementation((blob) => {
      blobs.push(blob as Blob);

      return 'blob:test';
    });
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    useProgressStore.setState({
      cards: { 'l01-w001': { ...createCardState('l01-w001', TODAY), box: 5 } },
    });

    const user = await openSettings();

    await user.click(screen.getByRole('button', { name: 'Exportieren' }));

    expect(screen.getByText('Sicherung heruntergeladen.')).toBeInTheDocument();

    const written = JSON.parse(await blobs[0]!.text()) as Record<string, unknown>;

    expect(written['app']).toBe('englishLs');
    expect(parseImport(await blobs[0]!.text()).cards['l01-w001']?.box).toBe(5);

    vi.restoreAllMocks();
  });

  it('stores the accent for the next session', async () => {
    const user = await openSettings();

    await user.click(screen.getByRole('radio', { name: /Amerikanisch/ }));

    expect(useSettingsStore.getState().accent).toBe('us');
  });

  it('stores the day start hour', async () => {
    const user = await openSettings();

    await user.click(screen.getByRole('radio', { name: '06:00' }));

    expect(useSettingsStore.getState().dayStartHour).toBe(6);
  });

  it('restores a backup file', async () => {
    const user = await openSettings();

    await user.upload(screen.getByLabelText('Sicherungsdatei auswählen'), backup());

    expect(await screen.findByText('1 Wort wiederhergestellt.')).toBeInTheDocument();
    expect(useProgressStore.getState().cards['l01-w001']?.box).toBe(4);
    expect(useProgressStore.getState().streak.current).toBe(6);
  });

  it('rejects a file that is not an englishLs backup', async () => {
    const user = await openSettings();
    const foreign = new File(['{"app":"something else"}'], 'other.json', {
      type: 'application/json',
    });

    await user.upload(screen.getByLabelText('Sicherungsdatei auswählen'), foreign);

    expect(await screen.findByText('Diese Datei stammt nicht aus englishLs.')).toBeInTheDocument();
    expect(useProgressStore.getState().cards).toEqual({});
  });

  it('asks before wiping the progress', async () => {
    const user = await openSettings();

    useProgressStore.setState({
      cards: { 'l01-w001': createCardState('l01-w001', TODAY) },
    });

    await user.click(screen.getByRole('button', { name: 'Zurücksetzen …' }));

    // The first tap only arms it — losing every box to one misplaced thumb
    // would be unrecoverable, the progress lives nowhere else.
    expect(useProgressStore.getState().cards['l01-w001']).toBeDefined();

    await user.click(screen.getByRole('button', { name: 'Abbrechen' }));
    expect(useProgressStore.getState().cards['l01-w001']).toBeDefined();

    await user.click(screen.getByRole('button', { name: 'Zurücksetzen …' }));
    await user.click(screen.getByRole('button', { name: 'Endgültig löschen' }));

    expect(useProgressStore.getState().cards).toEqual({});
  });
});
