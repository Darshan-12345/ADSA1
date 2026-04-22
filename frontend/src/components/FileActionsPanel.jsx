import { useEffect, useState } from 'react';
import { formatDate, formatSize } from '../utils/format';

export default function FileActionsPanel({
  file,
  onRename,
  onMove,
  onDelete,
  onMarkTemp,
  onRestoreTemp,
  onExtendTemp,
  onMarkImportant
}) {
  const [nextName, setNextName] = useState('');
  const [nextParent, setNextParent] = useState('');

  useEffect(() => {
    setNextName(file?.name || '');
    setNextParent(file?.parent || '');
  }, [file]);

  if (!file) {
    return <section className="surface-panel empty-panel">Choose a file from the explorer to rename, move, delete, or update its lifecycle.</section>;
  }

  return (
    <section className="surface-panel action-panel">
      <div className="section-heading">
        <div>
          <h2>File Actions</h2>
          <p>{file.path}</p>
        </div>
      </div>

      <div className="detail-grid compact">
        <div>
          <span className="detail-label">Size</span>
          <strong>{formatSize(file.size)}</strong>
        </div>
        <div>
          <span className="detail-label">Modified</span>
          <strong>{formatDate(file.lastWrite)}</strong>
        </div>
      </div>

      <label className="field">
        <span>Rename file</span>
        <input value={nextName} onChange={(event) => setNextName(event.target.value)} />
      </label>
      <button onClick={() => onRename(file, nextName)} disabled={!nextName || nextName === file.name}>
        Rename
      </button>

      <label className="field">
        <span>Move to folder</span>
        <input value={nextParent} onChange={(event) => setNextParent(event.target.value)} />
      </label>
      <button className="ghost-button" onClick={() => onMove(file, nextParent)} disabled={!nextParent || nextParent === file.parent}>
        Move
      </button>

      <div className="button-row">
        <button className="soft-button" onClick={() => onMarkImportant(file)}>
          {file.isImportant ? 'Unmark Important' : 'Mark Important'}
        </button>
        {file.isTemporary ? (
          <>
            <button className="soft-button" onClick={() => onExtendTemp(file, 1800)}>
              Extend 30 min
            </button>
            <button className="ghost-button" onClick={() => onRestoreTemp(file)}>
              Restore
            </button>
          </>
        ) : (
          <button className="soft-button" onClick={() => onMarkTemp(file, 900)}>
            Mark Temp
          </button>
        )}
      </div>

      <button className="danger-button" onClick={() => onDelete(file)}>
        Delete File
      </button>
    </section>
  );
}
