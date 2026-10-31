/**
 * Calculates the next billing date based on start date and interval using UTC.
 * Safely handles month-end clamping (e.g., Jan 31 + 1 month -> Feb 28/29).
 *
 * @param {Date|string} fromDate
 * @param {'daily'|'weekly'|'monthly'|'yearly'} interval
 * @returns {Date}
 */
function calculateNextBillingDate(fromDate, interval) {
  const date = new Date(fromDate);
  if (isNaN(date.getTime())) {
    throw new Error('Invalid date provided to calculateNextBillingDate');
  }

  const result = new Date(date.getTime());

  switch (interval) {
    case 'daily': {
      result.setUTCDate(result.getUTCDate() + 1);
      break;
    }
    case 'weekly': {
      result.setUTCDate(result.getUTCDate() + 7);
      break;
    }
    case 'monthly': {
      const currentDay = result.getUTCDate();
      const currentMonth = result.getUTCMonth();
      const currentYear = result.getUTCFullYear();

      // Target month is currentMonth + 1
      const targetMonth = currentMonth + 1;
      const targetYear = currentYear + Math.floor(targetMonth / 12);
      const normalizedTargetMonth = targetMonth % 12;

      // Find max days in target month (passing 0 as day to next month gives last day of target month)
      const maxDaysInTargetMonth = new Date(Date.UTC(targetYear, normalizedTargetMonth + 1, 0)).getUTCDate();
      const targetDay = Math.min(currentDay, maxDaysInTargetMonth);

      result.setUTCFullYear(targetYear, normalizedTargetMonth, targetDay);
      break;
    }
    case 'yearly': {
      const currentDay = result.getUTCDate();
      const currentMonth = result.getUTCMonth();
      const targetYear = result.getUTCFullYear() + 1;

      // Handle leap year Feb 29 -> Feb 28
      const maxDaysInTargetMonth = new Date(Date.UTC(targetYear, currentMonth + 1, 0)).getUTCDate();
      const targetDay = Math.min(currentDay, maxDaysInTargetMonth);

      result.setUTCFullYear(targetYear, currentMonth, targetDay);
      break;
    }
    default:
      throw new Error(`Unsupported billing interval: ${interval}`);
  }

  return result;
}

module.exports = {
  calculateNextBillingDate
};
