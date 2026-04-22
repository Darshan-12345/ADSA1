import { useDeferredValue, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import FilePreview from '../components/FilePreview';
import FileResults from '../components/FileResults';
import SearchBar from '../components/SearchBar';
import { useAppData } from '../context/AppDataContext';

function matchesSize(file, sizeFilter) {
  if (sizeFilter === 'small') return file.size < 10 * 1024;
  if (sizeFilter === 'medium') return file.size >= 10 * 1024 && file.size <= 100 * 1024;
  if (sizeFilter === 'large') return file.size > 100 * 1024;
  return true;
}

function matchesDate(file, dateFilter) {
  if (dateFilter === 'all' || !file.lastWrite) return true;
  const delta = Date.now() - file.lastWrite * 1000;
  if (dateFilter === 'day') return delta <= 24 * 60 * 60 * 1000;
  if (dateFilter === 'week') return delta <= 7 * 24 * 60 * 60 * 1000;
  if (dateFilter === 'month') return delta <= 30 * 24 * 60 * 60 * 1000;
  return true;
}

export default function SearchPage() {
  const { openMenu } = useOutletContext();
  const { query, setQuery, suggestions, searchResults, runSearch, selectFile, selectedFile, preview, relatedFiles, loading } = useAppData();
  const [filters, setFilters] = useState({ extension: 'all', size: 'all', date: 'all' });
  const deferredQuery = useDeferredValue(query);

  const filteredResults = useMemo(
    () =>
      searchResults.filter((file) => {
        const extensionMatch = filters.extension === 'all' || file.extension === filters.extension;
        return extensionMatch && matchesSize(file, filters.size) && matchesDate(file, filters.date);
      }),
    [filters, searchResults]
  );

  return (
    <div className="page-stack">
      <SearchBar
        value={query}
        onChange={setQuery}
        onSearch={runSearch}
        suggestions={suggestions}
        filters={filters}
        onFilterChange={(key, value) => setFilters((current) => ({ ...current, [key]: value }))}
        loading={loading}
      />

      <section className="content-grid two-one">
        <FileResults
          title="Matched Results"
          results={filteredResults}
          onPreview={selectFile}
          onContextMenu={openMenu}
          selectedPath={selectedFile?.path}
          query={deferredQuery}
          emptyLabel="Try scanning a folder or broadening the search terms."
        />
        <FilePreview file={selectedFile} preview={preview} relatedFiles={relatedFiles} />
      </section>
    </div>
  );
}
