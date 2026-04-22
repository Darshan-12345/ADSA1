import { formatDate, formatRelativeExpiry, formatSize } from '../utils/format';

export default function FilePreview({ file, preview, relatedFiles = [] }) {
  if (!file) {
    return <section className="surface-panel empty-panel">Select a file or node to inspect its details.</section>;
  }

  return (
    <section className="surface-panel details-panel">
      <div className="section-heading">
        <div>
          <h2>File Details</h2>
          <p>{file.path}</p>
        </div>
      </div>

      <div className="detail-grid">
        <div>
          <span className="detail-label">Name</span>
          <strong>{file.name}</strong>
        </div>
        <div>
          <span className="detail-label">Type</span>
          <strong>{file.extension || 'No extension'}</strong>
        </div>
        <div>
          <span className="detail-label">Size</span>
          <strong>{formatSize(file.size)}</strong>
        </div>
        <div>
          <span className="detail-label">Modified</span>
          <strong>{formatDate(file.lastWrite)}</strong>
        </div>
        <div>
          <span className="detail-label">Temporary</span>
          <strong>{file.isTemporary ? formatRelativeExpiry(file.expiresAt) : 'No'}</strong>
        </div>
        <div>
          <span className="detail-label">Relations</span>
          <strong>{relatedFiles.length}</strong>
        </div>
      </div>

      <div className="preview-block">
        <div className="mini-heading">Preview</div>
        <pre>{preview || 'Preview is unavailable for this file.'}</pre>
      </div>
    </section>
  );
}
