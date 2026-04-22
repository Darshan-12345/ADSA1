import { useState } from 'react';
import PageHero from '../components/PageHero';
import FileResults from '../components/FileResults';
import { useAppData } from '../context/AppDataContext';
import { formatSize } from '../utils/format';

export default function BackupPage() {
  const { backupFiles, handleOptimizeBackup, loading } = useAppData();
  const [capacity, setCapacity] = useState(100); // KB

  const totalSelectedSize = backupFiles.reduce((sum, file) => sum + file.size, 0);

  return (
    <div className="page-stack">
      <PageHero
        eyebrow="Knapsack Optimizer (Unit V)"
        title="Smart Backup Selection"
        description="Using the 0/1 Knapsack algorithm (Dynamic Programming), the system picks the most important files that fit within your storage limit."
      />

      <section className="surface-panel">
        <div className="section-heading">
          <div>
            <h2>Optimization Settings</h2>
            <p>Set your target backup capacity and let the algorithm maximize the value.</p>
          </div>
        </div>

        <div className="filter-row" style={{ alignItems: 'flex-end', display: 'flex', gap: '20px' }}>
          <div className="field" style={{ flex: 1 }}>
            <span className="detail-label">Backup Capacity (KB)</span>
            <input
              type="number"
              value={capacity}
              onChange={(e) => setCapacity(Number(e.target.value))}
              min="1"
              className="scan-input"
              style={{ background: 'white', border: '1px solid var(--line)', borderRadius: '12px' }}
            />
          </div>
          <button 
            onClick={() => handleOptimizeBackup(capacity)} 
            disabled={loading}
            style={{ height: '48px', padding: '0 24px' }}
          >
            {loading ? 'Solving DP...' : 'Run Optimizer'}
          </button>
        </div>
      </section>

      <div className="overview-grid">
        <FileResults
          title={`Optimized Backup List (${backupFiles.length} files)`}
          results={backupFiles}
          emptyLabel="Enter a capacity and run the optimizer to see the best file selection based on importance and size."
        />

        <section className="surface-panel details-panel">
          <div className="section-heading">
            <div>
              <h2>Backup Summary</h2>
              <p>Algorithm analysis</p>
            </div>
          </div>
          <div className="detail-grid compact">
            <div>
              <span className="detail-label">Limit</span>
              <strong>{capacity} KB</strong>
            </div>
            <div>
              <span className="detail-label">Actual Size</span>
              <strong>{formatSize(totalSelectedSize)}</strong>
            </div>
            <div>
              <span className="detail-label">Files</span>
              <strong>{backupFiles.length} selected</strong>
            </div>
            <div>
              <span className="detail-label">Efficiency</span>
              <strong>{capacity > 0 ? Math.round((totalSelectedSize / (capacity * 1024)) * 100) : 0}%</strong>
            </div>
          </div>
          <div className="mini-list" style={{ marginTop: '20px' }}>
            <div style={{ background: 'var(--brand-soft)', border: '1px solid var(--brand)', color: 'var(--brand)' }}>
              <strong>Algorithm: 0/1 Knapsack</strong>
              <p className="helper-copy" style={{ color: 'inherit', opacity: 0.8 }}>
                Time Complexity: O(N * W)<br />
                Space Complexity: O(N * W)<br />
                Uses a 2D DP table to store sub-problem results.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
