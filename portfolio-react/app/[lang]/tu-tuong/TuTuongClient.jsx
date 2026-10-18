'use client';

import React from 'react';

export default function TuTuongClient({ lang = 'vi', fm = {}, config = {} }) {
  const isVi = lang === 'vi';

  // Câu nói kinh điển của Bác Hồ về Chi bộ
  const quoteText = isVi
    ? '“Chi bộ là nền móng của Đảng, chi bộ tốt thì mọi việc sẽ tốt. Đảng mạnh là do chi bộ tốt, chi bộ tốt là do các đảng viên đều tốt.”'
    : '“The Party cell is the foundation of the Party; if the Party cell is good, all work will succeed. A strong Party stems from good Party cells, and good Party cells stem from exemplary Party members.”';

  // Cấu hình Banner Bác Hồ & Trống Đồng từ admin
  const hb = fm?.hero_banner || {};

  // Tỉ lệ thu phóng Section Mẹ (Banner Scale) cấu hình từ Admin Panel
  const scaleFactor = (hb.banner_scale !== undefined ? Number(hb.banner_scale) : 100) / 100;
  const bannerOffsetX = hb.banner_offset_x !== undefined ? Number(hb.banner_offset_x) : 0;

  // Trống đồng
  const drumImg = hb.drum_image || '/assets/img/background-trong-dong-png_095238288.png';
  const drumX = hb.drum_x !== undefined ? hb.drum_x : 65;
  const drumY = hb.drum_y !== undefined ? hb.drum_y : 50;
  const drumSize = hb.drum_size !== undefined ? hb.drum_size : 580;
  const drumOpacity = (hb.drum_opacity !== undefined ? hb.drum_opacity : 32) / 100;
  const drumBlur = hb.drum_blur || 0;
  const drumRotate = hb.drum_rotate || 0;
  const drumSepia = (hb.drum_sepia !== undefined ? hb.drum_sepia : 35) / 100;
  const drumSaturate = (hb.drum_saturate !== undefined ? hb.drum_saturate : 115) / 100;
  const drumBlendMode = hb.drum_blend_mode || 'normal';

  // Ảnh Bác Hồ
  const portraitImg = hb.portrait_image || '/assets/img/ho_chi_minh_1946.jpg';
  const portraitX = hb.portrait_x || 0;
  const portraitY = hb.portrait_y || 0;
  const portraitScale = (hb.portrait_scale !== undefined ? hb.portrait_scale : 100) / 100;
  const portraitMaxHeight = hb.portrait_max_height !== undefined ? hb.portrait_max_height : 450;
  const portraitOpacity = (hb.portrait_opacity !== undefined ? hb.portrait_opacity : 100) / 100;
  const portraitBlur = hb.portrait_blur || 0;
  const portraitContrast = (hb.portrait_contrast !== undefined ? hb.portrait_contrast : 100) / 100;
  const portraitBrightness = (hb.portrait_brightness !== undefined ? hb.portrait_brightness : 100) / 100;
  const portraitGrayscale = (hb.portrait_grayscale !== undefined ? hb.portrait_grayscale : 0) / 100;
  const portraitBlendMode = hb.portrait_blend_mode || 'normal';
  const portraitMask = hb.portrait_mask === true;
  const portraitFlip = hb.portrait_flip || false;

  // Khung hình chữ nhật Trống Đồng (Section 1)
  const drumBoxBg = hb.drum_box_bg || '#F2DFCE';
  const drumBoxRadius = hb.drum_box_radius !== undefined ? `${hb.drum_box_radius}px` : '16px';
  const drumBoxHeight = hb.drum_box_height || 410;
  const drumBoxMarginLeft = hb.drum_box_margin_left !== undefined ? hb.drum_box_margin_left : 140;
  const drumBoxBorder = hb.drum_box_border || '1px solid rgba(197, 160, 89, 0.25)';
  const drumBoxShadow = hb.drum_box_shadow || '0 8px 24px rgba(0, 0, 0, 0.04)';

  // Tiêu đề & Văn bản
  const subtitle = isVi ? (hb.subtitle || 'Chủ tịch') : (hb.subtitle_en || 'President');
  const subtitleColor = hb.subtitle_color || '#3B291A';
  const subtitleSize = hb.subtitle_size || 32;
  const title = isVi ? (hb.title || 'HỒ CHÍ MINH') : (hb.title_en || 'HO CHI MINH');
  const titleColor = hb.title_color || '#68350B';
  const titleSize = hb.title_size || 46;
  const showStars = hb.show_stars === true;
  const starColor = hb.star_color || '#FFD700';
  const textX = hb.text_x || 0;
  const textY = hb.text_y || 0;

  // Thanh chân trang dưới (đã bỏ theo yêu cầu, chỉ bật khi có cờ rõ ràng)
  const bottomBarEnabled = hb.bottom_bar_enabled === true;

  // Section 3: Bài thơ Pác Bó của Bác Hồ
  const poemEnabled = hb.poem_enabled !== false;
  const poemTitle = isVi ? (hb.poem_title || 'TỨC CẢNH PÁC BÓ') : (hb.poem_title_en || 'RUSTIC SCENE OF PAC BO');
  const poemSubtitle = isVi 
    ? (hb.poem_subtitle || 'Hang Cốc Bó, Pác Bó, Hà Quảng, Cao Bằng (Tháng 2 - 1941)') 
    : (hb.poem_subtitle_en || 'Coc Bo Cave, Pac Bo, Cao Bang (February 1941)');
  const poemLines = [
    isVi ? (hb.poem_line1 || '“Sáng ra bờ suối, tối vào hang,') : (hb.poem_line1_en || '“Morning by the stream, evening in the cave,'),
    isVi ? (hb.poem_line2 || 'Cháo bẹ rau măng vẫn sẵn sàng.') : (hb.poem_line2_en || 'Maize soup and bamboo shoots always ready.'),
    isVi ? (hb.poem_line3 || 'Bàn đá chông chênh dịch sử Đảng,') : (hb.poem_line3_en || 'A shaky stone slab to translate the Party history,'),
    isVi ? (hb.poem_line4 || 'Cuộc đời cách mạng thật là sang.”') : (hb.poem_line4_en || 'What a glorious revolutionary life!”'),
  ];
  const poemNote = isVi 
    ? (hb.poem_note || 'Mùa xuân năm 1941, sau 30 năm bôn ba tìm đường cứu nước, Bác Hồ trở về Tổ quốc trực tiếp lãnh đạo cách mạng Việt Nam. Giữa núi rừng Pác Bó muôn trùng gian lao, bài thơ thể hiện khí phách lạc quan và phong thái ung dung, tự tại của Người.')
    : (hb.poem_note_en || 'In spring 1941, after 30 years seeking salvation for the nation, Uncle Ho returned to lead the revolution. Amid the hardships of Pac Bo, the poem shows his supreme revolutionary optimism and serene spirit.');

  // Section 4: Chi bộ ấp Gò Cao
  const gocaoEnabled = hb.gocao_enabled !== false;
  const gocaoTitle = isVi ? (hb.gocao_title || 'CHI BỘ ẤP GÒ CAO') : (hb.gocao_title_en || 'GO CAO HAMLET PARTY CELL');
  const gocaoBadge = isVi ? (hb.gocao_badge || 'TỔ CHỨC CƠ SỞ ĐẢNG • ĐỊA BÀN DÂN CƯ') : (hb.gocao_badge_en || 'GRASSROOTS PARTY ORGANIZATION');
  const gocaoSubtitle = isVi 
    ? (hb.gocao_subtitle || 'Hạt nhân chính trị lãnh đạo toàn diện tại địa bàn dân cư — Đảng bộ xã Hậu Nghĩa, tỉnh Tây Ninh')
    : (hb.gocao_subtitle_en || 'Political core leading comprehensively in the residential area — Hau Nghia Commune Party Committee, Tay Ninh Province');
  const gocaoHistory = isVi
    ? (hb.gocao_history_note || 'Trước đây là Khu phố Gò Cao, thị trấn Hậu Nghĩa, huyện Đức Hòa, tỉnh Long An')
    : (hb.gocao_history_note_en || 'Formerly Go Cao Quarter, Hau Nghia Town, Duc Hoa District, Long An Province');

  return (
    <div className="chibo-page" style={{ 
      minHeight: '85vh', 
      paddingTop: '25px', 
      paddingBottom: '80px',
      backgroundColor: config.global_bg_color || '#FFF1E5',
      overflowX: 'hidden',
    }}>
      {/* Mobile Responsive Style Block */}
      <style>{`
        @media (max-width: 768px) {
          .chibo-page {
            overflow-x: hidden !important;
          }
          .chibo-page .container {
            padding-left: 14px !important;
            padding-right: 14px !important;
          }
          /* Section 1: Câu trích dẫn */
          .quote-section {
            padding: 5px 0 15px 0 !important;
            margin-bottom: 25px !important;
          }
          .quote-text-block {
            padding: 8px 18px !important;
          }
          .quote-mark-left {
            top: -14px !important;
            left: -4px !important;
            font-size: 52px !important;
          }
          .quote-mark-right {
            bottom: 18px !important;
            right: -4px !important;
            font-size: 52px !important;
          }

          /* Section 2: Hero Banner Bác Hồ & Trống Đồng */
          .hero-banner-outer-wrapper {
            min-height: auto !important;
            margin-bottom: 30px !important;
          }
          .hero-banner-main-container {
            left: 0 !important;
            min-height: 440px !important;
            margin-bottom: 0px !important;
            position: relative !important;
            overflow: hidden !important;
            border-radius: 14px !important;
            transform: none !important;
          }
          .hb-drum-rectangle {
            margin-left: 0 !important;
            min-height: 440px !important;
            width: 100% !important;
            padding: 24px 16px 230px 16px !important;
            justify-content: center !important;
            align-items: flex-start !important;
            box-sizing: border-box !important;
          }
          .hb-text-container {
            transform: none !important;
            text-align: center !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 auto !important;
            padding: 0 8px !important;
            box-sizing: border-box !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: center !important;
            z-index: 5 !important;
          }
          .hb-text-subtitle {
            font-size: clamp(16px, 4.5vw, 20px) !important;
            margin-bottom: 6px !important;
            text-align: center !important;
          }
          .hb-text-title {
            font-size: clamp(18px, 5.2vw, 25px) !important;
            letter-spacing: 1.5px !important;
            white-space: normal !important;
            flex-wrap: wrap !important;
            text-align: center !important;
            justify-content: center !important;
            max-width: 100% !important;
            line-height: 1.25 !important;
            margin: 0 auto !important;
            gap: 8px !important;
          }
          .hb-text-title .hb-star {
            font-size: 0.75em !important;
          }
          .hb-portrait-standalone {
            left: 50% !important;
            bottom: 0px !important;
            transform: translateX(-50%) !important;
            max-width: 100% !important;
          }
          .hb-portrait-standalone img {
            max-height: 250px !important;
            max-width: 100% !important;
          }

          /* Section 3: Bài thơ Pác Bó */
          .poem-pac-bo-section {
            overflow: hidden !important;
            padding: 10px 0 25px 0 !important;
          }

          /* Section 4: Chi bộ ấp Gò Cao */
          .chibo-gocao-section {
            margin-top: 20px !important;
            margin-bottom: 25px !important;
          }
          .gocao-quick-stats {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }
          .gocao-grid-pillars {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
          .gocao-card {
            padding: 18px 18px !important;
          }
        }
      `}</style>

      <div className="container" style={{ maxWidth: '1060px', margin: '0 auto', padding: '0 20px' }}>

        {/* Tiêu đề trang phong cách SVN-Nexa-Rust-Slab-Black-Shadow */}
        <div style={{
          textAlign: 'center',
          marginBottom: '38px',
        }}>
          <h1 className="title-nexa-rust star-title" style={{
            fontSize: 'clamp(38px, 5.5vw, 56px)',
            lineHeight: '1.2',
            letterSpacing: '3px',
            color: '#6f3706',
            margin: '0 auto 12px auto',
          }}>
            <span className="star-icon" style={{ color: '#FFD700', fontSize: '0.8em', textShadow: '0 2px 6px rgba(0,0,0,0.18)' }}>★</span>
            <span style={{ color: '#6f3706' }}>{isVi ? 'CHI BỘ' : 'PARTY CELL'}</span>
            <span className="star-icon" style={{ color: '#FFD700', fontSize: '0.8em', textShadow: '0 2px 6px rgba(0,0,0,0.18)' }}>★</span>
          </h1>
          <p style={{
            fontSize: '1.05rem',
            color: '#78553d',
            fontStyle: 'italic',
            maxWidth: '650px',
            margin: '0 auto',
            lineHeight: '1.5'
          }}>
            {isVi ? 'Hạt nhân chính trị ở cơ sở — Nền móng vững chắc của Đảng' : 'Political core at grassroots — The solid foundation of the Party'}
          </p>
          <div style={{ width: '68px', height: '4px', backgroundColor: '#6f3706', margin: '14px auto 0 auto', borderRadius: '2px' }}></div>
        </div>

        {/* ========================================================
            SECTION 1: PHONG CÁCH TRÍCH CÂU NÓI NHƯ ẢNH 1
            Tác giả: Chữ ký của Bác Hồ
            ======================================================== */}
        <section 
          className="quote-section" 
          style={{
            position: 'relative',
            backgroundColor: 'transparent',
            border: 'none',
            padding: '10px 0 20px 0',
            marginBottom: '35px',
          }}
        >
          {/* Quote text block with decorative quotes */}
          <div className="quote-text-block" style={{
            maxWidth: '920px',
            margin: '0 auto',
            textAlign: 'center',
            position: 'relative',
            padding: '15px 42px',
          }}>
            {/* Top-left giant quotation mark “ */}
            <div className="quote-mark-left" style={{
              position: 'absolute',
              top: '-15px',
              left: '-5px',
              color: '#D32F2F',
              fontSize: '84px',
              lineHeight: 1,
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontWeight: 'bold',
              userSelect: 'none',
              opacity: 0.9,
            }}>
              “
            </div>

            {/* Bottom-right giant quotation mark ” */}
            <div className="quote-mark-right" style={{
              position: 'absolute',
              bottom: '25px',
              right: '-5px',
              color: '#D32F2F',
              fontSize: '84px',
              lineHeight: 1,
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontWeight: 'bold',
              userSelect: 'none',
              opacity: 0.9,
            }}>
              ”
            </div>

            <p style={{
              fontSize: 'clamp(21px, 2.6vw, 25px)',
              fontWeight: '800',
              lineHeight: '1.6',
              color: '#1a1a1a',
              margin: '0 0 24px 0',
              letterSpacing: '-0.2px',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            }}>
              {quoteText}
            </p>

            {/* Chữ ký Bác Hồ thuần nét (không nền, chỉ hiện chữ ký Bác) */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <img 
                src="/assets/img/ho_chi_minh_signature.svg" 
                alt="Chữ ký Chủ tịch Hồ Chí Minh"
                style={{
                  height: '56px',
                  width: 'auto',
                  display: 'block',
                  filter: 'contrast(1.25) brightness(0.9)',
                }}
              />
            </div>
          </div>
        </section>

        {/* ========================================================
            SECTION 2: BANNER BÁC HỒ & HOA VĂN TRỐNG ĐỒNG
            Cho phép tùy chỉnh vị trí kéo thả, độ mờ, hiệu ứng từ Admin Panel
            Font tiêu đề theo phong cách SVN-Nexa-Rust-Slab-Black-Shadow
            ======================================================== */}
        {/* ========================================================
            SECTION 2: BANNER BÁC HỒ & HOA VĂN TRỐNG ĐỒNG
            Layout 2 Section theo chuẩn hình mẫu:
            - Section 1: Khung hình chữ nhật chứa hoa văn Trống Đồng và Tiêu đề bên phải
            - Section 2: Khung chứa ảnh Bác riêng biệt đứng đè lên góc trái để dễ kéo thả
            (Đã bỏ thanh chữ trắng "Vững bước dưới cờ Đảng" theo yêu cầu)
            ======================================================== */}
        {/* ========================================================
            SECTION 2: BANNER BÁC HỒ & HOA VĂN TRỐNG ĐỒNG
            Section Mẹ có chức năng phóng to / thu nhỏ (Zoom Scale)
            và các Section con tự động co dãn theo tỷ lệ chuẩn
            ======================================================== */}
        <div 
          className="hero-banner-outer-wrapper"
          style={{
            position: 'relative',
            width: '100%',
            marginBottom: `${Math.round(45 * scaleFactor)}px`,
            minHeight: `${Math.round(Math.max(drumBoxHeight, portraitMaxHeight) * scaleFactor)}px`,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-end',
            transition: 'min-height 0.25s ease, margin-bottom 0.25s ease',
          }}
        >
          <section
            className="hero-banner-main-container"
            style={{
              position: 'relative',
              left: `${bannerOffsetX}px`,
              width: '100%',
              minHeight: `${Math.max(drumBoxHeight, portraitMaxHeight)}px`,
              display: 'flex',
              alignItems: 'flex-end',
              transform: `scale(${scaleFactor})`,
              transformOrigin: 'bottom center',
              transition: 'transform 0.25s ease, left 0.25s ease',
            }}
          >
            {/* SECTION 1: KHUNG HÌNH CHỮ NHẬT CHỨA HOA VĂN TRỐNG ĐỒNG & TIÊU ĐỀ */}
            <div 
              className="hb-drum-rectangle"
              style={{
                position: 'relative',
                width: '100%',
                flex: 1,
                marginLeft: `${drumBoxMarginLeft}px`,
                minHeight: `${drumBoxHeight}px`,
                backgroundColor: drumBoxBg,
                borderRadius: drumBoxRadius,
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                padding: '40px 60px 40px clamp(160px, 20vw, 240px)',
                boxShadow: drumBoxShadow,
                border: drumBoxBorder,
                transition: 'all 0.25s ease',
              }}
            >
              {/* Hoa văn Trống Đồng Watermark */}
              <div 
                style={{
                  position: 'absolute',
                  top: `${drumY}%`,
                  left: `${drumX}%`,
                  transform: `translate(-50%, -50%) rotate(${drumRotate}deg)`,
                  width: `${drumSize}px`,
                  height: `${drumSize}px`,
                  backgroundImage: `url(${drumImg})`,
                  backgroundSize: 'contain',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                  opacity: drumOpacity,
                  pointerEvents: 'none',
                  filter: `sepia(${drumSepia}) saturate(${drumSaturate}) blur(${drumBlur}px)`,
                  mixBlendMode: drumBlendMode,
                  transition: 'opacity 0.25s ease',
                }}
              />

              {/* Cụm Tiêu Đề & Tên trên Trống Đồng */}
              <div 
                className="hb-text-container"
                style={{
                  position: 'relative',
                  zIndex: 3,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  transform: `translate(${textX}px, ${textY}px)`,
                }}
              >
                <span className="hb-text-subtitle" style={{
                  fontFamily: 'Georgia, "Times New Roman", serif',
                  fontStyle: 'normal',
                  fontSize: `${subtitleSize}px`,
                  fontWeight: '600',
                  color: subtitleColor,
                  marginBottom: '10px',
                  letterSpacing: '0.5px',
                }}>
                  {subtitle}
                </span>
                
                <div className="title-nexa-rust hb-text-title" style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  fontSize: `${titleSize}px`,
                  lineHeight: '1.2',
                  letterSpacing: '2px',
                  color: titleColor,
                  whiteSpace: 'nowrap',
                }}>
                  {showStars && <span className="hb-star" style={{ color: starColor, fontSize: `${titleSize * 0.64}px`, textShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>★</span>}
                  <span className="hb-title-name" style={{ color: titleColor }}>{title}</span>
                  {showStars && <span className="hb-star" style={{ color: starColor, fontSize: `${titleSize * 0.64}px`, textShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>★</span>}
                </div>
              </div>
            </div>

            {/* SECTION 2: KHUNG CHỨA ẢNH BÁC RIÊNG BIỆT (ĐỘC LẬP, KÉO THẢ DỄ DÀNG, NẰM ĐÈ GÓC TRÁI) */}
            <div 
              className="hb-portrait-standalone"
              style={{
                position: 'absolute',
                left: '0px',
                bottom: '0px',
                zIndex: 10,
                transform: `translate(${portraitX}px, ${portraitY}px)`,
                display: 'flex',
                alignItems: 'flex-end',
                pointerEvents: 'none',
                transition: 'transform 0.25s ease',
              }}
            >
              <img 
                src={portraitImg} 
                alt={title}
                style={{
                  maxHeight: `${portraitMaxHeight}px`,
                  width: 'auto',
                  maxWidth: 'none',
                  objectFit: 'contain',
                  display: 'block',
                  mixBlendMode: portraitBlendMode,
                  opacity: portraitOpacity,
                  filter: `contrast(${portraitContrast}) brightness(${portraitBrightness}) grayscale(${portraitGrayscale}) blur(${portraitBlur}px)`,
                  WebkitMaskImage: portraitMask ? 'radial-gradient(ellipse 90% 92% at 50% 50%, black 65%, transparent 100%)' : 'none',
                  maskImage: portraitMask ? 'radial-gradient(ellipse 90% 92% at 50% 50%, black 65%, transparent 100%)' : 'none',
                  transform: `scale(${portraitScale}) ${portraitFlip ? 'scaleX(-1)' : ''}`,
                  transformOrigin: 'bottom center',
                  transition: 'opacity 0.25s ease',
                }}
              />
            </div>

            {/* Thanh chân trang dưới: Đã bỏ theo yêu cầu */}
            {bottomBarEnabled && (
              <div style={{
                position: 'absolute',
                bottom: '0',
                right: '0',
                zIndex: 4,
                backgroundColor: 'rgba(255, 241, 229, 0.95)',
                padding: '12px 35px',
                borderRadius: '8px 0 16px 0',
              }}>
                <span className="title-nexa-rust" style={{ fontSize: '24px', color: '#6f3706' }}>
                  {isVi ? 'Vững bước dưới cờ Đảng' : 'Steadfast Under the Party Flag'}
                </span>
              </div>
            )}
          </section>
        </div>

        {/* ========================================================
            SECTION 3: BÀI THƠ CỦA BÁC "TỨC CẢNH PÁC BÓ" (1941)
            Thiết kế trang trọng, hoài niệm với hoa văn truyền thống,
            chữ ký Chủ tịch Hồ Chí Minh và bối cảnh lịch sử
            ======================================================== */}
        {poemEnabled && (
          <section 
            className="poem-pac-bo-section"
            style={{
              position: 'relative',
              backgroundColor: 'transparent',
              padding: '10px 0 35px 0',
              marginBottom: '35px',
            }}
          >
            {/* Watermark hoa văn Trống đồng chìm mờ nhẹ ở nền */}
            <div 
              style={{
                position: 'absolute',
                top: '50%',
                right: '-60px',
                transform: 'translateY(-50%)',
                width: '450px',
                height: '450px',
                backgroundImage: `url(${drumImg})`,
                backgroundSize: 'contain',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                opacity: 0.05,
                pointerEvents: 'none',
                filter: 'sepia(40%) saturate(120%)',
              }}
            />

            <div 
              style={{
                position: 'relative',
                zIndex: 2,
                textAlign: 'center',
              }}
            >
              {/* Tên bài thơ: TỨC CẢNH PÁC BÓ */}
              <h2 
                style={{
                  fontFamily: '"Playfair Display", "Roboto Slab", "Times New Roman", serif',
                  fontSize: 'clamp(28px, 4.2vw, 38px)',
                  fontWeight: '800',
                  color: '#68350B',
                  letterSpacing: '2px',
                  margin: '0 0 10px 0',
                  textTransform: 'uppercase',
                }}
              >
                {poemTitle}
              </h2>

              {/* Địa danh bối cảnh */}
              <p style={{
                fontSize: '15px',
                fontStyle: 'italic',
                color: '#8A5A36',
                margin: '0 auto 22px auto',
                letterSpacing: '0.3px',
                fontFamily: '"Roboto Slab", "Playfair Display", "Times New Roman", serif',
              }}>
                {poemSubtitle}
              </p>

              {/* Dải phân cách hoa văn ngôi sao */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '14px',
                maxWidth: '280px',
                margin: '0 auto 26px auto',
              }}>
                <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to left, rgba(197, 160, 89, 0.6), transparent)' }} />
                <span style={{ color: '#C5A059', fontSize: '14px' }}>✦</span>
                <span style={{ color: '#D32F2F', fontSize: '16px' }}>★</span>
                <span style={{ color: '#C5A059', fontSize: '14px' }}>✦</span>
                <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to right, rgba(197, 160, 89, 0.6), transparent)' }} />
              </div>

              {/* Bốn câu thơ thất ngôn tứ tuyệt (có dấu “ và ”) */}
              <div 
                style={{
                  maxWidth: '720px',
                  margin: '0 auto 28px auto',
                  padding: '10px 0',
                }}
              >
                {poemLines.map((line, idx) => {
                  let formattedLine = line.trim();
                  if (idx === 0 && !formattedLine.startsWith('“') && !formattedLine.startsWith('"')) {
                    formattedLine = '“' + formattedLine;
                  }
                  if (idx === poemLines.length - 1 && !formattedLine.endsWith('”') && !formattedLine.endsWith('"')) {
                    formattedLine = formattedLine + '”';
                  }
                  return (
                    <p 
                      key={idx}
                      style={{
                        fontFamily: '"Playfair Display", "Roboto Slab", "Times New Roman", serif',
                        fontSize: 'clamp(22px, 3.1vw, 27px)',
                        fontWeight: '700',
                        lineHeight: '1.95',
                        color: idx === 3 ? '#9A2617' : '#27170E',
                        margin: '0',
                        letterSpacing: '0.2px',
                      }}
                    >
                      {formattedLine}
                    </p>
                  );
                })}
              </div>

              {/* Chữ ký Bác Hồ thuần nét (không nền, chỉ hiện chữ ký) */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '28px',
              }}>
                <img 
                  src="/assets/img/ho_chi_minh_signature.svg" 
                  alt="Chữ ký Chủ tịch Hồ Chí Minh"
                  style={{
                    height: '52px',
                    width: 'auto',
                    display: 'block',
                    filter: 'contrast(1.25) brightness(0.9)',
                  }}
                />
              </div>

              {/* Khung ghi chú bối cảnh lịch sử */}
              <div style={{
                maxWidth: '780px',
                margin: '0 auto',
                padding: '14px 22px',
                backgroundColor: 'rgba(255, 255, 255, 0.65)',
                borderLeft: '4px solid #C5A059',
                borderRadius: '4px 8px 8px 4px',
                textAlign: 'justify',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)',
              }}>
                <p style={{
                  margin: 0,
                  fontSize: '13.8px',
                  lineHeight: '1.65',
                  color: '#5C4433',
                  fontStyle: 'italic',
                }}>
                  <strong>{isVi ? 'Ý nghĩa lịch sử:' : 'Historical significance:'}</strong> {poemNote}
                </p>
              </div>

            </div>
          </section>
        )}

        {/* ========================================================
            SECTION 4: CHI BỘ ẤP GÒ CAO - TỔ CHỨC ĐẢNG CƠ SỞ
            Hạt nhân chính trị ở địa bàn dân cư, không màu nền (transparent)
            ======================================================== */}
        {gocaoEnabled && (
          <section
            className="chibo-gocao-section"
            style={{
              position: 'relative',
              backgroundColor: 'transparent',
              padding: '25px 0 10px 0',
              marginTop: '30px',
              marginBottom: '35px',
            }}
          >
            {/* Header section */}
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              {/* Badge */}
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 18px',
                borderRadius: '20px',
                border: '1px solid rgba(139, 30, 15, 0.28)',
                background: 'rgba(139, 30, 15, 0.06)',
                color: '#8B1E0F',
                fontSize: '12.5px',
                fontWeight: '700',
                letterSpacing: '1px',
                marginBottom: '14px',
                textTransform: 'uppercase',
              }}>
                <i className="fa-solid fa-flag" style={{ fontSize: '11px', color: '#B71C1C' }}></i>
                <span>{gocaoBadge}</span>
              </div>

              {/* Title */}
              <h2 style={{
                fontFamily: '"Playfair Display", "Roboto Slab", "Times New Roman", serif',
                fontSize: 'clamp(28px, 4.2vw, 38px)',
                fontWeight: '800',
                color: '#68350B',
                letterSpacing: '1.5px',
                margin: '0 0 10px 0',
                textTransform: 'uppercase',
              }}>
                {gocaoTitle}
              </h2>

              {/* Subtitle */}
              <p style={{
                fontSize: 'clamp(15px, 2vw, 17px)',
                color: '#5C3E28',
                fontWeight: '600',
                lineHeight: '1.55',
                maxWidth: '820px',
                margin: '0 auto 8px auto',
              }}>
                {gocaoSubtitle}
              </p>

              {/* Historical note */}
              <p style={{
                fontSize: '14px',
                color: '#8C5E3C',
                fontStyle: 'italic',
                margin: '0 auto',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}>
                <i className="fa-solid fa-clock-rotate-left" style={{ fontSize: '12px' }}></i>
                <span>{gocaoHistory}</span>
              </p>

              {/* Decorative divider */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                margin: '18px auto 0 auto',
              }}>
                <span style={{ width: '45px', height: '1.5px', background: 'linear-gradient(to right, transparent, #C5A059)' }}></span>
                <i className="fa-solid fa-star" style={{ color: '#D4AF37', fontSize: '13px' }}></i>
                <span style={{ width: '45px', height: '1.5px', background: 'linear-gradient(to left, transparent, #C5A059)' }}></span>
              </div>
            </div>

            {/* Quick stats / Highlights row */}
            <div className="gocao-quick-stats" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))',
              gap: '16px',
              marginBottom: '28px',
            }}>
              {/* Highlight 1 */}
              <div style={{
                padding: '16px 18px',
                borderRadius: '12px',
                border: '1px solid rgba(139, 69, 19, 0.18)',
                background: 'rgba(255, 255, 255, 0.5)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '14px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
              }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '8px',
                  background: 'rgba(183, 28, 28, 0.1)',
                  color: '#B71C1C',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                  flexShrink: 0,
                }}>
                  <i className="fa-solid fa-landmark"></i>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#8C5E3C', fontWeight: '600', textTransform: 'uppercase' }}>
                    {isVi ? 'Cấp ủy trực thuộc' : 'Superior Committee'}
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#27170E', marginTop: '2px' }}>
                    {isVi ? 'Đảng bộ xã Hậu Nghĩa' : 'Hau Nghia Commune Party Committee'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#73523B', marginTop: '2px' }}>
                    {isVi ? 'Tỉnh Tây Ninh' : 'Tay Ninh Province'}
                  </div>
                </div>
              </div>

              {/* Highlight 2 */}
              <div style={{
                padding: '16px 18px',
                borderRadius: '12px',
                border: '1px solid rgba(139, 69, 19, 0.18)',
                background: 'rgba(255, 255, 255, 0.5)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '14px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
              }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '8px',
                  background: 'rgba(197, 160, 89, 0.16)',
                  color: '#8A6214',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                  flexShrink: 0,
                }}>
                  <i className="fa-solid fa-map-pin"></i>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#8C5E3C', fontWeight: '600', textTransform: 'uppercase' }}>
                    {isVi ? 'Địa bàn phụ trách' : 'Jurisdiction Area'}
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#27170E', marginTop: '2px' }}>
                    {isVi ? 'Ấp Gò Cao' : 'Go Cao Hamlet'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#73523B', marginTop: '2px' }}>
                    {isVi ? 'Trước là Khu phố Gò Cao, H. Đức Hòa' : 'Formerly Go Cao, Duc Hoa'}
                  </div>
                </div>
              </div>

              {/* Highlight 3 */}
              <div style={{
                padding: '16px 18px',
                borderRadius: '12px',
                border: '1px solid rgba(139, 69, 19, 0.18)',
                background: 'rgba(255, 255, 255, 0.5)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '14px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
              }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '8px',
                  background: 'rgba(26, 115, 232, 0.1)',
                  color: '#1565C0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                  flexShrink: 0,
                }}>
                  <i className="fa-solid fa-users"></i>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#8C5E3C', fontWeight: '600', textTransform: 'uppercase' }}>
                    {isVi ? 'Đoàn thể trực thuộc' : 'Youth Organization'}
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#27170E', marginTop: '2px' }}>
                    {isVi ? 'Chi đoàn ấp Gò Cao' : 'Go Cao Youth Branch'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#73523B', marginTop: '2px' }}>
                    {isVi ? 'Nguồn phát triển Đảng viên trẻ' : 'Young Party members resource'}
                  </div>
                </div>
              </div>

              {/* Highlight 4 */}
              <div style={{
                padding: '16px 18px',
                borderRadius: '12px',
                border: '1px solid rgba(139, 69, 19, 0.18)',
                background: 'rgba(255, 255, 255, 0.5)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '14px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
              }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '8px',
                  background: 'rgba(46, 125, 50, 0.1)',
                  color: '#2E7D32',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                  flexShrink: 0,
                }}>
                  <i className="fa-solid fa-award"></i>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#8C5E3C', fontWeight: '600', textTransform: 'uppercase' }}>
                    {isVi ? 'Công trình tiêu biểu' : 'Featured Project'}
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#27170E', marginTop: '2px' }}>
                    {isVi ? 'Không gian văn hóa Bác Hồ' : 'Ho Chi Minh Cultural Space'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#73523B', marginTop: '2px' }}>
                    {isVi ? 'Ra mắt ngày 24/4/2026' : 'Launched on April 24, 2026'}
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed 4 Pillars Grid (Balanced 2x2) */}
            <div className="gocao-grid-pillars" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 420px), 1fr))',
              gap: '22px',
              marginBottom: '28px',
            }}>
              {/* Card 1 */}
              <div className="gocao-card" style={{
                padding: '24px 26px',
                borderRadius: '14px',
                border: '1px solid rgba(139, 69, 19, 0.18)',
                background: 'rgba(255, 255, 255, 0.5)',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.02)',
                display: 'flex',
                flexDirection: 'column',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                  <div style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '8px',
                    background: '#F5ECE3',
                    color: '#8B1E0F',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '15px',
                  }}>
                    <i className="fa-solid fa-map-location-dot"></i>
                  </div>
                  <h3 style={{
                    fontSize: '17.5px',
                    fontWeight: '700',
                    color: '#68350B',
                    margin: 0,
                    fontFamily: '"Playfair Display", "Roboto Slab", serif',
                  }}>
                    {isVi ? '1. Quá trình Chuyển đổi Địa giới Hành chính' : '1. Administrative History & Transition'}
                  </h3>
                </div>
                <p style={{
                  fontSize: '14.5px',
                  lineHeight: '1.7',
                  color: '#422817',
                  textAlign: 'justify',
                  margin: 0,
                }}>
                  {isVi 
                    ? 'Trước đây, địa bàn là Khu phố Gò Cao thuộc thị trấn Hậu Nghĩa, huyện Đức Hòa, tỉnh Long An. Thực hiện Nghị quyết sắp xếp đơn vị hành chính cấp xã (có hiệu lực từ ngày 01/07/2025), thị trấn Hậu Nghĩa cũ được sáp nhập cùng xã Đức Lập Thượng và Tân Mỹ để thành lập xã Hậu Nghĩa trực thuộc tỉnh Tây Ninh. Chi bộ ấp Gò Cao tiếp tục kế thừa truyền thống kiên cường của vùng đất cách mạng, giữ vững vai trò nòng cốt chính trị tại địa phương.'
                    : 'Formerly, the area was Go Cao Quarter under Hau Nghia Town, Duc Hoa District, Long An Province. Under the administrative reorganization resolution (effective July 1, 2025), Hau Nghia Town merged with Duc Lap Thuong and Tan My to form Hau Nghia Commune, Tay Ninh Province. The Go Cao Hamlet Party Cell continues its steadfast revolutionary tradition as the core political leadership in the locality.'
                  }
                </p>
              </div>

              {/* Card 2 */}
              <div className="gocao-card" style={{
                padding: '24px 26px',
                borderRadius: '14px',
                border: '1px solid rgba(139, 69, 19, 0.18)',
                background: 'rgba(255, 255, 255, 0.5)',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.02)',
                display: 'flex',
                flexDirection: 'column',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                  <div style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '8px',
                    background: '#F5ECE3',
                    color: '#8B1E0F',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '15px',
                  }}>
                    <i className="fa-solid fa-building-columns"></i>
                  </div>
                  <h3 style={{
                    fontSize: '17.5px',
                    fontWeight: '700',
                    color: '#68350B',
                    margin: 0,
                    fontFamily: '"Playfair Display", "Roboto Slab", serif',
                  }}>
                    {isVi ? '2. Hạt nhân Lãnh đạo & Nền nếp Sinh hoạt Đảng' : '2. Political Core & Party Regular Activities'}
                  </h3>
                </div>
                <p style={{
                  fontSize: '14.5px',
                  lineHeight: '1.7',
                  color: '#422817',
                  textAlign: 'justify',
                  margin: 0,
                }}>
                  {isVi 
                    ? 'Chi bộ ấp Gò Cao luôn giữ vững nề nếp sinh hoạt định kỳ vào đầu mỗi tháng theo Điều lệ Đảng, kết hợp sinh hoạt chuyên đề bám sát nhiệm vụ thực tiễn. Các kỳ sinh hoạt chi bộ thường xuyên có sự tham dự và chỉ đạo trực tiếp của Thường trực Đảng ủy, lãnh đạo UBND xã Hậu Nghĩa. Chi bộ thực hiện nghiêm nguyên tắc tập trung dân chủ, tinh thần tự phê bình và phê bình, không ngừng nâng cao sức chiến đấu của tổ chức Đảng cơ sở.'
                    : 'The Go Cao Hamlet Party Cell strictly maintains its monthly regular meetings at the beginning of each month according to Party Statutes, along with topical thematic sessions. Meetings regularly receive direct supervision from the Standing Committee of the Commune Party Committee and People’s Committee leaders. The Cell adheres to democratic centralism, self-criticism, and relentless enhancement of grassroots leadership.'
                  }
                </p>
              </div>

              {/* Card 3 */}
              <div className="gocao-card" style={{
                padding: '24px 26px',
                borderRadius: '14px',
                border: '1px solid rgba(139, 69, 19, 0.18)',
                background: 'rgba(255, 255, 255, 0.5)',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.02)',
                display: 'flex',
                flexDirection: 'column',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                  <div style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '8px',
                    background: '#F5ECE3',
                    color: '#8B1E0F',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '15px',
                  }}>
                    <i className="fa-solid fa-users-rays"></i>
                  </div>
                  <h3 style={{
                    fontSize: '17.5px',
                    fontWeight: '700',
                    color: '#68350B',
                    margin: 0,
                    fontFamily: '"Playfair Display", "Roboto Slab", serif',
                  }}>
                    {isVi ? '3. Lãnh đạo Đoàn thể & Chi đoàn Thanh niên' : '3. Mass Organizations & Youth Leadership'}
                  </h3>
                </div>
                <p style={{
                  fontSize: '14.5px',
                  lineHeight: '1.7',
                  color: '#422817',
                  textAlign: 'justify',
                  margin: 0,
                }}>
                  {isVi 
                    ? 'Chi bộ trực tiếp lãnh đạo toàn diện hệ thống chính trị tại ấp gồm Ban Công tác Mặt trận, Chi hội Phụ nữ, Nông dân, Cựu chiến binh và nòng cốt là Chi đoàn TNCS Hồ Chí Minh ấp Gò Cao. Chi bộ đặc biệt quan tâm công tác giáo dục chính trị tư tưởng cho thế hệ trẻ, tạo điều kiện thuận lợi cho đoàn viên thanh niên cống hiến, rèn luyện và bồi dưỡng những đoàn viên ưu tú giới thiệu cho Đảng xem xét kết nạp.'
                    : 'The Cell exercises comprehensive leadership over local organizations including Fatherland Front, Women’s, Farmers’, Veterans’ associations, and notably the Ho Chi Minh Communist Youth Union branch of Go Cao. It pays special attention to political education for youth, fostering environments for dedicated service and training outstanding young members for Party admission.'
                  }
                </p>
              </div>

              {/* Card 4 */}
              <div className="gocao-card" style={{
                padding: '24px 26px',
                borderRadius: '14px',
                border: '1px solid rgba(139, 69, 19, 0.18)',
                background: 'rgba(255, 255, 255, 0.5)',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.02)',
                display: 'flex',
                flexDirection: 'column',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                  <div style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '8px',
                    background: '#F5ECE3',
                    color: '#8B1E0F',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '15px',
                  }}>
                    <i className="fa-solid fa-book-bookmark"></i>
                  </div>
                  <h3 style={{
                    fontSize: '17.5px',
                    fontWeight: '700',
                    color: '#68350B',
                    margin: 0,
                    fontFamily: '"Playfair Display", "Roboto Slab", serif',
                  }}>
                    {isVi ? '4. Không gian Văn hóa Bác Hồ & Phong trào Cơ sở' : '4. Uncle Ho Cultural Space & Local Movements'}
                  </h3>
                </div>
                <p style={{
                  fontSize: '14.5px',
                  lineHeight: '1.7',
                  color: '#422817',
                  textAlign: 'justify',
                  margin: 0,
                }}>
                  {isVi 
                    ? 'Ngày 24/4/2026, Chi bộ ấp Gò Cao long trọng tổ chức lễ ra mắt công trình “Không gian văn hóa Hồ Chí Minh” tại ấp. Đây là điểm sáng trong công tác giáo dục chính trị tư tưởng, lan tỏa sâu rộng việc học tập và làm theo tư tưởng, đạo đức, phong cách của Bác. Đồng thời, Chi bộ luôn gương mẫu đi đầu trong phong trào xây dựng đời sống văn hóa, chuyển đổi số cơ sở, giữ vững an ninh trật tự và chăm lo an sinh xã hội.'
                    : 'On April 24, 2026, Go Cao Hamlet Party Cell inaugurated the "Ho Chi Minh Cultural Space" at the hamlet. This is a spotlight initiative in ideological education, widely spreading the study of Uncle Ho’s thought, ethics, and style. Concurrently, the Cell leads local cultural movements, grassroots digital transformation, public security, and community welfare.'
                  }
                </p>
              </div>
            </div>

            {/* Slogan banner */}
            <div style={{
              padding: '16px 28px',
              borderRadius: '12px',
              border: '1px dashed rgba(197, 160, 89, 0.65)',
              background: 'rgba(255, 255, 255, 0.3)',
              textAlign: 'center',
              maxWidth: '860px',
              margin: '0 auto',
            }}>
              <p style={{
                margin: 0,
                fontSize: '15px',
                fontWeight: '700',
                color: '#8B1E0F',
                fontFamily: '"Playfair Display", "Roboto Slab", serif',
                letterSpacing: '0.4px',
              }}>
                <i className="fa-solid fa-quote-left" style={{ marginRight: '8px', opacity: 0.6, fontSize: '13px' }}></i>
                {isVi 
                  ? 'Đoàn kết – Kỷ cương – Gương mẫu – Trách nhiệm: Quyết tâm xây dựng Chi bộ ấp Gò Cao trong sạch, vững mạnh toàn diện.'
                  : 'Unity – Discipline – Exemplary Conduct – Responsibility: Determined to build the Go Cao Party Cell into a clean and comprehensively strong organization.'
                }
                <i className="fa-solid fa-quote-right" style={{ marginLeft: '8px', opacity: 0.6, fontSize: '13px' }}></i>
              </p>
            </div>
          </section>
        )}

      </div>
    </div>
  );
}
