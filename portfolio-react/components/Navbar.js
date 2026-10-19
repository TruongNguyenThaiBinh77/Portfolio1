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

  const isPartyCell = 
    currentPath === '/chibo' || 
    currentPath.toLowerCase() === '/partycell' || 
    currentPath === '/tu-tuong';

  const partyCellHref = lang === 'vi' ? `/${lang}/chibo` : `/${lang}/partycell`;

  // Determine language toggle target
  let toggleTarget = currentPath === '/' ? '' : currentPath;
  if (lang === 'vi') {
    if (toggleTarget === '/chibo' || toggleTarget === '/tu-tuong') {
      toggleTarget = '/partycell';
    }
  } else {
    if (toggleTarget.toLowerCase() === '/partycell' || toggleTarget === '/tu-tuong') {
      toggleTarget = '/chibo';
    }
  }

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
      <li className={`nav-item ${currentPath === '/achievements' || currentPath === '/teaching' ? 'active' : ''}`}>
        <Link className="nav-link" href={`/${lang}/achievements`}>
          {navNames.teachings || (lang === 'vi' ? 'Thành tích' : 'Achievements')}
          {(currentPath === '/achievements' || currentPath === '/teaching') && <span className="sr-only">(current)</span>}
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
      <li className={`nav-item ${isPartyCell ? 'active' : ''}`}>
        <Link className="nav-link" href={partyCellHref}>
          {navNames.chibo || navNames.tu_tuong || (lang === 'vi' ? 'Chi bộ' : 'Party Cell')}
          {isPartyCell && <span className="sr-only">(current)</span>}
        </Link>
      </li>
      
      {/* Language Toggle */}
      <li className="nav-item ml-3 pl-3" style={{ display: 'flex', alignItems: 'center' }}>
        <Link 
          href={lang === 'vi' ? `/en${toggleTarget}` : `/vi${toggleTarget}`} 
          className="btn btn-sm btn-lang-toggle" 
          style={{ 
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            borderRadius: '6px',
            padding: '3px 8px',
            transition: 'all 0.15s ease-in-out',
          }}
          title={lang === 'vi' ? 'Switch to English' : 'Chuyển sang Tiếng Việt'}
        >
          <i className="fas fa-globe"></i> {lang === 'vi' ? 'EN' : 'VN'}
        </Link>
      </li>
    </ul>
  );
}
