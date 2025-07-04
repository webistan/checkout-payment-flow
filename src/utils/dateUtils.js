/**
 * Formats a timestamp into a localized date string with UTC timezone
 * @param {string|number} timestamp - The timestamp to format
 * @returns {string} Formatted date string (e.g., "March 15, 2024 at 08:43:33 UTC")
 */
export const formatDateWithUTC = (timestamp) => {
  if (!timestamp) return 'N/A';

  return new Date(timestamp)
    .toLocaleString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'UTC',
      timeZoneName: 'short',
    })
    .replace(' at', ' at');
};

/**
 * Returns a human-readable string for how long ago a date was updated.
 * @param {string} isoDate - ISO date string
 * @returns {string}
 */
export function getUpdatedAgoString(isoDate) {
  if (!isoDate) return '';

  const now = new Date();
  const updated = new Date(isoDate);

  const nowDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const updatedDateOnly = new Date(updated.getFullYear(), updated.getMonth(), updated.getDate());

  const diffMs = nowDateOnly - updatedDateOnly;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Updated today';
  if (diffDays === 1) return 'Updated yesterday';
  if (diffDays < 7) return `Updated ${diffDays} days ago`;

  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks === 1) return 'Updated 1 week ago';
  if (diffWeeks < 5) return `Updated ${diffWeeks} weeks ago`;

  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths === 1) return 'Updated 1 month ago';
  if (diffMonths < 12) return `Updated ${diffMonths} months ago`;

  const diffYears = Math.floor(diffDays / 365);
  if (diffYears === 1) return 'Updated 1 year ago';
  return `Updated ${diffYears} years ago`;
}
