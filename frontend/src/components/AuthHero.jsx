export default function AuthHero({
  imageUrl,
  eyebrow,
  title,
  subtitle,
  bullets = [],
  className = "",
  align = "left",
}) {
  const background = "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";

  const heroClassName = ["auth-visual", `auth-visual--${align}`, className].filter(Boolean).join(" ");

  return (
    <aside className={heroClassName} style={{ background }} role="presentation">
      <div className="auth-visual__content">
        {eyebrow ? <span className="auth-visual__eyebrow">{eyebrow}</span> : null}
        {imageUrl ? (
          <div className="auth-visual__image" aria-hidden="true">
            <img src={imageUrl} alt="" loading="lazy" style={{ borderRadius: '16px', objectFit: 'cover', width: '100%', height: '240px' }} />
            <div className="auth-visual__image-gradient" />
          </div>
        ) : null}
        <h2 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '16px', color: 'white' }}>{title}</h2>
        <p style={{ fontSize: '18px', lineHeight: '1.6', marginBottom: '24px', color: 'rgba(255, 255, 255, 0.9)' }}>{subtitle}</p>
        {bullets.length ? (
          <ul className="auth-visual__list" style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {bullets.map((item, index) => (
              <li key={item} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: 'rgba(255, 255, 255, 0.95)'
              }}>
                <span style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  flexShrink: 0,
                  boxShadow: '0 0 0 4px rgba(255, 255, 255, 0.2)'
                }} />
                {item}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </aside>
  );
}
