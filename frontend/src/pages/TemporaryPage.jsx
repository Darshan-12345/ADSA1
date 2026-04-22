import FilePreview from '../components/FilePreview';
import PageHero from '../components/PageHero';
import TempFilesPanel from '../components/TempFilesPanel';
import { useAppData } from '../context/AppDataContext';

export default function TemporaryPage() {
  const { tempFiles, selectedFile, preview, relatedFiles, selectFile, handleExtendTemp, handleRestoreTemp, handleDelete, handleDeleteExpired } =
    useAppData();

  return (
    <div className="page-stack">
      <PageHero
        eyebrow="Temporary Files"
        title="Lifecycle controls for expiring documents"
        description="Use the heap-powered temporary file system to monitor countdowns, flag urgent expiries, restore preserved files, or remove them entirely."
      />

      <section className="content-grid two-one">
        <TempFilesPanel
          files={tempFiles}
          onPreview={selectFile}
          onExtendTemp={handleExtendTemp}
          onRestoreTemp={handleRestoreTemp}
          onDelete={handleDelete}
          onDeleteExpired={handleDeleteExpired}
        />
        <FilePreview file={selectedFile} preview={preview} relatedFiles={relatedFiles} />
      </section>
    </div>
  );
}
