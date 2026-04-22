import { useMemo, useState } from 'react';
import Icon from './Icon';
import { extensionColor, formatSize } from '../utils/format';

function getFolderStats(node) {
  if (!node.children?.length) {
    return {
      fileCount: node.isDirectory ? 0 : 1,
      folderCount: node.isDirectory ? 1 : 0,
      totalBytes: node.size || 0
    };
  }

  return node.children.reduce(
    (accumulator, child) => {
      const childStats = getFolderStats(child);
      return {
        fileCount: accumulator.fileCount + childStats.fileCount,
        folderCount: accumulator.folderCount + childStats.folderCount,
        totalBytes: accumulator.totalBytes + childStats.totalBytes
      };
    },
    {
      fileCount: node.isDirectory ? 0 : 1,
      folderCount: node.isDirectory ? 1 : 0,
      totalBytes: node.size || 0
    }
  );
}

function fileType(node) {
  const segments = node.name.split('.');
  return segments.length > 1 ? `.${segments.pop().toLowerCase()}` : '';
}

function TreeBranch({ node, depth, expanded, onToggle, selectedPath, onSelectNode, onOpenFile }) {
  const stats = useMemo(() => getFolderStats(node), [node]);
  const isExpanded = expanded[node.path] ?? depth < 1;
  const isSelected = selectedPath === node.path;
  const tone = node.isDirectory ? 'folder' : extensionColor(fileType(node));

  return (
    <div className={`tree-branch ${isSelected ? 'selected' : ''}`}>
      <button
        className="tree-row"
        style={{ '--depth': depth }}
        onClick={() => {
          onSelectNode(node);
          if (node.isDirectory) {
            onToggle(node.path);
          } else {
            onOpenFile?.(node.path);
          }
        }}
      >
        <span className="tree-guides" aria-hidden="true" />
        <span className={`tree-icon tone-${tone}`}>
          <Icon name={node.isDirectory ? 'folder' : 'file'} />
        </span>
        <span className="tree-copy">
          <strong>{node.name}</strong>
          <small>
            Depth {depth} {node.isDirectory ? `• ${stats.fileCount} files` : `• ${formatSize(node.size)}`}
          </small>
        </span>
        {node.isDirectory ? (
          <span className="tree-meta">
            <span>{stats.folderCount - 1} dirs</span>
            <span>{stats.fileCount} files</span>
          </span>
        ) : (
          <span className="tree-meta">
            <span>{fileType(node) || 'file'}</span>
          </span>
        )}
      </button>

      {node.children?.length ? (
        <div className={`tree-children ${isExpanded ? 'open' : ''}`}>
          {node.children.map((child) => (
            <TreeBranch
              key={child.path}
              node={child}
              depth={depth + 1}
              expanded={expanded}
              onToggle={onToggle}
              selectedPath={selectedPath}
              onSelectNode={onSelectNode}
              onOpenFile={onOpenFile}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function StructureTree({ structure, selectedPath, onSelectNode, onOpenFile }) {
  const [expanded, setExpanded] = useState({});

  const totals = useMemo(
    () =>
      structure.reduce(
        (accumulator, node) => {
          const stats = getFolderStats(node);
          return {
            fileCount: accumulator.fileCount + stats.fileCount,
            folderCount: accumulator.folderCount + stats.folderCount,
            totalBytes: accumulator.totalBytes + stats.totalBytes
          };
        },
        { fileCount: 0, folderCount: 0, totalBytes: 0 }
      ),
    [structure]
  );

  return (
    <section className="surface-panel structure-panel">
      <div className="section-heading">
        <div>
          <h2>Project Structure Visualizer</h2>
          <p>DFS-based folder tree with VS Code style guides, smooth expansion, and file-type color coding.</p>
        </div>
      </div>

      <div className="tree-summary-grid">
        <article>
          <strong>{totals.folderCount}</strong>
          <span>Folders</span>
        </article>
        <article>
          <strong>{totals.fileCount}</strong>
          <span>Files</span>
        </article>
        <article>
          <strong>{formatSize(totals.totalBytes)}</strong>
          <span>Indexed size</span>
        </article>
      </div>

      <div className="tree-root">
        {structure.length ? (
          structure.map((node) => (
            <TreeBranch
              key={node.path}
              node={node}
              depth={0}
              expanded={expanded}
              onToggle={(path) => setExpanded((current) => ({ ...current, [path]: !(current[path] ?? true) }))}
              selectedPath={selectedPath}
              onSelectNode={onSelectNode}
              onOpenFile={onOpenFile}
            />
          ))
        ) : (
          <div className="empty-state">Scan a folder to visualize its structure.</div>
        )}
      </div>
    </section>
  );
}
