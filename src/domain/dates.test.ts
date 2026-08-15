import {
  DEFAULT_DAY_START_HOUR,
  addDays,
  compareIsoDate,
  daysBetween,
  isDue,
  isIsoDate,
  learningDay,
  toIsoDate,
} from './dates';

describe('toIsoDate', () => {
  it('formats a local date, zero-padded', () => {
    expect(toIsoDate(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(toIsoDate(new Date(2026, 11, 31))).toBe('2026-12-31');
  });

  it('uses local time, not UTC', () => {
    // 23:30 local on the 15th stays the 15th in every timezone the app runs in.
    expect(toIsoDate(new Date(2026, 7, 15, 23, 30))).toBe('2026-08-15');
    expect(toIsoDate(new Date(2026, 7, 15, 0, 30))).toBe('2026-08-15');
  });
});

describe('isIsoDate', () => {
  it('accepts real days', () => {
    expect(isIsoDate('2026-08-15')).toBe(true);
    expect(isIsoDate('2024-02-29')).toBe(true);
  });

  it('rejects malformed strings and impossible days', () => {
    expect(isIsoDate('2026-8-15')).toBe(false);
    expect(isIsoDate('15.08.2026')).toBe(false);
    expect(isIsoDate('2026-02-31')).toBe(false);
    expect(isIsoDate('2025-02-29')).toBe(false);
    expect(isIsoDate('')).toBe(false);
  });
});

describe('learningDay', () => {
  it('counts a late-evening session towards that same day', () => {
    expect(learningDay(new Date(2026, 7, 15, 23, 45))).toBe('2026-08-15');
  });

  it('counts an after-midnight session towards the previous day', () => {
    // The point of the 04:00 boundary: one sitting, one learning day.
    expect(learningDay(new Date(2026, 7, 16, 1, 30))).toBe('2026-08-15');
    expect(learningDay(new Date(2026, 7, 16, 3, 59))).toBe('2026-08-15');
  });

  it('starts the new day at the day-start hour', () => {
    expect(learningDay(new Date(2026, 7, 16, 4, 0))).toBe('2026-08-16');
  });

  it('rolls back across a month boundary', () => {
    expect(learningDay(new Date(2026, 8, 1, 2, 0))).toBe('2026-08-31');
  });

  it('honours a custom day-start hour', () => {
    expect(learningDay(new Date(2026, 7, 16, 3, 0), 0)).toBe('2026-08-16');
    expect(learningDay(new Date(2026, 7, 16, 5, 0), 6)).toBe('2026-08-15');
  });

  it('defaults to 04:00', () => {
    expect(DEFAULT_DAY_START_HOUR).toBe(4);
  });
});

describe('addDays', () => {
  it('adds and subtracts whole days', () => {
    expect(addDays('2026-08-15', 1)).toBe('2026-08-16');
    expect(addDays('2026-08-15', 0)).toBe('2026-08-15');
    expect(addDays('2026-08-15', -1)).toBe('2026-08-14');
  });

  it('crosses month and year boundaries', () => {
    expect(addDays('2026-08-31', 1)).toBe('2026-09-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2027-01-01', -1)).toBe('2026-12-31');
  });

  it('handles leap days', () => {
    expect(addDays('2024-02-28', 1)).toBe('2024-02-29');
    expect(addDays('2025-02-28', 1)).toBe('2025-03-01');
  });

  it('survives daylight-saving transitions', () => {
    // Noon anchoring means a 23-hour or 25-hour day cannot shift the result.
    expect(addDays('2026-03-28', 1)).toBe('2026-03-29');
    expect(addDays('2026-03-29', 1)).toBe('2026-03-30');
    expect(addDays('2026-10-24', 1)).toBe('2026-10-25');
    expect(addDays('2026-10-25', 1)).toBe('2026-10-26');
  });

  it('adds every Leitner interval correctly', () => {
    expect(addDays('2026-08-15', 1)).toBe('2026-08-16');
    expect(addDays('2026-08-15', 3)).toBe('2026-08-18');
    expect(addDays('2026-08-15', 7)).toBe('2026-08-22');
    expect(addDays('2026-08-15', 16)).toBe('2026-08-31');
    expect(addDays('2026-08-15', 30)).toBe('2026-09-14');
  });

  it('rejects a malformed day', () => {
    expect(() => addDays('nope', 1)).toThrow(RangeError);
  });
});

describe('daysBetween', () => {
  it('counts whole days in both directions', () => {
    expect(daysBetween('2026-08-15', '2026-08-16')).toBe(1);
    expect(daysBetween('2026-08-15', '2026-08-15')).toBe(0);
    expect(daysBetween('2026-08-16', '2026-08-15')).toBe(-1);
  });

  it('counts across a DST transition', () => {
    expect(daysBetween('2026-03-28', '2026-03-30')).toBe(2);
    expect(daysBetween('2026-10-24', '2026-10-26')).toBe(2);
  });

  it('counts across a year boundary', () => {
    expect(daysBetween('2026-12-30', '2027-01-02')).toBe(3);
  });
});

describe('compareIsoDate', () => {
  it('orders days chronologically', () => {
    expect(compareIsoDate('2026-08-15', '2026-08-16')).toBe(-1);
    expect(compareIsoDate('2026-08-16', '2026-08-15')).toBe(1);
    expect(compareIsoDate('2026-08-15', '2026-08-15')).toBe(0);
  });

  it('sorts a list oldest first', () => {
    const days = ['2026-09-01', '2026-08-15', '2026-12-31', '2026-08-16'];

    expect([...days].sort(compareIsoDate)).toEqual([
      '2026-08-15',
      '2026-08-16',
      '2026-09-01',
      '2026-12-31',
    ]);
  });
});

describe('isDue', () => {
  it('is due today and when overdue', () => {
    expect(isDue('2026-08-15', '2026-08-15')).toBe(true);
    expect(isDue('2026-08-10', '2026-08-15')).toBe(true);
  });

  it('is not due in the future', () => {
    expect(isDue('2026-08-16', '2026-08-15')).toBe(false);
  });
});
