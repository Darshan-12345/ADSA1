import { extensionColor, formatDate, formatRelativeExpiry, formatSize } from '../utils/format';

function Highlight({ text, query }) {
  if (!query?.trim()) return text;
  const tokens = query
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!tokens.length) return text;

  const pattern = new RegExp(`(${tokens.map((token) => token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'ig');
  const parts = String(text).split(pattern);

  return parts.map((part, index) =>
    tokens.some((token) => token.toLowerCase() === part.toLowerCase()) ? (
      <mark key={`${part}-${index}`}>{part}</mark>
    ) : (
      <span key={`${part}-${index}`}>{part}</span>
    )
  );
}

export default function FileResults({ title, results, onPreview, onContextMenu, selectedPath, query, emptyLabel = 'No files to show.' }) {
  return (
    <section className="surface-panel">
      <div className="section-heading">
        <div>
          <h2>{title}</h2>
          <p>{results.length} files available</p>
        </div>
      </div>

      <div className="result-list">
        {results.length ? (
          results.map((file) => (
            <article
              key={file.path}
              className={`result-card ${selectedPath === file.path ? 'active' : ''}`}
              onClick={() => onPreview(file)}
              onContextMenu={(event) => onContextMenu?.(event, file)}
            >
              <div className="result-card-main">
                <div className={`file-badge tone-${extensionColor(file.extension)}`}>{file.extension || 'FILE'}</div>
                <div>
                  <h3>
                    <Highlight text={file.name} query={query} />
                  </h3>
                  <p>
                    <Highlight text={file.parent || file.path} query={query} />
                  </p>
                </div>
              </div>

              <div className="result-meta">
                <span>{formatSize(file.size)}</span>
                <span>{formatDate(file.lastWrite)}</span>
                {file.score ? <span>Score {file.score}</span> : null}
                {file.isImportant ? <span className="chip chip-accent">Important</span> : null}
                {file.isTemporary ? <span className="chip chip-warn">{formatRelativeExpiry(file.expiresAt)}</span> : null}
              </div>
            </article>
          ))
        ) : (
          <div className="empty-state">{emptyLabel}</div>
        )}
      </div>
    </section>
  );
}
