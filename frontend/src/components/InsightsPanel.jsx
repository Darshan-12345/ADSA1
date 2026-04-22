function InsightGroup({ title, items, tone, onSelect }) {
  return (
    <section className={`insight-group tone-${tone}`}>
      <div className="section-heading small">
        <div>
          <h3>{title}</h3>
          <p>{items.length} items</p>
        </div>
      </div>
      <div className="insight-list">
        {items.length ? (
          items.map((item) => {
            const key = Array.isArray(item) ? item.join('|') : item;
            return (
              <button key={key} className="insight-item" onClick={() => onSelect?.(Array.isArray(item) ? item[0] : item)}>
                {Array.isArray(item) ? `${item.length} matching duplicates` : item.split(/[\\/]/).pop()}
                <small>{Array.isArray(item) ? item.join(' • ') : item}</small>
              </button>
            );
          })
        ) : (
          <div className="empty-state">No files in this bucket right now.</div>
        )}
      </div>
    </section>
  );
}

export default function InsightsPanel({ insights, onSelect }) {
  return (
    <div className="insight-grid">
      <InsightGroup title="Duplicate Files" items={insights.duplicateFiles || []} tone="amber" onSelect={onSelect} />
      <InsightGroup title="Large Files" items={insights.largeFiles || []} tone="blue" onSelect={onSelect} />
      <InsightGroup title="Unused Files" items={insights.unusedFiles || []} tone="emerald" onSelect={onSelect} />
    </div>
  );
}
