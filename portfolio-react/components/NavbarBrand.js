'use client';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

export default function NavbarBrand({ config, lang = 'vi' }) {
  const pathname = usePathname();
  const isHomePage = pathname === '/' || pathname === '/vi' || pathname === '/en';

  return (
    <div className="navbar-brand-wrapper" style={{ display: 'flex', alignItems: 'center', flex: '1 1 auto', minWidth: 0, marginRight: '8px' }}>
      {(config.header_logo || config.icon) && (
        <Link href={`/${lang}`} style={{ display: 'flex', alignItems: 'center', marginRight: '8px', flexShrink: 0 }}>
          <img src={`/assets/img/${config.header_logo || config.icon}`} style={{
            width: config.header_logo_size || '52px',
            height: config.header_logo_height || '30px',
            maxHeight: config.header_logo_height && config.header_logo_height !== 'auto' ? config.header_logo_height : '30px',
            backgroundColor: (config.header_logo_bg && config.header_logo_bg !== '#ffffff' && config.header_logo_bg !== '#fff') ? config.header_logo_bg : 'transparent',
            padding: 0,
            borderRadius: '4px',
            verticalAlign: 'middle',
            objectFit: 'cover',
            border: '1px solid rgba(255, 255, 255, 0.25)',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12)'
          }} alt="Logo" />
        </Link>
      )}
      
      <Link href={`/${lang}`} className="navbar-brand title font-weight-lighter" style={{ 
        margin: 0,
        textDecoration: 'none', 
        color: config.navbar_text_color || '#3B0806',
        fontSize: config.navbar_brand_size || '15px',
        fontWeight: '700',
        display: 'block',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        letterSpacing: '0.4px',
        flex: '1 1 auto',
        minWidth: 0,
      }}>
        <span className="font-weight-bold" style={{ fontWeight: config.first_name_bold ? 'bold' : 'normal' }}>
          {config.first_name}
        </span>{' '}
        <span style={{ fontWeight: config.middle_name_bold ? 'bold' : 'normal' }}>
          {config.middle_name}
        </span>{' '}
        <span style={{ fontWeight: config.last_name_bold ? 'bold' : 'normal' }}>
          {config.last_name}
        </span>
      </Link>
    </div>
  );
}
