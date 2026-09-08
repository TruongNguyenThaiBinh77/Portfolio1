'use client';
import { usePathname, useParams } from 'next/navigation';
import Link from 'next/link';

export default function Navbar({ config }) {
  const pathname = usePathname() || '';
  const params = useParams();
  const lang = params.lang || 'vi';

  // Determine current path without the language prefix for matching
  const currentPath = pathname.replace(/^\/(vi|en)/, '') || '/';
  
  const navNames = lang === 'en' ? (config.nav_names_en || config.nav_names || {}) : (config.nav_names || {});

  return (
    <ul className="navbar-nav navbar-menu-list flex-nowrap align-items-center">
      <li className={`nav-item ${currentPath === '/' ? 'active' : ''}`}>
        <Link className="nav-link" href={`/${lang}`}>
          {navNames.about || "about"}
          {currentPath === '/' && <span className="sr-only">(current)</span>}
        </Link>
      </li>
      <li className={`nav-item ${currentPath === '/cv' ? 'active' : ''}`}>
        <Link className="nav-link" href={`/${lang}/cv`}>
          {navNames.cv || "Curriculum Vitae"}
          {currentPath === '/cv' && <span className="sr-only">(current)</span>}
        </Link>
      </li>
      <li className={`nav-item ${currentPath === '/teaching' ? 'active' : ''}`}>
        <Link className="nav-link" href={`/${lang}/teaching`}>
          {navNames.teachings || "teaching"}
          {currentPath === '/teaching' && <span className="sr-only">(current)</span>}
        </Link>
      </li>
      <li className={`nav-item ${currentPath === '/publications' ? 'active' : ''}`}>
        <Link className="nav-link" href={`/${lang}/publications`}>
          {navNames.publications || "publications"}
          {currentPath === '/publications' && <span className="sr-only">(current)</span>}
        </Link>
      </li>
      <li className={`nav-item ${currentPath === '/repositories' ? 'active' : ''}`}>
        <Link className="nav-link" href={`/${lang}/repositories`}>
          {navNames.repositories || "repositories"}
          {currentPath === '/repositories' && <span className="sr-only">(current)</span>}
        </Link>
      </li>
      
      {/* Language Toggle */}
      <li className="nav-item ml-3 pl-3" style={{ borderLeft: '1px solid var(--global-divider-color)', display: 'flex', alignItems: 'center' }}>
        <Link 
          href={lang === 'vi' ? `/en${currentPath === '/' ? '' : currentPath}` : `/vi${currentPath === '/' ? '' : currentPath}`} 
          className="btn btn-sm" 
          style={{ 
            color: 'var(--global-theme-color)', 
            borderColor: 'var(--global-theme-color)',
            backgroundColor: 'transparent',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
          }}
          title={lang === 'vi' ? 'Switch to English' : 'Chuyển sang Tiếng Việt'}
        >
          <i className="fas fa-globe"></i> {lang === 'vi' ? 'EN' : 'VN'}
        </Link>
      </li>
    </ul>
  );
}
