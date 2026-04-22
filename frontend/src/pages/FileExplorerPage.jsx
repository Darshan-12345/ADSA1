import { useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import FileActionsPanel from '../components/FileActionsPanel';
import FilePreview from '../components/FilePreview';
import FileResults from '../components/FileResults';
import PageHero from '../components/PageHero';
import { useAppData } from '../context/AppDataContext';

export default function FileExplorerPage() {
  const { openMenu } = useOutletContext();
  const {
    allFiles,
    structureNodes,
    selectedFile,
    preview,
    relatedFiles,
    selectFile,
    handleRename,
    handleMove,
    handleDelete,
    handleMarkTemp,
    handleRestoreTemp,
    handleExtendTemp,
    handleMarkImportant
  } = useAppData();
  const [selectedFolder, setSelectedFolder] = useState('all');

  const folders = useMemo(() => structureNodes.filter((node) => node.isDirectory), [structureNodes]);
  const visibleFiles = useMemo(
    () => (selectedFolder === 'all' ? allFiles : allFiles.filter((file) => file.parent === selectedFolder)),
    [allFiles, selectedFolder]
  );

  return (
    <div className="page-stack">
      <PageHero
        eyebrow="File Explorer"
        title="Manage files directly from the indexed workspace"
        description="Browse folders, open a file preview, and perform rename, move, delete, important, and temporary lifecycle actions from one place."
        aside={
          <label className="field">
            <span>Folder focus</span>
            <select value={selectedFolder} onChange={(event) => setSelectedFolder(event.target.value)}>
              <option value="all">All folders</option>
              {folders.map((folder) => (
                <option key={folder.path} value={folder.path}>
                  {folder.name}
                </option>
              ))}
            </select>
          </label>
        }
      />

      <section className="content-grid explorer-grid">
        <FileResults
          title="Files"
          results={visibleFiles}
          onPreview={selectFile}
          onContextMenu={openMenu}
          selectedPath={selectedFile?.path}
          emptyLabel="No files exist in the selected folder."
        />
        <FileActionsPanel
          file={selectedFile}
          onRename={handleRename}
          onMove={handleMove}
          onDelete={handleDelete}
          onMarkTemp={handleMarkTemp}
          onRestoreTemp={handleRestoreTemp}
          onExtendTemp={handleExtendTemp}
          onMarkImportant={handleMarkImportant}
        />
        <FilePreview file={selectedFile} preview={preview} relatedFiles={relatedFiles} />
      </section>
    </div>
  );
}
