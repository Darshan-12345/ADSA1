import { Link } from 'react-router-dom';
import MetricCard from '../components/MetricCard';
import PageHero from '../components/PageHero';
import { useAppData } from '../context/AppDataContext';
import { formatSize } from '../utils/format';

export default function OverviewPage() {
  const { stats, tempFiles, insights, handleScan, handleDeleteExpired } = useAppData();

  return (
    <div className="page-stack">
      <PageHero
        eyebrow="Dashboard"
        title="AetherDocs: Advanced Knowledge Nexus"
        description="This dashboard ties together inverted indexing, trie autocomplete, DFS structure analysis, BFS/DFS relationships, and heap-based temporary file cleanup into one polished workspace."
        actions={
          <>
            <button onClick={() => handleScan()}>Scan Folder</button>
            <button className="ghost-button" onClick={handleDeleteExpired}>
              Clean Up Expired
            </button>
          </>
        }
        aside={
          <div className="hero-aside-card">
            <span>Total indexed size</span>
            <strong>{formatSize(stats.totalSize)}</strong>
            <p>{stats.important} important files currently pinned for quick access.</p>
          </div>
        }
      />

      <section className="metrics-grid">
        <MetricCard label="Total Files" value={stats.totalFiles} hint="Indexed by the search engine." icon="dashboard" tone="emerald" />
        <MetricCard label="Duplicate Groups" value={stats.duplicates} hint="Found through content signatures." icon="insights" tone="amber" />
        <MetricCard label="Temporary Files" value={stats.temporary} hint="Tracked in the expiry heap." icon="temporary" tone="blue" />
        <MetricCard label="Folders" value={stats.folders} hint="Discovered with DFS traversal." icon="structure" tone="slate" />
      </section>

      <section className="overview-grid">
        <article className="surface-panel">
          <div className="section-heading">
            <div>
              <h2>Quick Actions</h2>
              <p>Jump straight into the workflows that best demonstrate the project.</p>
            </div>
          </div>
          <div className="action-link-grid">
            <Link to="/search" className="action-link-card">Search + Autocomplete</Link>
            <Link to="/explorer" className="action-link-card">File Explorer</Link>
            <Link to="/structure" className="action-link-card">Structure Visualizer</Link>
            <Link to="/relationships" className="action-link-card">Relationship Graph</Link>
          </div>
        </article>

        <article className="surface-panel">
          <div className="section-heading">
            <div>
              <h2>System Snapshot</h2>
              <p>A quick reading of the current indexed workspace.</p>
            </div>
          </div>
          <div className="mini-list">
            <div><strong>{tempFiles.length}</strong><span>Temp files ready for cleanup or restore</span></div>
            <div><strong>{insights.largeFiles.length}</strong><span>Large files surfaced as top size candidates</span></div>
            <div><strong>{insights.unusedFiles.length}</strong><span>Potential cleanup targets and delete suggestions</span></div>
          </div>
        </article>
      </section>
    </div>
  );
}
