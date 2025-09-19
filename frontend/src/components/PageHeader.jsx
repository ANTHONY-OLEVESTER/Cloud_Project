import clsx from "clsx";

export default function PageHeader({
  eyebrow,
  title,
  description,
  image,
  actions,
  children,
  tone = "default",
}) {
  return (
    <header className={clsx("page-hero", `page-hero--${tone}`)}>
      <div className="page-hero__content">
        {eyebrow ? <p className="page-hero__eyebrow">{eyebrow}</p> : null}
        <div className="page-hero__heading">
          <div className="page-hero__title-group">
            <h1>{title}</h1>
            {description ? <p>{description}</p> : null}
          </div>
          {actions ? <div className="page-hero__actions">{actions}</div> : null}
        </div>
        {children}
      </div>
      {image ? (
        <div className="page-hero__visual" aria-hidden="true">
          <img src={image} alt="" loading="lazy" />
        </div>
      ) : null}
    </header>
  );
}
