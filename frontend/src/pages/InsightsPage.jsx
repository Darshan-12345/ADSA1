import FilePreview from '../components/FilePreview';
import InsightsPanel from '../components/InsightsPanel';
import MetricCard from '../components/MetricCard';
import PageHero from '../components/PageHero';
import { useAppData } from '../context/AppDataContext';

export default function InsightsPage() {
  const { insights, selectedFile, preview, relatedFiles, selectFile } = useAppData();

  return (
    <div className="page-stack">
      <PageHero
        eyebrow="Insights"
        title="Visual cleanup and optimization signals"
        description="Review duplicates, large files, and unused files in a way that makes delete suggestions and storage patterns easy to present."
      />

      <section className="metrics-grid three-up">
        <MetricCard label="Duplicate Groups" value={insights.duplicateFiles.length} hint="Shared signatures linked into graph edges." icon="insights" tone="amber" />
        <MetricCard label="Large Files" value={insights.largeFiles.length} hint="Top file sizes highlighted for inspection." icon="dashboard" tone="blue" />
        <MetricCard label="Unused Files" value={insights.unusedFiles.length} hint="Likely cleanup candidates and delete suggestions." icon="temporary" tone="emerald" />
      </section>

      <section className="content-grid two-one">
        <InsightsPanel insights={insights} onSelect={selectFile} />
        <FilePreview file={selectedFile} preview={preview} relatedFiles={relatedFiles} />
      </section>
    </div>
  );
}
