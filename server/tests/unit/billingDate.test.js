/**
 * Unit Tests: billingDate utility
 * Tests calculateNextBillingDate and calculatePreviousBillingDate with all intervals.
 * No MongoDB required — pure function tests.
 */

const {
  calculateNextBillingDate,
  calculatePreviousBillingDate
} = require('../../src/utils/billingDate');

describe('billingDate utility — calculateNextBillingDate', () => {
  // ── Daily ────────────────────────────────────────────────────────────────────
  describe('daily interval', () => {
    test('advances by exactly 1 day', () => {
      const from = new Date('2026-01-15T00:00:00.000Z');
      const result = calculateNextBillingDate(from, 'daily');
      expect(result.toISOString()).toBe('2026-01-16T00:00:00.000Z');
    });

    test('crosses month boundary', () => {
      const from = new Date('2026-01-31T00:00:00.000Z');
      const result = calculateNextBillingDate(from, 'daily');
      expect(result.toISOString()).toBe('2026-02-01T00:00:00.000Z');
    });

    test('crosses year boundary', () => {
      const from = new Date('2025-12-31T00:00:00.000Z');
      const result = calculateNextBillingDate(from, 'daily');
      expect(result.toISOString()).toBe('2026-01-01T00:00:00.000Z');
    });
  });

  // ── Weekly ───────────────────────────────────────────────────────────────────
  describe('weekly interval', () => {
    test('advances by exactly 7 days', () => {
      const from = new Date('2026-01-01T00:00:00.000Z');
      const result = calculateNextBillingDate(from, 'weekly');
      expect(result.toISOString()).toBe('2026-01-08T00:00:00.000Z');
    });

    test('crosses month boundary correctly', () => {
      const from = new Date('2026-01-28T00:00:00.000Z');
      const result = calculateNextBillingDate(from, 'weekly');
      expect(result.toISOString()).toBe('2026-02-04T00:00:00.000Z');
    });
  });

  // ── Monthly ──────────────────────────────────────────────────────────────────
  describe('monthly interval', () => {
    test('normal month advance', () => {
      const from = new Date('2026-01-15T00:00:00.000Z');
      const result = calculateNextBillingDate(from, 'monthly');
      expect(result.toISOString()).toBe('2026-02-15T00:00:00.000Z');
    });

    test('Jan 31 clamps to Feb 28 (non-leap year)', () => {
      const from = new Date('2026-01-31T00:00:00.000Z');
      const result = calculateNextBillingDate(from, 'monthly');
      expect(result.toISOString()).toBe('2026-02-28T00:00:00.000Z');
    });

    test('Jan 31 clamps to Feb 29 in leap year 2024', () => {
      const from = new Date('2024-01-31T00:00:00.000Z');
      const result = calculateNextBillingDate(from, 'monthly');
      expect(result.toISOString()).toBe('2024-02-29T00:00:00.000Z');
    });

    test('March 31 clamps to April 30', () => {
      const from = new Date('2026-03-31T00:00:00.000Z');
      const result = calculateNextBillingDate(from, 'monthly');
      expect(result.toISOString()).toBe('2026-04-30T00:00:00.000Z');
    });

    test('Dec 31 advances to Jan 31 next year', () => {
      const from = new Date('2025-12-31T00:00:00.000Z');
      const result = calculateNextBillingDate(from, 'monthly');
      expect(result.toISOString()).toBe('2026-01-31T00:00:00.000Z');
    });

    test('Dec 1 advances to Jan 1 next year', () => {
      const from = new Date('2025-12-01T00:00:00.000Z');
      const result = calculateNextBillingDate(from, 'monthly');
      expect(result.toISOString()).toBe('2026-01-01T00:00:00.000Z');
    });
  });

  // ── Yearly ───────────────────────────────────────────────────────────────────
  describe('yearly interval', () => {
    test('normal year advance', () => {
      const from = new Date('2026-06-15T00:00:00.000Z');
      const result = calculateNextBillingDate(from, 'yearly');
      expect(result.toISOString()).toBe('2027-06-15T00:00:00.000Z');
    });

    test('Feb 29 in leap year advances to Feb 28 in non-leap year', () => {
      const from = new Date('2024-02-29T00:00:00.000Z');
      const result = calculateNextBillingDate(from, 'yearly');
      expect(result.toISOString()).toBe('2025-02-28T00:00:00.000Z');
    });

    test('Feb 28 in non-leap year advances to Feb 28 in next non-leap year', () => {
      const from = new Date('2025-02-28T00:00:00.000Z');
      const result = calculateNextBillingDate(from, 'yearly');
      expect(result.toISOString()).toBe('2026-02-28T00:00:00.000Z');
    });
  });

  // ── Error handling ────────────────────────────────────────────────────────────
  describe('error handling', () => {
    test('throws on invalid date', () => {
      expect(() => calculateNextBillingDate('not-a-date', 'daily')).toThrow('Invalid date');
    });

    test('throws on unsupported interval', () => {
      expect(() => calculateNextBillingDate(new Date(), 'quarterly')).toThrow('Unsupported billing interval');
    });
  });
});

describe('billingDate utility — calculatePreviousBillingDate', () => {
  // ── Daily ────────────────────────────────────────────────────────────────────
  describe('daily interval', () => {
    test('steps back by exactly 1 day', () => {
      const from = new Date('2026-02-01T00:00:00.000Z');
      const result = calculatePreviousBillingDate(from, 'daily');
      expect(result.toISOString()).toBe('2026-01-31T00:00:00.000Z');
    });
  });

  // ── Weekly ───────────────────────────────────────────────────────────────────
  describe('weekly interval', () => {
    test('steps back by exactly 7 days', () => {
      const from = new Date('2026-02-08T00:00:00.000Z');
      const result = calculatePreviousBillingDate(from, 'weekly');
      expect(result.toISOString()).toBe('2026-02-01T00:00:00.000Z');
    });
  });

  // ── Monthly ──────────────────────────────────────────────────────────────────
  describe('monthly interval', () => {
    test('steps back one month normally', () => {
      const from = new Date('2026-03-15T00:00:00.000Z');
      const result = calculatePreviousBillingDate(from, 'monthly');
      expect(result.toISOString()).toBe('2026-02-15T00:00:00.000Z');
    });

    test('March 31 steps back to Feb 28 (non-leap)', () => {
      const from = new Date('2026-03-31T00:00:00.000Z');
      const result = calculatePreviousBillingDate(from, 'monthly');
      expect(result.toISOString()).toBe('2026-02-28T00:00:00.000Z');
    });

    test('Jan 31 steps back to Dec 31 of previous year', () => {
      const from = new Date('2026-01-31T00:00:00.000Z');
      const result = calculatePreviousBillingDate(from, 'monthly');
      expect(result.toISOString()).toBe('2025-12-31T00:00:00.000Z');
    });

    test('Jan 1 steps back to Dec 1 of previous year', () => {
      const from = new Date('2026-01-01T00:00:00.000Z');
      const result = calculatePreviousBillingDate(from, 'monthly');
      expect(result.toISOString()).toBe('2025-12-01T00:00:00.000Z');
    });
  });

  // ── Yearly ───────────────────────────────────────────────────────────────────
  describe('yearly interval', () => {
    test('steps back one year normally', () => {
      const from = new Date('2026-06-15T00:00:00.000Z');
      const result = calculatePreviousBillingDate(from, 'yearly');
      expect(result.toISOString()).toBe('2025-06-15T00:00:00.000Z');
    });

    test('Feb 29 in leap year steps back to Feb 28 in previous non-leap year', () => {
      const from = new Date('2024-02-29T00:00:00.000Z');
      const result = calculatePreviousBillingDate(from, 'yearly');
      expect(result.toISOString()).toBe('2023-02-28T00:00:00.000Z');
    });
  });

  // ── Round-trip symmetry ───────────────────────────────────────────────────────
  describe('round-trip symmetry', () => {
    const intervals = ['daily', 'weekly', 'monthly', 'yearly'];
    const testDate = new Date('2026-06-15T00:00:00.000Z');

    intervals.forEach((interval) => {
      test(`next then previous returns original date for ${interval}`, () => {
        const next = calculateNextBillingDate(testDate, interval);
        const prev = calculatePreviousBillingDate(next, interval);
        expect(prev.toISOString()).toBe(testDate.toISOString());
      });
    });
  });

  // ── Error handling ────────────────────────────────────────────────────────────
  describe('error handling', () => {
    test('throws on invalid date', () => {
      expect(() => calculatePreviousBillingDate('not-a-date', 'daily')).toThrow('Invalid date');
    });

    test('throws on unsupported interval', () => {
      expect(() => calculatePreviousBillingDate(new Date(), 'biweekly')).toThrow('Unsupported billing interval');
    });
  });
});

// ── Financial calculation unit tests ─────────────────────────────────────────
describe('Financial calculation rules (paise arithmetic)', () => {
  test('GST at 18% on 150000 paise = 27000 paise (exact integer)', () => {
    const subtotal = 150000;
    const taxAmount = Math.round((subtotal * 18) / 100);
    expect(taxAmount).toBe(27000);
    expect(Number.isInteger(taxAmount)).toBe(true);
  });

  test('GST at 18% on 100001 paise rounds correctly', () => {
    const subtotal = 100001;
    const taxAmount = Math.round((subtotal * 18) / 100);
    // 100001 * 18 / 100 = 18000.18 → rounds to 18000
    expect(taxAmount).toBe(18000);
    expect(Number.isInteger(taxAmount)).toBe(true);
  });

  test('Total = subtotal + taxAmount', () => {
    const subtotal = 160000;
    const taxAmount = Math.round((subtotal * 18) / 100);
    const total = subtotal + taxAmount;
    expect(total).toBe(188800);
  });

  test('Subtotal = unitPrice * quantity (integer arithmetic)', () => {
    const unitPrice = 80000; // paise
    const quantity = 2;
    const subtotal = unitPrice * quantity;
    expect(subtotal).toBe(160000);
    expect(Number.isInteger(subtotal)).toBe(true);
  });

  test('Zero price subscription has zero subtotal, zero tax, zero total', () => {
    const unitPrice = 0;
    const quantity = 3;
    const subtotal = unitPrice * quantity;
    const taxAmount = Math.round((subtotal * 18) / 100);
    const total = subtotal + taxAmount;
    expect(subtotal).toBe(0);
    expect(taxAmount).toBe(0);
    expect(total).toBe(0);
  });
});
