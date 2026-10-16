'use client';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

export default function NavbarBrand({ config, lang = 'vi' }) {
  const pathname = usePathname();
  const isHomePage = pathname === '/' || pathname === '/vi' || pathname === '/en';

  return (
    <div style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
      {config.header_logo && (
        <Link href={`/${lang}`} style={{ display: 'flex', alignItems: 'center', marginRight: '12px', flexShrink: 0 }}>
          <img src={`/assets/img/${config.header_logo}`} style={{
            width: config.header_logo_size || 'auto',
            height: config.header_logo_height || '32px',
            maxHeight: config.header_logo_height && config.header_logo_height !== 'auto' ? config.header_logo_height : '32px',
            backgroundColor: config.header_logo_bg || 'transparent',
            padding: config.header_logo_bg && config.header_logo_bg !== '#ffffff' ? '3px' : '0',
            borderRadius: config.header_logo_bg && config.header_logo_bg !== '#ffffff' ? '4px' : '0',
            verticalAlign: 'middle',
            objectFit: 'contain'
          }} alt="Logo" />
        </Link>
      )}
      
      {!isHomePage && (
        <Link href={`/${lang}`} className="navbar-brand title font-weight-lighter" style={{ 
          margin: 0,
          textDecoration: 'none', 
          color: config.navbar_text_color || 'inherit',
          fontSize: config.navbar_brand_size || '15px',
          display: 'block',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
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
      )}
    </div>
  );
}
