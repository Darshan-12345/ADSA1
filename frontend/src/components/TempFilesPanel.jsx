import { formatDate, formatRelativeExpiry, formatSize } from '../utils/format';

export default function TempFilesPanel({ files, onPreview, onExtendTemp, onRestoreTemp, onDelete, onDeleteExpired }) {
  return (
    <section className="surface-panel">
      <div className="section-heading">
        <div>
          <h2>Temporary File Watchlist</h2>
          <p>Heap-based expiry monitoring with manual recovery and extension actions.</p>
        </div>
        <button className="ghost-button" onClick={onDeleteExpired}>
          Delete Expired
        </button>
      </div>

      <div className="temp-grid">
        {files.length ? (
          files.map((file) => {
            const expiringSoon = file.expiresAt && file.expiresAt * 1000 - Date.now() < 15 * 60 * 1000;
            return (
              <article key={file.path} className={`temp-card ${expiringSoon ? 'expiring' : ''}`}>
                <div>
                  <h3>{file.name}</h3>
                  <p>{file.path}</p>
                </div>
                <div className="temp-meta">
                  <span>{formatSize(file.size)}</span>
                  <span>{formatDate(file.lastWrite)}</span>
                  <span className={`chip ${expiringSoon ? 'chip-warn' : 'chip-neutral'}`}>{formatRelativeExpiry(file.expiresAt)}</span>
                </div>
                <div className="button-row">
                  <button onClick={() => onPreview(file)}>Open</button>
                  <button className="soft-button" onClick={() => onExtendTemp(file, 1800)}>
                    Extend
                  </button>
                  <button className="ghost-button" onClick={() => onRestoreTemp(file)}>
                    Restore
                  </button>
                  <button className="danger-button" onClick={() => onDelete(file)}>
                    Delete
                  </button>
                </div>
              </article>
            );
          })
        ) : (
          <div className="empty-state">No temporary files are currently tracked.</div>
        )}
      </div>
    </section>
  );
}
