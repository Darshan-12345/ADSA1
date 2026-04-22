export function formatSize(bytes) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit += 1;
  }
  return `${size.toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`;
}

export function formatDate(epochSeconds) {
  if (!epochSeconds) return 'Unknown';
  return new Date(epochSeconds * 1000).toLocaleString();
}

export function formatRelativeExpiry(expiresAt) {
  if (!expiresAt) return 'No expiry';
  const delta = expiresAt * 1000 - Date.now();
  if (delta <= 0) return 'Expired';
  const minutes = Math.round(delta / 60000);
  if (minutes < 60) return `${minutes} min left`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours} hr left`;
  const days = Math.round(hours / 24);
  return `${days} day left`;
}

export function extensionColor(extension) {
  const normalized = (extension || '').toLowerCase();
  if (['.txt', '.md'].includes(normalized)) return 'emerald';
  if (['.log', '.tmp'].includes(normalized)) return 'amber';
  if (['.cpp', '.h', '.js', '.jsx'].includes(normalized)) return 'blue';
  return 'slate';
}
