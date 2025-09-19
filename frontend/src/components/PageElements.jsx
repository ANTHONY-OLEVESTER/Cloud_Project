export function PageHero({ title, description, backgroundType = "gradient", children }) {
  const getBackgroundStyle = () => {
    switch (backgroundType) {
      case "security":
        return {
          background: `
            radial-gradient(circle at 20% 20%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(255, 107, 107, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, rgba(59, 130, 246, 0.2) 0%, transparent 50%),
            linear-gradient(135deg, var(--bg-subtle) 0%, var(--bg-surface) 100%)
          `
        };
      case "cloud": 
        return {
          background: `
            radial-gradient(circle at 30% 30%, rgba(59, 130, 246, 0.2) 0%, transparent 50%),
            radial-gradient(circle at 70% 70%, rgba(16, 185, 129, 0.2) 0%, transparent 50%),
            linear-gradient(135deg, #f0f9ff 0%, #ecfdf5 100%)
          `
        };
      case "data":
        return {
          background: `
            radial-gradient(circle at 25% 25%, rgba(168, 85, 247, 0.2) 0%, transparent 50%),
            radial-gradient(circle at 75% 75%, rgba(245, 158, 11, 0.2) 0%, transparent 50%),
            linear-gradient(135deg, #fef3c7 0%, #f3e8ff 100%)
          `
        };
      default:
        return {
          background: `
            radial-gradient(circle at 50% 50%, var(--accent-primary)20 0%, transparent 50%),
            linear-gradient(135deg, var(--bg-subtle) 0%, var(--bg-surface) 100%)
          `
        };
    }
  };

  return (
    <div className="page-hero" style={getBackgroundStyle()}>
      <div className="page-hero__content">
        <div className="page-hero__text">
          <h1 className="page-hero__title">{title}</h1>
          {description && <p className="page-hero__description">{description}</p>}
        </div>
        {children && <div className="page-hero__actions">{children}</div>}
      </div>
      <div className="page-hero__decoration">
        <div className="hero-shape hero-shape--1"></div>
        <div className="hero-shape hero-shape--2"></div>
        <div className="hero-shape hero-shape--3"></div>
      </div>
    </div>
  );
}

export function FeatureCard({ icon, title, description, onClick, className = "" }) {
  return (
    <div className={`feature-card ${className}`} onClick={onClick}>
      <div className="feature-card__icon">
        {typeof icon === 'string' ? <span className="feature-icon">{icon}</span> : icon}
      </div>
      <div className="feature-card__content">
        <h3 className="feature-card__title">{title}</h3>
        <p className="feature-card__description">{description}</p>
      </div>
    </div>
  );
}

export function StatsOverview({ stats, className = "" }) {
  return (
    <div className={`stats-overview ${className}`}>
      {stats.map((stat, index) => (
        <div key={index} className="stats-overview__item">
          <div className="stats-overview__value">{stat.value}</div>
          <div className="stats-overview__label">{stat.label}</div>
          {stat.change && (
            <div className={`stats-overview__change ${stat.change.type}`}>
              {stat.change.value}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}