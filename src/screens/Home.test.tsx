import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import App from '../App';
import { getLevel } from '../data/words';
import { addDays, learningDay } from '../domain/dates';
import { createCardState } from '../domain/leitner';
import { emptyProgress } from '../domain/progress';
import type { CardState } from '../domain/types';
import { useProgressStore } from '../store/progressStore';
import { DEFAULT_SETTINGS, useSettingsStore } from '../store/settingsStore';

const TODAY = learningDay(new Date(), DEFAULT_SETTINGS.dayStartHour);

beforeEach(() => {
  localStorage.clear();
  useProgressStore.setState(emptyProgress());
  useSettingsStore.setState(DEFAULT_SETTINGS);
});

/** Every word of level 1 seen and scheduled ahead — the "nothing due" case. */
function everythingScheduledAhead(days = 3): Record<string, CardState> {
  const cards: Record<string, CardState> = {};

  for (const word of getLevel(1)) {
    cards[word.id] = {
      ...createCardState(word.id, TODAY),
      box: 3,
      dueOn: addDays(TODAY, days),
    };
  }

  return cards;
}

describe('home', () => {
  it('counts due cards and today’s remaining new words', () => {
    useProgressStore.setState({
      cards: { ...everythingScheduledAhead(), [getLevel(1)[0]!.id]: {
        ...createCardState(getLevel(1)[0]!.id, TODAY),
        box: 2,
        dueOn: TODAY,
      } },
    });

    render(<App />);

    expect(screen.getByText(/fällig/)).toHaveTextContent('1 fällig · 0 neu');
  });

  it('says when to come back instead of showing an empty page', () => {
    useProgressStore.setState({ cards: everythingScheduledAhead(3) });

    render(<App />);

    const [year, month, day] = addDays(TODAY, 3).split('-');

    expect(screen.getByText('Für heute erledigt.')).toBeInTheDocument();
    expect(screen.getByText(`Nächste Wiederholung am ${day}.${month}.${year}.`)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Session starten' })).toBeDisabled();
  });

  it('leaves the boxes untouched in a practice run', async () => {
    const user = userEvent.setup();
    const before = everythingScheduledAhead(3);

    useProgressStore.setState({ cards: before });
    render(<App />);

    await user.click(screen.getByRole('button', { name: /Freies Üben/ }));
    await user.click(screen.getByRole('button', { name: 'Auflösen' }));
    await user.click(screen.getByRole('button', { name: /Nochmal/ }));

    // "Ohne Wertung" has to mean exactly that: no box moves, no streak, no day.
    expect(useProgressStore.getState().cards).toEqual(before);
    expect(useProgressStore.getState().streak.current).toBe(0);
    expect(useProgressStore.getState().history).toEqual([]);
  });

  it('teaches the level picked on the tile grid', async () => {
    const user = await userEvent.setup();

    render(<App />);

    await user.click(screen.getByRole('button', { name: /^7/ }));
    await user.click(screen.getByRole('button', { name: 'Session starten' }));

    expect(screen.getByText(getLevel(7)[0]!.translation)).toBeInTheDocument();
  });

  it('remembers the picked level for the next session', async () => {
    const user = userEvent.setup();

    render(<App />);

    await user.click(screen.getByRole('button', { name: /^4/ }));
    await user.click(screen.getByRole('button', { name: 'Session starten' }));
    await user.click(screen.getByRole('button', { name: 'Beenden' }));

    expect(screen.getByRole('button', { name: /^4/ })).toHaveAttribute('aria-pressed', 'true');
  });
});

describe('stats', () => {
  it('shows the box distribution and the streak', async () => {
    const user = userEvent.setup();

    useProgressStore.setState({
      cards: everythingScheduledAhead(3),
      streak: { current: 4, longest: 9, lastSessionDay: TODAY },
      history: [{ day: TODAY, reviewed: 12, correct: 8 }],
    });

    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Statistik' }));

    expect(screen.getByRole('heading', { name: 'Statistik' })).toBeInTheDocument();
    expect(screen.getByText('Begonnen').nextSibling).toHaveTextContent('50');
    expect(screen.getByText('Bester Streak').nextSibling).toHaveTextContent('9');
    expect(screen.getByText('8/12')).toBeInTheDocument();
  });

  it('says so when no day has been recorded yet', async () => {
    const user = userEvent.setup();

    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Statistik' }));

    expect(screen.getByText('Noch keine Lerntage aufgezeichnet.')).toBeInTheDocument();
  });
});
