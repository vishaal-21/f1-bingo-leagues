/**
 * Dev Time Utility
 * Allows developers to shift the application's perceived time for testing
 * Time offset is stored in localStorage and persists across page reloads
 */

const DEV_TIME_OFFSET_KEY = 'dev_time_offset_ms';

/**
 * Get the current time with any dev offset applied
 */
export function getCurrentTime(): Date {
  const now = new Date();
  const offset = getTimeOffset();
  
  if (offset !== 0) {
    return new Date(now.getTime() + offset);
  }
  
  return now;
}

/**
 * Get the current time offset in milliseconds
 */
export function getTimeOffset(): number {
  if (typeof window === 'undefined') return 0;
  
  const stored = localStorage.getItem(DEV_TIME_OFFSET_KEY);
  return stored ? parseInt(stored, 10) : 0;
}

/**
 * Set the time offset in milliseconds
 */
export function setTimeOffset(offsetMs: number): void {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem(DEV_TIME_OFFSET_KEY, offsetMs.toString());
  
  // Dispatch custom event so components can react to time changes
  window.dispatchEvent(new CustomEvent('devTimeChange'));
}

/**
 * Add hours to the current offset
 */
export function addHours(hours: number): void {
  const currentOffset = getTimeOffset();
  const newOffset = currentOffset + (hours * 60 * 60 * 1000);
  setTimeOffset(newOffset);
}

/**
 * Add days to the current offset
 */
export function addDays(days: number): void {
  const currentOffset = getTimeOffset();
  const newOffset = currentOffset + (days * 24 * 60 * 60 * 1000);
  setTimeOffset(newOffset);
}

/**
 * Reset time offset to zero (real time)
 */
export function resetTimeOffset(): void {
  setTimeOffset(0);
}

/**
 * Check if dev time offset is active
 */
export function isDevTimeActive(): boolean {
  return getTimeOffset() !== 0;
}

/**
 * Get human-readable offset string
 */
export function getOffsetString(): string {
  const offset = getTimeOffset();
  if (offset === 0) return 'Real time';
  
  const hours = Math.floor(Math.abs(offset) / (60 * 60 * 1000));
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  
  const sign = offset > 0 ? '+' : '-';
  
  if (days > 0) {
    return `${sign}${days}d ${remainingHours}h`;
  }
  
  return `${sign}${hours}h`;
}
