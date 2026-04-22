import Icon from './Icon';

export default function MetricCard({ label, value, hint, icon, tone = 'default' }) {
  return (
    <article className={`metric-card tone-${tone}`}>
      <div className="metric-icon">
        <Icon name={icon} />
      </div>
      <div>
        <p className="metric-label">{label}</p>
        <h3>{value}</h3>
        <p className="metric-hint">{hint}</p>
      </div>
    </article>
  );
}
