
import { getConfig } from '../../lib/config';
import LiveReload from '../LiveReload';
import Navbar from '../../components/Navbar';
import NavbarBrand from '../../components/NavbarBrand';

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const lang = resolvedParams.lang || 'vi';
  const config = getConfig(lang);

  let pageTitle = config.title;
  if (!pageTitle || pageTitle.toLowerCase() === 'blank') {
    pageTitle = [config.first_name, config.middle_name, config.last_name].filter(Boolean).join(' ');
  }

  return {
    title: pageTitle || 'Portfolio',
    description: config.description || 'Academic Portfolio',
    icons: {
      icon: config.icon ? `/assets/img/${config.icon}` : '/favicon.ico',
    }
  };
}

export default async function RootLayout({ children, params }) {
  const resolvedParams = await params;
  const lang = resolvedParams.lang || 'vi';
  const config = getConfig(lang);

  const bodyStyle = {};
  if (config.global_bg_color && config.global_bg_color !== '#ffffff') {
    bodyStyle.backgroundColor = config.global_bg_color;
  }
  
  const getOverlayGradient = (hex, opacity) => {
    if (!hex) return '';
    const r = parseInt(hex.slice(1, 3), 16) || 0;
    const g = parseInt(hex.slice(3, 5), 16) || 0;
    const b = parseInt(hex.slice(5, 7), 16) || 0;
    const a = opacity !== undefined ? opacity / 100 : 0.5;
    const rgba = `rgba(${r}, ${g}, ${b}, ${a})`;
    return `linear-gradient(${rgba}, ${rgba}), `;
  };

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        
        <link rel="stylesheet" href="/assets/css/tailwind.css" />
        <link rel="stylesheet" type="text/css" href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700|Roboto+Slab:100,300,400,500,700|Material+Icons&display=swap" />
        
        {/* FontAwesome and Academicons */}
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/jpswalsh/academicons@1/css/academicons.min.css" />
        <link rel="stylesheet" href="/assets/css/jekyll-pygments-themes-github.css" id="highlight_theme_light" />
        <link rel="stylesheet" href="/assets/css/main.css" />
        
        <style dangerouslySetInnerHTML={{ __html: `
          ${config.navbar_text_color ? `.navbar.navbar-light .navbar-nav .nav-item .nav-link { color: ${config.navbar_text_color}; font-weight: normal; }` : ''}
          ${config.navbar_active_text_color ? `.navbar.navbar-light .navbar-nav .nav-item.active > .nav-link, .navbar.navbar-light .navbar-nav .nav-link:hover { color: ${config.navbar_active_text_color}; font-weight: bold; }` : ''}
          ${config.global_hover_color ? `:root { --global-theme-color: ${config.global_hover_color}; --global-hover-color: ${config.global_hover_color}; } html[data-theme=dark] { --global-theme-color: ${config.global_hover_color}; --global-hover-color: ${config.global_hover_color}; } a:hover, table.table a:hover, .post-list li a:hover, .featured-posts a:hover, .post-description a:hover, .post .post-tags a:hover { color: ${config.global_hover_color} !important; }` : ''}
        `}} />
      </head>
      <body className="fixed-top-nav" style={bodyStyle}>
        {config.body_bg_image && (
          <div style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: -20,
            backgroundImage: `${getOverlayGradient(config.body_bg_overlay, config.body_bg_overlay_opacity)}url('/assets/img/${config.body_bg_image}')`,
            backgroundPosition: 'center', backgroundRepeat: 'no-repeat',
            backgroundSize: config.body_bg_image_size && config.body_bg_image_size !== 'cover' && config.body_bg_image_size !== 'contain' && config.body_bg_image_size !== 'auto' ? `${config.body_bg_image_size}%` : 'cover',
            filter: `hue-rotate(${config.body_bg_hue || 0}deg)`,
            opacity: config.body_bg_opacity !== undefined ? config.body_bg_opacity / 100 : 1,
          }} />
        )}
        {config.global_bg_image && (
          <div style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: -10,
            backgroundImage: `${getOverlayGradient(config.global_bg_overlay, config.global_bg_overlay_opacity)}url('/assets/img/${config.global_bg_image}')`,
            backgroundPosition: 'center', backgroundRepeat: 'no-repeat',
            backgroundSize: config.global_bg_image_size ? `${config.global_bg_image_size}%` : 'cover',
            filter: `hue-rotate(${config.global_bg_hue || 0}deg)`,
            opacity: config.global_bg_opacity !== undefined ? config.global_bg_opacity / 100 : 1,
          }} />
        )}
        <LiveReload />
        <header>
          <nav id="navbar" className="navbar navbar-light navbar-expand-sm fixed-top" role="navigation" style={{ 
            backgroundColor: config.navbar_bg_color && config.navbar_bg_color !== '#ffffff' ? config.navbar_bg_color : 'var(--global-bg-color)'
          }}>
            {config.navbar_bg_image && (
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: -1,
                backgroundImage: `${getOverlayGradient(config.navbar_bg_overlay, config.navbar_bg_overlay_opacity)}url('/assets/img/${config.navbar_bg_image}')`,
                backgroundPosition: 'center', backgroundRepeat: 'no-repeat',
                backgroundSize: config.navbar_bg_image_size ? `${config.navbar_bg_image_size}%` : 'cover',
                filter: `hue-rotate(${config.navbar_bg_hue || 0}deg)`,
                opacity: config.navbar_bg_opacity !== undefined ? config.navbar_bg_opacity / 100 : 1,
              }} />
            )}
            <div className="container">
              <NavbarBrand config={config} />
              
              <button className="navbar-toggler collapsed navbar-toggler-main" type="button" data-nav-toggle="navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                <span className="sr-only">Toggle navigation</span>
                <span className="icon-bar top-bar"></span>
                <span className="icon-bar middle-bar"></span>
                <span className="icon-bar bottom-bar"></span>
              </button>

              <div className="collapse navbar-collapse navbar-collapse-main" id="navbarNav" style={{ flexGrow: 0 }}>
                <Navbar config={config} lang={lang} />
              </div>
            </div>
          </nav>
          <progress id="progress" value="0">
            <div className="progress-container">
              <span className="progress-bar"></span>
            </div>
          </progress>
        </header>

        {children}

        <footer className="fixed-bottom" role="contentinfo">
          <div className="container mt-0">
            &copy; Copyright 2026 {config.first_name} {config.last_name}.
          </div>
        </footer>
      </body>
    </html>
  );
}
