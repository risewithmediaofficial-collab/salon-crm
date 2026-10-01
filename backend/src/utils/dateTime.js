/**
 * Date/time utilities — all timezone-aware
 */

/**
 * Get the start of a day (midnight) in local timezone
 * @param {Date|string} date
 * @returns {Date}
 */
export function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Get end of day
 * @param {Date|string} date
 * @returns {Date}
 */
export function endOfDay(date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * Add minutes to a Date
 * @param {Date} date
 * @param {number} minutes
 * @returns {Date}
 */
export function addMinutes(date, minutes) {
  return new Date(new Date(date).getTime() + minutes * 60 * 1000);
}

/**
 * Check if two time ranges overlap
 * (a1, a2) and (b1, b2) — exclusive end
 * @returns {boolean}
 */
export function timesOverlap(a1, a2, b1, b2) {
  return a1 < b2 && a2 > b1;
}

/**
 * Parse "HH:MM" string into { hours, minutes }
 * @param {string} timeStr - "09:30"
 * @returns {{ hours: number, minutes: number }}
 */
export function parseTimeString(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return { hours, minutes };
}

/**
 * Set a time (HH:MM string) on a given date
 * @param {Date} date
 * @param {string} timeStr - "09:30"
 * @returns {Date}
 */
export function setTimeOnDate(date, timeStr) {
  const d = new Date(date);
  const { hours, minutes } = parseTimeString(timeStr);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

/**
 * Format a Date to "HH:MM"
 * @param {Date} date
 * @returns {string}
 */
export function formatTimeHHMM(date) {
  const d = new Date(date);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

/**
 * Format a Date to "YYYY-MM-DD"
 * @param {Date} date
 * @returns {string}
 */
export function formatDateYMD(date) {
  const d = new Date(date);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Get day-of-week index (0=Sun…6=Sat) from a Date
 * @param {Date} date
 * @returns {number}
 */
export function getDayOfWeek(date) {
  return new Date(date).getDay();
}

export function timeToMinutes(time24) {
  if (!time24) return 0;
  const [h, m] = time24.split(':').map(Number);
  return h * 60 + m;
}

export function minutesToTime(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

