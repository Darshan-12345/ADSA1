import { useState } from 'react';
import FilePreview from '../components/FilePreview';
import Icon from '../components/Icon';
import MetricCard from '../components/MetricCard';
import PageHero from '../components/PageHero';
import RelationshipGraph from '../components/RelationshipGraph';
import { useAppData } from '../context/AppDataContext';

export default function RelationshipsPage() {
  const { selectedFile, relatedFiles, preview, selectFile, allFiles } = useAppData();
  const [localQuery, setLocalQuery] = useState('');

  const filteredSuggestions = allFiles
    .filter(f => f.name.toLowerCase().includes(localQuery.toLowerCase()))
    .slice(0, 5);

  return (
    <div className="page-stack">
      <PageHero
        eyebrow="Graph Relationships"
        title="Visualizing Data Connections"
        description="Select a node to explore its adjacency list. This demonstrates how graph data structures can map complex file relationships."
      />

      {!selectedFile ? (
        <section className="surface-panel empty-graph-state">
          <div className="section-heading centered">
            <Icon name="graph" className="large-icon" />
            <h2>No File Selected</h2>
            <p>Search or pick a file below to visualize its graph relationships.</p>
          </div>

          <div className="graph-selector">
            <div className="topbar-search" style={{ margin: '0 auto 20px', maxWidth: '500px' }}>
              <Icon name="search" />
              <input 
                placeholder="Find a file to start the graph..." 
                value={localQuery}
                onChange={(e) => setLocalQuery(e.target.value)}
              />
            </div>

            <div className="suggestion-chips">
              {filteredSuggestions.map(file => (
                <button key={file.path} className="chip" onClick={() => selectFile(file.path)}>
                  <Icon name="file" />
                  <span>{file.name}</span>
                </button>
              ))}
            </div>
          </div>
        </section>
      ) : (
        <>
          <section className="metrics-grid three-up">
            <MetricCard label="Focused Node" value={selectedFile.name} hint="The central node of our graph." icon="graph" tone="blue" />
            <MetricCard label="Adjacent Files" value={relatedFiles.length} hint="Direct neighbors in the adjacency list." icon="structure" tone="emerald" />
            <MetricCard label="Graph Type" value="Adjacency List" hint="Data structure used: std::unordered_map" icon="search" tone="amber" />
          </section>

          <section className="relationship-layout">
            <RelationshipGraph file={selectedFile} relatedFiles={relatedFiles} onExplore={selectFile} />
            <FilePreview file={selectedFile} preview={preview} relatedFiles={relatedFiles} />
          </section>
        </>
      )}
    </div>
  );
}
