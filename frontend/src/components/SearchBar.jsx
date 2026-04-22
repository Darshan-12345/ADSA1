export default function SearchBar({ value, onChange, onSearch, suggestions, filters, onFilterChange, loading }) {
  return (
    <section className="search-hero-card">
      <div>
        <p className="page-eyebrow">Search Engine + Trie</p>
        <h2>Search across names, content, and indexed terms</h2>
        <p className="page-description">Use autocomplete suggestions from the trie, then narrow the result set with client-side filters.</p>
      </div>

      <div className="search-hero-controls">
        <div className="search-input-row">
          <input
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && onSearch(value)}
            placeholder="Search documents, keywords, extensions, or phrases"
          />
          <button onClick={() => onSearch(value)}>{loading ? 'Searching...' : 'Search'}</button>
        </div>

        {suggestions.length ? (
          <div className="suggestion-pills">
            {suggestions.map((suggestion) => (
              <button key={suggestion} className="suggestion-pill" onClick={() => onSearch(suggestion)}>
                {suggestion}
              </button>
            ))}
          </div>
        ) : null}

        <div className="filter-row">
          <select value={filters.extension} onChange={(event) => onFilterChange('extension', event.target.value)}>
            <option value="all">All types</option>
            <option value=".txt">Text</option>
            <option value=".md">Markdown</option>
            <option value=".log">Log</option>
            <option value=".tmp">Temp</option>
          </select>
          <select value={filters.size} onChange={(event) => onFilterChange('size', event.target.value)}>
            <option value="all">Any size</option>
            <option value="small">Under 10 KB</option>
            <option value="medium">10 KB - 100 KB</option>
            <option value="large">Over 100 KB</option>
          </select>
          <select value={filters.date} onChange={(event) => onFilterChange('date', event.target.value)}>
            <option value="all">Any date</option>
            <option value="day">Last 24 hours</option>
            <option value="week">Last 7 days</option>
            <option value="month">Last 30 days</option>
          </select>
        </div>
      </div>
    </section>
  );
}
