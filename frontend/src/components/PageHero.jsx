export default function PageHero({ eyebrow, title, description, actions, aside }) {
  return (
    <section className="page-hero">
      <div>
        {eyebrow ? <p className="page-eyebrow">{eyebrow}</p> : null}
        <h1>{title}</h1>
        <p className="page-description">{description}</p>
        {actions ? <div className="hero-actions">{actions}</div> : null}
      </div>
      {aside ? <div className="page-hero-aside">{aside}</div> : null}
    </section>
  );
}
