import { useMemo, useState } from 'react';
import PageHero from '../components/PageHero';
import Icon from '../components/Icon';
import StructureTree from '../components/StructureTree';
import { useAppData } from '../context/AppDataContext';
import { formatSize } from '../utils/format';

function findNode(nodes, targetPath) {
  for (const node of nodes) {
    if (node.path === targetPath) return node;
    if (node.children?.length) {
      const match = findNode(node.children, targetPath);
      if (match) return match;
    }
  }
  return null;
}

function generateTerminalTree(node, prefix = '') {
  if (!node) return '';
  let output = `${node.name}${node.isDirectory ? '/' : ''}\n`;

  if (node.children && node.children.length > 0) {
    node.children.forEach((child, index) => {
      const isLast = index === node.children.length - 1;
      const connector = isLast ? '└── ' : '├── ';
      const newPrefix = prefix + (isLast ? '    ' : '│   ');
      output += prefix + connector + generateTerminalTree(child, newPrefix);
    });
  }
  return output;
}

export default function StructurePage() {
  const { structure, allFiles, selectFile, selectedFile, rootPath } = useAppData();
  const [selectedNodePath, setSelectedNodePath] = useState('');

  const selectedNode = useMemo(() => findNode(structure, selectedNodePath), [selectedNodePath, structure]);
  const rootDepth = structure[0]?.path ? structure[0].path.split(/[\\/]/).length : 0;

  const pathSegments = useMemo(() => {
    if (!selectedNodePath) return [];
    const segments = selectedNodePath.replace(rootPath || '', '').split(/[\\/]/).filter(Boolean);
    return segments;
  }, [selectedNodePath, rootPath]);

  return (
    <div className="page-stack">
      <PageHero
        eyebrow="Structure Visualizer"
        title="Project Hierarchy & DFS Trace"
        description="Explore the folder hierarchy. Select any node to see the visual DFS traversal path showing how the engine discovered it."
      />

      <section className="content-grid two-one">
        <StructureTree
          structure={structure}
          selectedPath={selectedNodePath}
          onSelectNode={(node) => setSelectedNodePath(node.path)}
          onOpenFile={selectFile}
        />

        <section className="surface-panel details-panel">
          <div className="section-heading">
            <div>
              <h2>Traversal Insights</h2>
              <p>{selectedNode ? selectedNode.name : 'Select a node to trace the DFS path.'}</p>
            </div>
          </div>

          {selectedNode ? (
            <>
              <div className="traversal-trace">
                <span className="detail-label">DFS Node Visualization</span>
                <div className="trace-node-tree">
                  <div className="node-item root">
                    <div className="node-circle">root</div>
                    <span className="node-label">Start</span>
                  </div>
                  {pathSegments.map((segment, index) => (
                    <div key={index} className="node-item">
                      <div className="node-connector">
                        <Icon name="chevron-right" />
                      </div>
                      <div className="node-circle">{segment.substring(0, 3)}</div>
                      <span className="node-label">{segment}</span>
                    </div>
                  ))}
                </div>
              </div>

              {selectedNode.isDirectory && (
                <div className="terminal-window">
                  <div className="terminal-header">
                    <div className="terminal-dots">
                      <span /> <span /> <span />
                    </div>
                    <div className="terminal-title">
                      <Icon name="terminal" />
                      <span>Bash — {selectedNode.name}</span>
                    </div>
                  </div>
                  <pre className="terminal-body">
                    {generateTerminalTree(selectedNode)}
                  </pre>
                </div>
              )}

              <div className="detail-grid compact">
                <div>
                  <span className="detail-label">Type</span>
                  <strong>{selectedNode.isDirectory ? 'Folder' : 'File'}</strong>
                </div>
                <div>
                  <span className="detail-label">DFS Depth</span>
                  <strong>{selectedNode.path.split(/[\\/]/).length - rootDepth}</strong>
                </div>
                <div>
                  <span className="detail-label">Contents</span>
                  <strong>{selectedNode.children?.length || 0} items</strong>
                </div>
                <div>
                  <span className="detail-label">Total Size</span>
                  <strong>{formatSize(selectedNode.size)}</strong>
                </div>
              </div>
            </>
          ) : (
            <div className="empty-state">Select a folder to see how the Depth-First Search algorithm explores the project structure.</div>
          )}

          {selectedNode && !selectedNode.isDirectory ? (
            <button className="full-width-btn" onClick={() => selectFile(selectedNode.path)}>
              Open File Preview
            </button>
          ) : null}

          <div className="mini-list" style={{ marginTop: '20px' }}>
            <div>
              <strong>DFS Algorithm Trace</strong>
              <p className="helper-copy" style={{ margin: '4px 0 0' }}>
                The engine uses a recursive Depth-First Search to build this tree. It visits the root, then dives into each sub-folder completely before returning.
              </p>
            </div>
          </div>
        </section>
      </section>
    </div>
  );
}
