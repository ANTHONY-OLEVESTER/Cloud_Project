export default function PageHero({ title, subtitle, badge, illustration, actions, children }) {
  return (
    <section className="page-hero">
      <div className="page-hero__content">
        {badge ? <span className="page-hero__badge">{badge}</span> : null}
        <h1>{title}</h1>
        {subtitle ? <p>{subtitle}</p> : null}
        {children ? <div className="page-hero__extras">{children}</div> : null}
        {actions ? <div className="page-hero__actions">{actions}</div> : null}
      </div>
      {illustration ? (
        <div className="page-hero__illustration" aria-hidden="true">
          <img src={illustration} alt="" loading="lazy" />
        </div>
      ) : null}
    </section>
  );
}
