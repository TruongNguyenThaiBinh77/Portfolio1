'use client';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

export default function NavbarBrand({ config }) {
  const pathname = usePathname();

  return (
    <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
      {config.header_logo && (
        <Link href="/" style={{ display: 'flex', alignItems: 'center', marginRight: '15px' }}>
          <img src={`/assets/img/${config.header_logo}`} style={{
            width: config.header_logo_size || '40px',
            height: config.header_logo_height || 'auto',
            backgroundColor: config.header_logo_bg || 'transparent',
            padding: config.header_logo_bg && config.header_logo_bg !== '#ffffff' ? '5px' : '0',
            borderRadius: config.header_logo_bg && config.header_logo_bg !== '#ffffff' ? '5px' : '0',
            verticalAlign: 'middle'
          }} alt="Logo" />
        </Link>
      )}
      
      {pathname !== '/' && (
        <Link href="/" className="navbar-brand title font-weight-lighter" style={{ 
          margin: 0,
          textDecoration: 'none', 
          color: config.navbar_text_color || 'inherit',
          whiteSpace: 'nowrap'
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
