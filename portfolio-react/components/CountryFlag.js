import React from 'react';

export default function CountryFlag({ name = '', className = '', style = {} }) {
  const normalized = (name || '').toLowerCase().trim();

  const flagStyle = {
    width: '20px',
    height: '14px',
    borderRadius: '2px',
    display: 'inline-block',
    verticalAlign: '-1px',
    boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.15)',
    flexShrink: 0,
    overflow: 'hidden',
    ...style,
  };

  // Vietnam
  if (normalized.includes('việt') || normalized.includes('vietnam') || normalized.includes('vietnamese') || normalized === 'vn') {
    return (
      <svg viewBox="0 0 30 20" style={flagStyle} className={className} role="img" aria-label="Việt Nam" title="Việt Nam">
        <rect width="30" height="20" fill="#da251d" />
        <polygon points="15,4 16.76,9.43 22.47,9.43 17.85,12.78 19.61,18.21 15,14.86 10.39,18.21 12.15,12.78 7.53,9.43 13.24,9.43" fill="#ffde00" />
      </svg>
    );
  }

  // United Kingdom / English (Union Jack)
  if (normalized.includes('anh') || normalized.includes('english') || normalized === 'en' || normalized === 'uk' || normalized === 'gb') {
    return (
      <svg viewBox="0 0 60 30" style={flagStyle} className={className} role="img" aria-label="United Kingdom" title="English / United Kingdom">
        <rect width="60" height="30" fill="#012169" />
        <path d="M0,0 L60,30 M60,0 L0,30" stroke="#ffffff" strokeWidth="6" />
        <path d="M0,0 L30,15 M60,30 L30,15" stroke="#C8102E" strokeWidth="4" />
        <path d="M60,0 L30,15 M0,30 L30,15" stroke="#C8102E" strokeWidth="4" />
        <path d="M30,0 v30 M0,15 h60" stroke="#ffffff" strokeWidth="10" />
        <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6" />
      </svg>
    );
  }

  // Japan
  if (normalized.includes('nhật') || normalized.includes('japan') || normalized.includes('japanese') || normalized === 'jp' || normalized === 'ja') {
    return (
      <svg viewBox="0 0 30 20" style={flagStyle} className={className} role="img" aria-label="Japan" title="Nhật Bản / Japan">
        <rect width="30" height="20" fill="#ffffff" />
        <circle cx="15" cy="10" r="6" fill="#bc002d" />
      </svg>
    );
  }

  // South Korea
  if (normalized.includes('hàn') || normalized.includes('korea') || normalized.includes('korean') || normalized === 'kr' || normalized === 'ko') {
    return (
      <svg viewBox="0 0 30 20" style={flagStyle} className={className} role="img" aria-label="Korea" title="Hàn Quốc / Korea">
        <rect width="30" height="20" fill="#ffffff" />
        <path d="M15,5 A5,5 0 0,1 15,15 A2.5,2.5 0 0,1 15,10 A2.5,2.5 0 0,0 15,5" fill="#cd2e3a" />
        <path d="M15,15 A5,5 0 0,1 15,5 A2.5,2.5 0 0,1 15,10 A2.5,2.5 0 0,0 15,15" fill="#0047a0" />
      </svg>
    );
  }

  // China
  if (normalized.includes('trung') || normalized.includes('hoa') || normalized.includes('china') || normalized.includes('chinese') || normalized === 'cn' || normalized === 'zh') {
    return (
      <svg viewBox="0 0 30 20" style={flagStyle} className={className} role="img" aria-label="China" title="Trung Quốc / China">
        <rect width="30" height="20" fill="#de2910" />
        <polygon points="5,2 5.6,3.8 7.5,3.8 6,4.9 6.5,6.7 5,5.6 3.5,6.7 4,4.9 2.5,3.8 4.4,3.8" fill="#ffde00" />
        <circle cx="10" cy="2" r="0.8" fill="#ffde00" />
        <circle cx="12" cy="4" r="0.8" fill="#ffde00" />
        <circle cx="12" cy="7" r="0.8" fill="#ffde00" />
        <circle cx="10" cy="9" r="0.8" fill="#ffde00" />
      </svg>
    );
  }

  // France
  if (normalized.includes('pháp') || normalized.includes('french') || normalized.includes('france') || normalized === 'fr') {
    return (
      <svg viewBox="0 0 30 20" style={flagStyle} className={className} role="img" aria-label="France" title="Pháp / France">
        <rect width="10" height="20" fill="#002654" />
        <rect x="10" width="10" height="20" fill="#ffffff" />
        <rect x="20" width="10" height="20" fill="#ce1126" />
      </svg>
    );
  }

  // Germany
  if (normalized.includes('đức') || normalized.includes('german') || normalized.includes('germany') || normalized === 'de') {
    return (
      <svg viewBox="0 0 30 20" style={flagStyle} className={className} role="img" aria-label="Germany" title="Đức / Germany">
        <rect width="30" height="6.67" fill="#000000" />
        <rect y="6.67" width="30" height="6.67" fill="#dd0000" />
        <rect y="13.34" width="30" height="6.66" fill="#ffce00" />
      </svg>
    );
  }

  // Russia
  if (normalized.includes('nga') || normalized.includes('russian') || normalized.includes('russia') || normalized === 'ru') {
    return (
      <svg viewBox="0 0 30 20" style={flagStyle} className={className} role="img" aria-label="Russia" title="Nga / Russia">
        <rect width="30" height="6.67" fill="#ffffff" />
        <rect y="6.67" width="30" height="6.67" fill="#0039a6" />
        <rect y="13.34" width="30" height="6.66" fill="#d52b1e" />
      </svg>
    );
  }

  // USA (if explicitly specified)
  if (normalized.includes('mỹ') || normalized.includes('usa') || normalized.includes('american')) {
    return (
      <svg viewBox="0 0 38 20" style={flagStyle} className={className} role="img" aria-label="United States" title="Hoa Kỳ / USA">
        <rect width="38" height="20" fill="#b22234" />
        <path d="M0,1.54 h38 M0,4.62 h38 M0,7.69 h38 M0,10.77 h38 M0,13.85 h38 M0,16.92 h38" stroke="#fff" strokeWidth="1.54" />
        <rect width="15.2" height="10.77" fill="#3c3b6e" />
      </svg>
    );
  }

  // Generic fallback flag icon
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', marginLeft: '2px', ...style }}>
      <i className="fa-solid fa-flag" style={{ fontSize: '0.8rem', color: 'var(--global-theme-color, #2563eb)' }} title={name} />
    </span>
  );
}
