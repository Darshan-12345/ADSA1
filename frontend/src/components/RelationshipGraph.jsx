import Icon from './Icon';

export default function RelationshipGraph({ file, relatedFiles, onExplore }) {
  return (
    <section className="surface-panel relationship-panel">
      <div className="section-heading">
        <div>
          <h2>File Relationship Graph</h2>
          <p>BFS/DFS adjacency exploration across duplicates, shared folders, and extension-based links.</p>
        </div>
      </div>

      {file ? (
        <div className="graph-container">
          <div className="graph-orbit">
            <div className="graph-core">
              <div className="core-pulse" />
              <div className="core-content">
                <Icon name="file" />
                <span className="core-name">{file.name}</span>
                <span className="core-label">Central Node</span>
              </div>
            </div>

            {relatedFiles.slice(0, 8).map((item, index) => (
              <div 
                key={item.path} 
                className="node-wrapper"
                style={{ '--index': index, '--total': Math.min(relatedFiles.length, 8) }}
              >
                <div className="connection-line" />
                <button
                  className="graph-node"
                  onClick={() => onExplore(item.path)}
                  title={item.path}
                >
                  <span className="node-icon">{item.extension || 'file'}</span>
                  <span className="node-text">{item.name}</span>
                </button>
              </div>
            ))}
          </div>

          <div className="relationship-sidebar">
            <div className="sidebar-header">
              <strong>Adjacency List</strong>
              <span>({relatedFiles.length} connections)</span>
            </div>
            <div className="relationship-list">
              {relatedFiles.length ? (
                relatedFiles.map((item) => (
                  <button key={item.path} className="relationship-item" onClick={() => onExplore(item.path)}>
                    <div className="item-info">
                      <strong>{item.name}</strong>
                      <span>{item.extension.toUpperCase()} File • {item.parent}</span>
                    </div>
                    <div className="item-badge">Related</div>
                  </button>
                ))
              ) : (
                <div className="empty-state">No graph neighbors found.</div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="empty-state">Select a file to visualize its graph relationships.</div>
      )}
    </section>
  );
}
