import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import ContextMenu from '../components/ContextMenu';
import Icon from '../components/Icon';
import { useAppData } from '../context/AppDataContext';
import { useContextMenu } from '../hooks/useContextMenu';

const navItems = [
  { to: '/', label: 'Dashboard', icon: 'dashboard', end: true },
  { to: '/search', label: 'Search', icon: 'search' },
  { to: '/explorer', label: 'Explorer', icon: 'explorer' },
  { to: '/structure', label: 'Structure', icon: 'structure' },
  { to: '/insights', label: 'Insights', icon: 'insights' },
  { to: '/temporary', label: 'Temporary', icon: 'temporary' },
  { to: '/relationships', label: 'Relationships', icon: 'graph' },
  { to: '/backup', label: 'Backup', icon: 'explorer' }
];

export default function AppLayout() {
  const navigate = useNavigate();
  const {
    query,
    setQuery,
    suggestions,
    scanPath,
    setScanPath,
    stats,
    loading,
    error,
    runSearch,
    handleScan,
    handleMarkImportant,
    handleMarkTemp
  } = useAppData();
  const { menu, openMenu, closeMenu } = useContextMenu();

  return (
    <div className="dashboard-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <div className="brand-mark">
            <Icon name="spark" />
          </div>
          <div>
            <strong>AetherDocs</strong>
            <p>Intelligent Knowledge Nexus</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-card">
          <p className="sidebar-card-label">Workspace</p>
          <strong>{stats.totalFiles} indexed files</strong>
          <span>{stats.temporary} temporary • {stats.duplicates} duplicate groups</span>
        </div>
      </aside>

      <main className="main-stage">
        <header className="topbar">
          <div className="topbar-search">
            <Icon name="search" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  runSearch(query);
                  navigate('/search');
                }
              }}
              placeholder="Jump into search, relationships, or structure..."
            />
            {suggestions.length ? (
              <div className="topbar-suggestions">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => {
                      setQuery(suggestion);
                      runSearch(suggestion);
                      navigate('/search');
                    }}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="topbar-actions">
            <input value={scanPath} onChange={(event) => setScanPath(event.target.value)} className="scan-input" />
            <button className="ghost-button" onClick={() => handleScan()}>
              {loading ? 'Refreshing...' : 'Scan Folder'}
            </button>
            <button className="avatar-button">
              <Icon name="user" />
            </button>
          </div>
        </header>

        {error ? <div className="banner error-banner">{error}</div> : null}
        {loading ? <div className="banner info-banner">Syncing indexed workspace and backend APIs...</div> : null}

        <Outlet context={{ openMenu }} />
      </main>

      <ContextMenu
        menu={menu}
        onMarkTemp={(file) => {
          handleMarkTemp(file);
          closeMenu();
        }}
        onMarkImportant={(file) => {
          handleMarkImportant(file);
          closeMenu();
        }}
      />
    </div>
  );
}
