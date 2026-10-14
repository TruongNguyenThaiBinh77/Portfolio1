export const dynamic = 'force-dynamic';
import { getPageContent, getTeachings, getConfig } from '../../../lib/config';
import ReactMarkdown from 'react-markdown';

export default async function Achievements({ params }) {
  const resolvedParams = await params;
  const lang = resolvedParams.lang || 'vi';
  const config = getConfig(lang);
  const { data: fm, content } = getPageContent('teaching.md', lang);
  const teachings = getTeachings(lang);
  
  const honors = teachings.filter(t => !t.frontMatter.is_certificate);
  const certificates = teachings.filter(t => t.frontMatter.is_certificate);

  // Title styling options from frontMatter
  const pageTitle = (lang === 'en' ? fm.title_en : fm.title) || (lang === 'vi' ? "Thành tích" : "Achievements");
  const pageTitleBold = fm.page_title_bold !== false;
  const pageTitleColor = fm.page_title_color || config.section_titles_color || '#8c0303';

  const honorsTitle = (lang === 'en' ? fm.honors_title_en : fm.honors_title) || (lang === 'vi' ? 'Thành tích nổi bật' : 'Awards & Honors');
  const honorsTitleBold = fm.honors_title_bold !== false;
  const honorsTitleColor = fm.honors_title_color || config.section_titles_color || '#8c0303';

  const certificatesTitle = (lang === 'en' ? fm.certificates_title_en : fm.certificates_title) || (lang === 'vi' ? 'Chứng chỉ & Bằng cấp' : 'Certificates');
  const certificatesTitleBold = fm.certificates_title_bold !== false;
  const certificatesTitleColor = fm.certificates_title_color || config.section_titles_color || '#8c0303';

  const cardTitleBold = fm.card_title_bold !== false;
  const cardTitleColor = fm.card_title_color || '';

  const renderGrid = (items, title, iconClass, emptyMessage, titleBold, titleColor) => (
    <div className="mb-5">
      <h2
        className="mb-4 d-flex align-items-center"
        style={{
          fontSize: '1.8rem',
          color: titleColor || 'var(--global-text-color)',
          fontWeight: titleBold ? 'bold' : 'normal',
        }}
      >
        <i className={`fas ${iconClass}`} style={{ color: titleColor || 'var(--global-theme-color)', marginRight: '14px', flexShrink: 0 }}></i> <span style={{ color: titleColor || 'inherit' }}>{title}</span>
      </h2>
      <div className="teaching-grid">
        {items.length > 0 ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '30px'
          }}>
            {items.map((course, index) => (
              <div key={index} className="teaching-card" style={{
                backgroundColor: 'var(--global-bg-color)',
                border: '1px solid var(--global-divider-color)',
                borderRadius: '16px',
                padding: '30px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                height: '100%'
              }}>
                {/* Top Accent Gradient */}
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: '6px',
                  background: 'linear-gradient(90deg, var(--global-theme-color), #b162cf)'
                }}></div>
                
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <span className="badge" style={{ backgroundColor: 'rgba(255, 193, 7, 0.15)', color: '#d9a406', fontSize: '0.85rem', padding: '6px 12px', borderRadius: '20px', fontWeight: 'bold' }}>
                    {course.frontMatter.year}
                  </span>
                  <i className={`fas ${iconClass}`} style={{ color: 'var(--global-theme-color)', opacity: 0.5, fontSize: '1.5rem' }}></i>
                </div>

                {(() => {
                  const previewImg = course.frontMatter.image || (course.frontMatter.certificate && course.frontMatter.certificate.match(/\.(jpg|jpeg|png|webp)$/i) ? course.frontMatter.certificate : null);
                  if (!previewImg) return null;
                  return (
                    <div style={{
                      width: '100%',
                      height: '170px',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      marginBottom: '15px',
                      border: '1px solid var(--global-divider-color)',
                      backgroundColor: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: 'inset 0 0 10px rgba(0,0,0,0.02)'
                    }}>
                      <img
                        src={previewImg}
                        alt={course.frontMatter.title}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          objectPosition: 'top center',
                          transition: 'transform 0.3s ease'
                        }}
                        className="cert-img-preview"
                      />
                    </div>
                  );
                })()}

                <h3
                  className="mb-2"
                  style={{
                    fontSize: '1.3rem',
                    lineHeight: '1.4',
                    fontWeight: cardTitleBold ? 'bold' : 'normal',
                    color: cardTitleColor || 'inherit',
                  }}
                >
                  <span style={{ color: cardTitleColor || 'inherit' }}>
                    {lang === 'vi' ? course.frontMatter.title : (course.frontMatter.title_en || course.frontMatter.title)}
                  </span>
                </h3>
                <p className="text-muted flex-grow-1" style={{ fontSize: '0.92rem', lineHeight: '1.6' }}>
                  {lang === 'vi' ? course.frontMatter.description : (course.frontMatter.description_en || course.frontMatter.description)}
                </p>

                <div className="mt-4 pt-3 d-flex flex-column gap-2" style={{ borderTop: '1px dashed var(--global-divider-color)', fontSize: '0.9rem' }}>
                  {(lang === 'vi' ? course.frontMatter.organization : (course.frontMatter.organization_en || course.frontMatter.organization)) && (
                    <div className="d-flex align-items-center mb-1">
                      <i className="fas fa-building me-2" style={{ width: '18px', color: 'var(--global-theme-color)' }}></i>
                      <span className="fw-semibold">{lang === 'vi' ? course.frontMatter.organization : (course.frontMatter.organization_en || course.frontMatter.organization)}</span>
                    </div>
                  )}

                  <div className="mt-2 d-flex flex-wrap align-items-center" style={{ gap: '10px' }}>
                    {course.frontMatter.show_certificate && course.frontMatter.certificate && (
                      <a
                        href={course.frontMatter.certificate}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-subtle-action"
                      >
                        <i className={course.frontMatter.certificate.endsWith('.pdf') ? "fa-regular fa-file-pdf" : "fa-solid fa-award"} style={{ opacity: 0.7 }}></i>
                        <span>{course.frontMatter.certificate.endsWith('.pdf') ? (lang === 'vi' ? 'Xem file PDF' : 'View PDF') : (lang === 'vi' ? 'Xem chứng nhận' : 'View Certificate')}</span>
                      </a>
                    )}

                    {course.frontMatter.verify_url && (
                      <a
                        href={course.frontMatter.verify_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-subtle-action"
                      >
                        <i className="fa-solid fa-arrow-up-right-from-square" style={{ fontSize: '0.75rem', opacity: 0.65 }}></i>
                        <span>{lang === 'vi' ? 'Xác minh trực tuyến' : 'Verify Online'}</span>
                      </a>
                    )}
                  </div>
                </div>
                
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center p-5" style={{ border: '2px dashed var(--global-divider-color)', borderRadius: '12px' }}>
            <i className={`fas ${iconClass} mb-3`} style={{ fontSize: '3rem', color: 'var(--global-text-color)', opacity: 0.2 }}></i>
            <h4 className="text-muted">{emptyMessage}</h4>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="container mt-5 mb-5" role="main" style={{ minHeight: '80vh' }}>
      <div className="post">
        <header className="post-header text-center mb-5">
          <h1
            className="post-title"
            style={{
              fontSize: '3rem',
              fontWeight: pageTitleBold ? 'bold' : 'normal',
              color: pageTitleColor || '#8c0303',
            }}
          >
            <span style={{ color: pageTitleColor || 'inherit' }}>{pageTitle}</span>
          </h1>
          <p className="post-description text-muted fs-5 mt-3">{fm.description}</p>
          <div style={{ width: '60px', height: '4px', backgroundColor: pageTitleColor || '#8c0303', margin: '20px auto', borderRadius: '2px' }}></div>
        </header>
        
        <article>
          <div className="content mb-5 text-center" style={{ fontSize: '1.1rem', lineHeight: '1.8' }}>
            <ReactMarkdown>{content.replace(/{%.*?%}/g, '')}</ReactMarkdown>
          </div>

          {renderGrid(honors, honorsTitle, 'fa-award', lang === 'vi' ? 'Chưa có dữ liệu thành tích' : 'No honors available', honorsTitleBold, honorsTitleColor)}
          
          {renderGrid(certificates, certificatesTitle, 'fa-certificate', lang === 'vi' ? 'Chưa có dữ liệu chứng chỉ' : 'No certificates available', certificatesTitleBold, certificatesTitleColor)}
        </article>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .teaching-card:hover {
          transform: translateY(-10px);
          box-shadow: 0 15px 40px rgba(0,0,0,0.1) !important;
          border-color: var(--global-theme-color) !important;
        }
        .teaching-card:hover .cert-img-preview {
          transform: scale(1.05);
        }
        .btn-subtle-action:hover {
          background-color: var(--global-divider-color, #f3f4f6) !important;
          border-color: #9ca3af !important;
          color: var(--global-text-color, #111827) !important;
          text-decoration: none !important;
        }
      `}} />
    </div>
  );
}
