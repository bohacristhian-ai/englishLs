import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import App from '../App';
import { getLevel } from '../data/words';
import { emptyProgress } from '../domain/progress';
import { useProgressStore } from '../store/progressStore';
import { DEFAULT_SETTINGS, useSettingsStore } from '../store/settingsStore';

const FIRST = getLevel(1)[0]!;

// The stores are module singletons and now genuinely persist, so without this
// one test's progress would decide which card the next test sees.
beforeEach(() => {
  localStorage.clear();
  useProgressStore.setState(emptyProgress());
  useSettingsStore.setState(DEFAULT_SETTINGS);
});

async function startSession(direction: 'de-en' | 'en-de' = 'de-en') {
  const user = userEvent.setup();

  render(<App />);

  if (direction === 'en-de') {
    await user.click(screen.getByRole('radio', { name: /Englisch → Deutsch/ }));
  }

  await user.click(screen.getByRole('button', { name: 'Session starten' }));

  return user;
}

describe('card flow', () => {
  it('offers the productive direction by default', () => {
    render(<App />);

    expect(screen.getByRole('radio', { name: /Deutsch → Englisch/ })).toBeChecked();
  });

  it('does not give the answer away on the de-en front', async () => {
    await startSession();

    // The whole point of the productive direction: no English word, no IPA.
    expect(screen.queryByText(FIRST.term)).not.toBeInTheDocument();
    expect(screen.queryByText(`/${FIRST.ipaGb}/`)).not.toBeInTheDocument();

    expect(screen.getByText(FIRST.translation)).toBeInTheDocument();
  });

  it('shows the example sentence with a gap instead of the target word', async () => {
    await startSession();

    const gapped = screen.getByText(/______/);

    expect(gapped).toBeInTheDocument();
    expect(gapped.textContent).not.toContain(FIRST.term);
  });

  it('offers no audio on the de-en front', async () => {
    await startSession();

    expect(screen.queryByRole('button', { name: /Anhören/ })).not.toBeInTheDocument();
  });

  it('reveals term, transcription and rating buttons', async () => {
    const user = await startSession();

    await user.click(screen.getByRole('button', { name: 'Auflösen' }));

    expect(screen.getByRole('heading', { name: FIRST.term })).toBeInTheDocument();
    expect(screen.getByText(`/${FIRST.ipaGb}/`)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sicher/ })).toBeInTheDocument();
  });

  it('asks a checkable question rather than a vague one', async () => {
    const user = await startSession();

    await user.click(screen.getByRole('button', { name: 'Auflösen' }));

    expect(
      screen.getByText('Betonung auf der richtigen Silbe? Endungen reduziert?'),
    ).toBeInTheDocument();
  });

  it('marks the stressed syllable and describes it in text', async () => {
    const user = await startSession();

    await user.click(screen.getByRole('button', { name: 'Auflösen' }));

    const syllables = screen.getAllByRole('listitem');

    expect(syllables).toHaveLength(FIRST.syllables.length);
    expect(syllables[FIRST.stressIndex]).toHaveTextContent(FIRST.syllables[FIRST.stressIndex]!);
    expect(syllables[FIRST.stressIndex]!.className).toContain('syllable--stressed');
    expect(
      screen.getByText(`Betonung auf Silbe ${FIRST.stressIndex + 1} von ${FIRST.syllables.length}`),
    ).toBeInTheDocument();
  });

  it('moves to the next card after a rating', async () => {
    const user = await startSession();

    await user.click(screen.getByRole('button', { name: 'Auflösen' }));
    await user.click(screen.getByRole('button', { name: /Sicher/ }));

    const second = getLevel(1)[1]!;

    expect(screen.getByText(second.translation)).toBeInTheDocument();
    expect(screen.queryByText(FIRST.translation)).not.toBeInTheDocument();
  });

  it('counts the presented cards', async () => {
    const user = await startSession();

    expect(screen.getByText('0 / 20')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Auflösen' }));
    await user.click(screen.getByRole('button', { name: /Sicher/ }));

    expect(screen.getByText('1 / 20')).toBeInTheDocument();
  });

  it('brings a card rated "Nochmal" back later in the same session', async () => {
    const user = await startSession();

    await user.click(screen.getByRole('button', { name: 'Auflösen' }));
    await user.click(screen.getByRole('button', { name: /Nochmal/ }));

    // It went to the back of the queue, so the next card is a different word.
    expect(screen.queryByText(FIRST.translation)).not.toBeInTheDocument();
  });

  it('shows the word on the en-de front so it can be heard', async () => {
    await startSession('en-de');

    expect(screen.getByRole('heading', { name: FIRST.term })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Anhören/ })).toBeInTheDocument();
  });

  it('reports missing speech support instead of failing silently', async () => {
    // jsdom has no speechSynthesis, which is the same situation as a device
    // without an English voice — the card must say so.
    const user = await startSession();

    await user.click(screen.getByRole('button', { name: 'Auflösen' }));

    expect(screen.getByRole('status')).toHaveTextContent(/Sprachausgabe/);
  });

  it('can be left through the quit button', async () => {
    const user = await startSession();

    await user.click(screen.getByRole('button', { name: 'Beenden' }));

    expect(screen.getByRole('button', { name: 'Session starten' })).toBeInTheDocument();
  });
});

describe('persistence', () => {
  it('remembers a rated card after the app is torn down and rebuilt', async () => {
    const user = await startSession();

    await user.click(screen.getByRole('button', { name: 'Auflösen' }));
    await user.click(screen.getByRole('button', { name: /Sicher/ }));

    cleanup();
    render(<App />);

    // The word is in box 2 and due tomorrow, so it leaves the due count and
    // takes one slot out of today's budget for new words.
    expect(screen.getByText(/fällig/)).toHaveTextContent('0 fällig · 9 neu');
  });

  it('writes the progress to localStorage', async () => {
    const user = await startSession();

    await user.click(screen.getByRole('button', { name: 'Auflösen' }));
    await user.click(screen.getByRole('button', { name: /Sicher/ }));

    const stored = localStorage.getItem('englishls.progress');

    expect(stored).not.toBeNull();
    expect(stored).toContain(FIRST.id);
  });

  it('counts the day as studied from the first rating, not only on completion', async () => {
    // Stopping after a few cards is still studying; the streak must not punish it.
    const user = await startSession();

    await user.click(screen.getByRole('button', { name: 'Auflösen' }));
    await user.click(screen.getByRole('button', { name: /Sicher/ }));
    await user.click(screen.getByRole('button', { name: 'Beenden' }));

    expect(screen.getByText(/Streak 1 Tag/)).toBeInTheDocument();
  });

  it('starts with an empty progress on a fresh device', () => {
    render(<App />);

    expect(screen.getByText(/fällig/)).toHaveTextContent('0 fällig · 10 neu');
    expect(screen.getByText('Noch kein Streak')).toBeInTheDocument();
  });

  it('remembers the chosen direction for the next session', async () => {
    const user = await startSession('en-de');

    await user.click(screen.getByRole('button', { name: 'Beenden' }));

    expect(screen.getByRole('radio', { name: /Englisch → Deutsch/ })).toBeChecked();
  });
});
