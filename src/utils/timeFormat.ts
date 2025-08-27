/**
 * Utility functions for time formatting
 */

/**
 * Converts minutes to a human-readable format of hours and minutes
 * @param totalMinutes - Total number of minutes
 * @returns Formatted string like "2h 30m" or "45m" or "1h"
 */
export function formatTimeFromMinutes(totalMinutes: number): string {
  if (totalMinutes < 1) {
    return '0m';
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.round(totalMinutes % 60);

  if (hours === 0) {
    return `${minutes}m`;
  } else if (minutes === 0) {
    return `${hours}h`;
  } else {
    return `${hours}h ${minutes}m`;
  }
}

/**
 * Formats a duration in minutes for display in test results
 * @param duration - Duration in minutes
 * @returns Formatted string like "2h 30m" or "45m"
 */
export function formatTestDuration(duration: number): string {
  return formatTimeFromMinutes(duration);
}
