const BASE_URL = 'http://localhost:18080';

async function request(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  });

  if (!response.ok) {
    let message = `Request failed for ${path}`;
    try {
      const data = await response.json();
      message = data.message || data.status || message;
    } catch {
      const text = await response.text();
      message = text || message;
    }
    throw new Error(message);
  }

  return response.json();
}

function post(path, body) {
  return request(path, {
    method: 'POST',
    body: JSON.stringify(body)
  });
}

export const api = {
  scanFolder: (path) => post('/scan-folder', { path }),
  search: (query) => request(`/search?q=${encodeURIComponent(query)}`),
  autocomplete: (prefix) => request(`/autocomplete?prefix=${encodeURIComponent(prefix)}`),
  getStructure: () => request('/get-structure'),
  relatedFiles: (path) => request(`/related-files?path=${encodeURIComponent(path)}`),
  preview: (path) => request(`/preview?path=${encodeURIComponent(path)}`),
  markTemporary: (path, ttlSeconds) => post('/mark-temp', { path, ttlSeconds }),
  restoreTemporary: (path) => post('/restore-temp', { path }),
  extendTemporary: (path, ttlSeconds) => post('/extend-temp', { path, ttlSeconds }),
  markImportant: (path, important = true) => post('/mark-important', { path, important: important ? 1 : 0 }),
  deleteExpired: () => post('/delete-expired', {}),
  renameFile: (path, nextName) => post('/rename-file', { path, nextName }),
  moveFile: (path, nextParent) => post('/move-file', { path, nextParent }),
  deleteFile: (path) => post('/delete-file', { path }),
  optimizeBackup: (capacity) => request(`/optimize-backup?capacity=${capacity}`)
};
