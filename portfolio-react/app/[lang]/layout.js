import { getConfig, getCvData } from '../../lib/config';
import LiveReload from '../LiveReload';
import NavbarWrapper from '../../components/NavbarWrapper';
import Footer from '../../components/Footer';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const lang = resolvedParams.lang || 'vi';
  const config = getConfig(lang);

  let pageTitle = config.title;
  if (!pageTitle || pageTitle.toLowerCase() === 'blank') {
    pageTitle = [config.first_name, config.middle_name, config.last_name].filter(Boolean).join(' ');
  }

  const iconSrc = config.icon ? String(config.icon).trim() : '';
  const iconUrl = iconSrc
    ? (iconSrc.startsWith('http') || iconSrc.startsWith('/') ? iconSrc : `/assets/img/${iconSrc}`)
    : '/favicon.ico';

  return {
    title: pageTitle || 'Portfolio',
    description: config.description || 'Academic Portfolio',
    icons: {
      icon: iconUrl,
      shortcut: iconUrl,
      apple: iconUrl,
    }
  };
}

const tornPaperPath = "M 0,24 L 6.4,34.7 L 12.5,20.6 L 21.6,32.2 L 30.7,25.9 L 37.8,35.5 L 44.4,25.3 L 51.5,27.4 L 58.3,33.2 L 68,33.7 L 76.5,27.9 L 86.2,29.4 L 96,31.6 L 105.7,32.4 L 112.1,31 L 119.1,26.7 L 126.3,29.4 L 134.7,27.2 L 143.1,26.8 L 149.6,26 L 157.9,24.8 L 167.6,26.6 L 175.5,21.6 L 183.7,21.8 L 191.4,24.1 L 199.7,25.1 L 208.1,27.1 L 217.6,25.5 L 226.2,37.3 L 234.2,34.2 L 241.1,28.3 L 250.2,30.8 L 257.7,29.9 L 264.2,32.3 L 270.4,25.8 L 279,32.3 L 285.3,32.1 L 294.4,36.8 L 303.1,27.9 L 312.2,36.1 L 319.8,24 L 326.9,31.4 L 334.7,34.2 L 342.1,29.6 L 348.2,33.8 L 357.8,25.6 L 365.6,22.7 L 374.9,28.4 L 383,27.4 L 392.6,20.4 L 401.3,22.1 L 409.1,24.3 L 415.1,13.9 L 422.2,18.8 L 431.9,18.5 L 438.3,10.7 L 444.9,9.6 L 453.8,12.6 L 461.1,17.9 L 468.2,11.4 L 477.9,8.8 L 487.4,14.2 L 495.5,12.3 L 503.8,16 L 511.1,13.4 L 520.5,18.8 L 528.2,13.6 L 536.3,18.7 L 545.2,11.4 L 554.9,17.1 L 563.7,19.6 L 572,12.6 L 580.9,13.4 L 590.5,15.1 L 599.3,16.8 L 608.2,22.9 L 614.2,23.1 L 622.2,25 L 629.3,16 L 637.5,26.1 L 644.1,25.5 L 650.8,23.2 L 657.2,26.6 L 663.5,20.2 L 672.9,23.9 L 679,28.2 L 688.2,23 L 698.1,26 L 705.7,18.3 L 714.2,16.3 L 721.2,24 L 728.8,24.5 L 736.6,27.3 L 744.3,26.5 L 751.1,25.2 L 757.4,20.2 L 765.5,22.3 L 773.3,22.9 L 780.1,20.5 L 789.2,27.8 L 797.6,21.2 L 804.1,18.6 L 812.8,31.5 L 820.5,24 L 829.5,34.9 L 835.6,31.5 L 843.3,30.8 L 850.6,30.2 L 857.2,32.7 L 865.9,33.5 L 873.2,35.7 L 880.8,32.8 L 889.1,39.3 L 898.6,29.2 L 907.3,28.4 L 915.4,38.4 L 925.3,31.7 L 934,28.2 L 941.7,37.4 L 949.2,35.9 L 956.9,31.8 L 966.7,33.5 L 975,30.5 L 982.4,38.4 L 991.9,34.2 L 998.4,33.4 L 1005.5,25.7 L 1015.5,34.3 L 1022.1,29.8 L 1029,27.5 L 1037.2,22.7 L 1043.4,30.2 L 1050.5,22.2 L 1057.6,28.4 L 1065.1,21.6 L 1071.1,24.3 L 1077.8,22.3 L 1087.5,14.2 L 1095,15.2 L 1102.4,20.1 L 1110.8,23.5 L 1119.5,18 L 1126.5,22.3 L 1136.4,20.8 L 1145,21.2 L 1153.1,12.6 L 1160.9,17.9 L 1170.4,20.9 L 1178.2,13.1 L 1185.5,12.6 L 1192.5,10.5 L 1202.4,16.8 L 1210.3,13.7 L 1216.9,16.3 L 1224.6,14.4 L 1232.3,20 L 1238.7,18.3 L 1245,12.8 L 1252.6,13.6 L 1258.9,24.8 L 1265.5,18.6 L 1272.7,27.3 L 1282.5,20.6 L 1290.9,18.6 L 1299.8,25.6 L 1308.4,15.2 L 1318.2,18.8 L 1325.5,19 L 1334.5,17.7 L 1342.2,20.2 L 1349,13.4 L 1356.8,15.6 L 1366,20.5 L 1373.3,17.7 L 1382.8,22.5 L 1391.4,21 L 1398.5,14.1 L 1404.5,23.3 L 1413.2,23.8 L 1419.6,17.2 L 1429.3,19.7 L 1435.6,18.6 L 1440,25.8 L 1440,60 L 0,60 Z";

export default async function RootLayout({ children, params }) {
  const resolvedParams = await params;
  const lang = resolvedParams.lang || 'vi';
  const config = getConfig(lang);
  const cvData = getCvData(lang);

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

  const iconSrc = config.icon ? String(config.icon).trim() : '';
  const iconUrl = iconSrc
    ? (iconSrc.startsWith('http') || iconSrc.startsWith('/') ? iconSrc : `/assets/img/${iconSrc}`)
    : '/favicon.ico';

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        
        {/* Dynamic Favicon */}
        <link rel="icon" href={iconUrl} />
        <link rel="shortcut icon" href={iconUrl} />
        <link rel="apple-touch-icon" href={iconUrl} />

        <link rel="stylesheet" href="/assets/css/tailwind.css" />
        <link rel="stylesheet" type="text/css" href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700|Roboto+Slab:100,300,400,500,700|Material+Icons&display=swap" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Alfa+Slab+One&family=Chakra+Petch:ital,wght@0,700;0,800;0,900;1,700;1,800;1,900&family=Cinzel:wght@700;800;900&family=Playfair+Display:ital,wght@0,700;0,900;1,600;1,700;1,800&display=swap" />
        
        {/* FontAwesome and Academicons */}
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/jpswalsh/academicons@1/css/academicons.min.css" />
        <link rel="stylesheet" href="/assets/css/jekyll-pygments-themes-github.css" id="highlight_theme_light" />
        <link rel="stylesheet" href="/assets/css/main.css" />
        
        <style dangerouslySetInnerHTML={{ __html: `
          :root {
            --global-bg-color: ${config.global_bg_color || '#FFF1E5'} !important;
          }
          body {
            background-color: ${config.global_bg_color || '#FFF1E5'} !important;
          }
          body, body.fixed-top-nav, .fixed-top-nav { 
            padding-top: 0 !important;
            padding-bottom: 0 !important; 
          }

          @font-face {
            font-family: 'SVN-Nexa-Rust-Slab-Black-Shadow';
            src: url('/assets/fonts/SVN-Nexa-Rust-Slab-Black-Shadow.ttf') format('truetype'),
                 local('SVN-Nexa-Rust-Slab-Black-Shadow'),
                 local('SVN Nexa Rust Slab Black Shadow'),
                 local('Nexa Rust Slab Black Shadow');
            font-weight: normal;
            font-style: normal;
            font-display: swap;
          }

          .title-nexa-rust, 
          .title-nexa-rust span:not(.star-icon), 
          .text-box-heading, 
          .box-heading {
            font-family: 'SVN-Nexa-Rust-Slab-Black-Shadow', 'Alfa Slab One', 'Cinzel', 'Georgia', serif !important;
            color: #6f3706 !important;
            text-transform: uppercase !important;
            letter-spacing: 2px;
          }

          .star-title {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 20px;
            font-family: 'SVN-Nexa-Rust-Slab-Black-Shadow', 'Alfa Slab One', serif !important;
            color: #6f3706 !important;
            text-transform: uppercase !important;
            text-align: center;
            letter-spacing: 2.5px;
          }

          .star-title span:not(.star-icon) {
            color: #6f3706 !important;
          }

          .star-title .star-icon {
            color: #FFD700 !important;
            font-size: 0.8em;
            line-height: 1;
            filter: drop-shadow(0 2px 4px rgba(0,0,0,0.12));
          }

          ${config.global_hover_color ? `:root { --global-theme-color: ${config.global_hover_color}; --global-hover-color: ${config.global_hover_color}; } html[data-theme=dark] { --global-theme-color: ${config.global_hover_color}; --global-hover-color: ${config.global_hover_color}; } a:hover, table.table a:hover, .post-list li a:hover, .featured-posts a:hover, .post-description a:hover, .post .post-tags a:hover { color: ${config.global_hover_color} !important; }` : ''}

          /* Base Navbar common transitions */
          #navbar {
            z-index: 1030 !important;
            transition: all 0.25s ease-in-out !important;
          }
          #navbar .navbar-nav .nav-link {
            font-size: ${config.navbar_font_size || '13.5px'} !important;
            padding-top: 4px !important;
            padding-bottom: 4px !important;
            padding-left: 10px !important;
            padding-right: 10px !important;
          }
          #navbar .navbar-brand {
            font-size: ${config.navbar_brand_size || '15px'} !important;
          }
          ${config.navbar_scale && config.navbar_scale !== 100 ? `
          #navbar .container {
            transform: scale(${config.navbar_scale / 100});
            transform-origin: center center;
          }
          ` : ''}

          /* ========================================================
             1) TRẠNG THÁI KHÔNG LĂN CHUỘT (Hình 1 - Floating Header)
             ======================================================== */
          #navbar:not(.navbar-scrolled) {
            position: fixed !important;
            top: ${config.header_top || '20px'} !important;
            left: 0 !important;
            right: 0 !important;
            margin-left: auto !important;
            margin-right: auto !important;
            width: ${config.header_width && config.header_width !== 'calc(100% - 40px)' ? config.header_width : `min(90vw, ${config.header_max_width || '1180px'})`} !important;
            max-width: ${config.header_max_width || '1180px'} !important;
            border-radius: ${config.header_border_radius || '12px'} !important;
            overflow: hidden !important;
            ${config.header_shadow !== false ? 'box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.28), 0 4px 12px rgba(0, 0, 0, 0.15) !important;' : ''}
            border: 1px solid ${config.header_border_color || 'rgba(255, 255, 255, 0.3)'} !important;
            padding-top: ${config.navbar_padding_y || '3px'} !important;
            padding-bottom: ${config.navbar_padding_y || '3px'} !important;
            min-height: 44px !important;
            backdrop-filter: blur(10px) !important;
            background-color: ${config.navbar_bg_color || '#D2867C'} !important;
          }

          /* Tối ưu tỉ lệ khoảng cách 2 bên cân đối cho màn hình laptop (đặc biệt 14" - 15.6", từ 992px đến 1600px) */
          @media (min-width: 992px) and (max-width: 1600px) {
            #navbar:not(.navbar-scrolled) {
              width: ${config.header_width && config.header_width !== 'calc(100% - 40px)' ? config.header_width : `min(90vw, ${config.header_max_width || '1180px'})`} !important;
              max-width: ${config.header_max_width || '1180px'} !important;
            }
          }
          #navbar:not(.navbar-scrolled) .container {
            max-width: 100% !important;
            padding-left: 18px !important;
            padding-right: 18px !important;
          }
          #navbar:not(.navbar-scrolled) .navbar-bg-overlay {
            opacity: ${config.navbar_bg_opacity !== undefined ? config.navbar_bg_opacity / 100 : 0.25} !important;
          }
          #navbar:not(.navbar-scrolled) .navbar-brand {
            color: ${config.navbar_text_color || '#3B0806'} !important;
          }
          #navbar:not(.navbar-scrolled) .navbar-nav .nav-item .nav-link {
            color: ${config.navbar_text_color || '#3B0806'} !important;
            font-weight: 600 !important;
            transition: color 0.15s ease-in-out;
          }
          /* Trang đang chọn là màu vàng đồng và gạch chân cũng màu vàng đồng */
          #navbar:not(.navbar-scrolled) .navbar-nav .nav-item.active > .nav-link {
            color: ${config.navbar_active_text_color || '#D4AF37'} !important;
            font-weight: 700 !important;
            text-decoration: underline !important;
            text-decoration-color: ${config.navbar_active_text_color || '#D4AF37'} !important;
            text-underline-offset: 6px !important;
            text-decoration-thickness: 2.5px !important;
          }
          #navbar:not(.navbar-scrolled) .navbar-nav .nav-item:not(.active) .nav-link:hover {
            color: ${config.navbar_active_text_color || '#D4AF37'} !important;
            text-decoration: none !important;
            opacity: 0.95;
          }
          #navbar:not(.navbar-scrolled) .btn-lang-toggle {
            color: ${config.navbar_active_text_color || '#D4AF37'} !important;
            border: 1px solid ${config.navbar_active_text_color || '#D4AF37'} !important;
            background-color: rgba(0, 0, 0, 0.12) !important;
          }
          #navbar:not(.navbar-scrolled) .btn-lang-toggle:hover {
            background-color: rgba(212, 175, 55, 0.18) !important;
            color: #E5B842 !important;
            border-color: #E5B842 !important;
          }
          #navbar:not(.navbar-scrolled) .nav-item.ml-3 {
            border-left: 1px solid rgba(255, 255, 255, 0.3) !important;
          }

          /* ========================================================
             2) TRẠNG THÁI KHI LĂN CHUỘT XUỐNG (Hình 2 - Header ban đầu)
             ======================================================== */
          #navbar.navbar-scrolled {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            margin-left: 0 !important;
            margin-right: 0 !important;
            border-radius: 0 !important;
            overflow: visible !important;
            border: none !important;
            border-bottom: 1px solid rgba(140, 3, 3, 0.15) !important;
            background-color: rgba(255, 241, 229, 0.96) !important;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06) !important;
            backdrop-filter: blur(12px) !important;
            min-height: 44px !important;
            padding-top: 3px !important;
            padding-bottom: 3px !important;
          }
          #navbar.navbar-scrolled .container {
            max-width: 930px !important;
            padding-left: 15px !important;
            padding-right: 15px !important;
          }
          #navbar.navbar-scrolled .navbar-bg-overlay {
            opacity: 0.28 !important;
          }
          #navbar.navbar-scrolled .navbar-brand {
            color: #222222 !important;
          }
          #navbar.navbar-scrolled .navbar-nav .nav-item .nav-link {
            color: #333333 !important;
            font-weight: 500 !important;
            transition: color 0.15s ease-in-out;
          }
          /* Yêu cầu 2: Header ban đầu có active màu đỏ với gạch chân màu đỏ như Hình 2 */
          #navbar.navbar-scrolled .navbar-nav .nav-item.active > .nav-link {
            color: #8C0303 !important;
            font-weight: 700 !important;
            text-decoration: underline !important;
            text-decoration-color: #8C0303 !important;
            text-underline-offset: 6px !important;
            text-decoration-thickness: 2.5px !important;
          }
          #navbar.navbar-scrolled .navbar-nav .nav-item:not(.active) .nav-link:hover {
            color: #8C0303 !important;
            text-decoration: none !important;
          }
          #navbar.navbar-scrolled .btn-lang-toggle {
            color: #8C0303 !important;
            border: 1px solid #8C0303 !important;
            background-color: rgba(140, 3, 3, 0.04) !important;
          }
          #navbar.navbar-scrolled .btn-lang-toggle:hover {
            background-color: rgba(140, 3, 3, 0.12) !important;
            color: #8C0303 !important;
            border-color: #8C0303 !important;
          }
          #navbar.navbar-scrolled .nav-item.ml-3 {
            border-left: 1px solid rgba(0, 0, 0, 0.12) !important;
          }

          #navbar .container {
            display: flex !important;
            align-items: center !important;
            justify-content: space-between !important;
          }

          @media (max-width: 768px) {
            html, body {
              max-width: 100vw !important;
              overflow-x: hidden !important;
            }

            #navbar {
              box-sizing: border-box !important;
            }

            #navbar .container {
              display: flex !important;
              flex-direction: row !important;
              align-items: center !important;
              justify-content: space-between !important;
              flex-wrap: wrap !important;
              width: 100% !important;
              max-width: 100% !important;
              box-sizing: border-box !important;
            }

            .navbar-brand-wrapper {
              display: flex !important;
              align-items: center !important;
              flex: 1 1 auto !important;
              min-width: 0 !important;
              max-width: calc(100% - 46px) !important;
              margin-right: 6px !important;
            }

            .navbar-brand-wrapper .navbar-brand {
              font-size: clamp(12.5px, 3.8vw, 15px) !important;
              white-space: nowrap !important;
              overflow: hidden !important;
              text-overflow: ellipsis !important;
              display: block !important;
              min-width: 0 !important;
            }

            .navbar-toggler {
              border-color: rgba(74, 14, 14, 0.35) !important;
              padding: 4px 6px !important;
              flex-shrink: 0 !important;
              margin-left: auto !important;
              display: inline-flex !important;
              flex-direction: column !important;
              justify-content: center !important;
              align-items: center !important;
            }

            .navbar-toggler .icon-bar {
              background-color: ${config.navbar_text_color || '#3B0806'} !important;
            }

            #navbar .navbar-collapse {
              width: 100% !important;
              flex-basis: 100% !important;
              flex-grow: 1 !important;
            }

            #navbar:not(.navbar-scrolled) {
              top: 10px !important;
              left: 10px !important;
              right: 10px !important;
              width: auto !important;
              max-width: calc(100vw - 20px) !important;
              margin: 0 !important;
              box-sizing: border-box !important;
              border-radius: 10px !important;
              padding-top: 5px !important;
              padding-bottom: 5px !important;
              min-height: 44px !important;
            }

            #navbar:not(.navbar-scrolled) .container {
              padding-left: 10px !important;
              padding-right: 10px !important;
            }

            #navbar.navbar-scrolled {
              top: 0 !important;
              left: 0 !important;
              right: 0 !important;
              width: 100% !important;
              border-radius: 0 !important;
              padding-top: 4px !important;
              padding-bottom: 4px !important;
            }

            #navbar.navbar-scrolled .container {
              max-width: 100% !important;
              padding-left: 12px !important;
              padding-right: 12px !important;
            }

            #navbar:not(.navbar-scrolled) #navbarNav {
              background-color: ${config.navbar_bg_color || '#D2867C'} !important;
              padding: 10px 0 !important;
              border-top: 1px solid rgba(74, 14, 14, 0.15) !important;
              margin-top: 8px !important;
            }

            #navbar.navbar-scrolled #navbarNav {
              background-color: rgba(255, 241, 229, 0.98) !important;
              padding: 10px 0 !important;
              border-top: 1px solid rgba(140, 3, 3, 0.15) !important;
              margin-top: 8px !important;
            }

            .top-banner-section {
              min-height: 105px !important;
            }
          }

          progress#progress {
            display: none !important;
          }

          /* Flex gap utilities */
          .gap-1 { gap: 0.25rem !important; }
          .gap-2 { gap: 0.5rem !important; }
          .gap-3 { gap: 1rem !important; }
          .gap-4 { gap: 1.5rem !important; }

          /* Minimal subtle action buttons */
          .btn-subtle-action {
            background-color: #ffffff !important;
            color: #374151 !important;
            border: 1px solid #d1d5db !important;
            border-radius: 6px !important;
            padding: 4px 12px !important;
            font-size: 0.82rem !important;
            font-weight: 500 !important;
            display: inline-flex !important;
            align-items: center !important;
            gap: 6px !important;
            text-decoration: none !important;
            box-shadow: none !important;
            transition: all 0.15s ease !important;
          }
          .btn-subtle-action:hover {
            background-color: #f3f4f6 !important;
            border-color: #9ca3af !important;
            color: #111827 !important;
            text-decoration: none !important;
          }
          html[data-theme=dark] .btn-subtle-action {
            background-color: #1f2937 !important;
            color: #e5e7eb !important;
            border-color: #4b5563 !important;
          }
          html[data-theme=dark] .btn-subtle-action:hover {
            background-color: #374151 !important;
            border-color: #6b7280 !important;
            color: #ffffff !important;
          }
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
        <header style={{ position: 'relative', width: '100%' }}>
          {config.top_banner_enabled !== false && (
            <div className="top-banner-section" style={{
              position: 'relative',
              width: '100%',
              minHeight: config.top_banner_height || '135px',
              backgroundColor: config.top_banner_bg_color || '#AE0100',
              backgroundImage: `linear-gradient(135deg, ${config.top_banner_bg_color || '#AE0100'} 0%, #820100 100%)`,
              overflow: 'hidden',
              boxShadow: 'inset 0 -10px 25px rgba(0, 0, 0, 0.25)',
            }}>
              {/* Bronze Drum Background Watermark - Kept purely as requested */}
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '750px',
                height: '750px',
                backgroundImage: "url('/assets/img/background-trong-dong-png_095238288.png')",
                backgroundSize: 'contain',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center',
                opacity: 0.18,
                pointerEvents: 'none',
                zIndex: 1,
              }} />

              {/* Spacer matching header height to give room */}
              <div style={{ height: '90px', width: '100%' }}></div>

              {/* Torn Paper Jagged Divider SVG */}
              <div className="torn-paper-divider" style={{
                position: 'absolute',
                bottom: '-1px',
                left: 0,
                width: '100%',
                height: '38px',
                zIndex: 5,
                pointerEvents: 'none',
                lineHeight: 0,
              }}>
                <svg viewBox="0 0 1440 60" preserveAspectRatio="none" style={{ width: '100%', height: '100%', display: 'block' }}>
                  {/* Soft paper fiber shadow */}
                  <path
                    d={tornPaperPath}
                    fill="rgba(0, 0, 0, 0.12)"
                    transform="translate(0, -3)"
                  />
                  {/* Main Torn Paper Fill in global_bg_color (#FFF1E5) */}
                  <path
                    d={tornPaperPath}
                    fill={config.global_bg_color || '#FFF1E5'}
                  />
                </svg>
              </div>
            </div>
          )}

          {/* Floating Navbar */}
          <nav id="navbar" className="navbar navbar-light navbar-expand-sm fixed-top" role="navigation" style={{ 
            backgroundColor: config.navbar_bg_color && config.navbar_bg_color !== '#ffffff' ? config.navbar_bg_color : '#D2867C'
          }}>
            <div 
              className="navbar-bg-overlay"
              style={{
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0,
                backgroundImage: `${getOverlayGradient(config.navbar_bg_overlay, config.navbar_bg_overlay_opacity)}url('/assets/img/${config.navbar_bg_image || 'background-trong-dong-png_095238288.png'}')`,
                backgroundPosition: 'center', backgroundRepeat: 'repeat-x',
                backgroundSize: config.navbar_bg_image_size ? `${config.navbar_bg_image_size}%` : 'auto 100%',
                filter: `hue-rotate(${config.navbar_bg_hue || 0}deg)`,
                pointerEvents: 'none',
                transition: 'opacity 0.25s ease-in-out',
              }} 
            />
            <NavbarWrapper config={config} lang={lang} />
          </nav>
          <progress id="progress" value="0">
            <div className="progress-container">
              <span className="progress-bar"></span>
            </div>
          </progress>
        </header>

        {children}

        <Footer config={config} cv={cvData?.cv || {}} lang={lang} />
      </body>
    </html>
  );
}
