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

  const renderGrid = (items, title, iconClass, emptyMessage, titleBold, titleColor, isCertificateSection = false, customStyle = {}) => (
    <div style={{ marginBottom: isCertificateSection ? '0' : '50px', ...customStyle }}>
      <h2
        className="title-nexa-rust d-flex align-items-center"
        style={{
          fontSize: '1.65rem',
          color: '#6f3706',
          marginBottom: '22px',
          letterSpacing: '1px',
          textTransform: 'uppercase',
        }}
      >
        <i className={`fas ${iconClass}`} style={{ color: '#6f3706', marginRight: '12px', flexShrink: 0, fontSize: '1.35rem' }}></i>
        <span>{title}</span>
      </h2>
      <div className={isCertificateSection ? "achievements-grid-4" : "achievements-grid-auto"}>
        {items.length > 0 ? (
          items.map((course, index) => {
            const isCert = course.frontMatter.is_certificate;
            const titleText = lang === 'vi' ? course.frontMatter.title : (course.frontMatter.title_en || course.frontMatter.title);
            const descText = lang === 'vi' ? course.frontMatter.description : (course.frontMatter.description_en || course.frontMatter.description);
            const orgName = lang === 'vi' ? course.frontMatter.organization : (course.frontMatter.organization_en || course.frontMatter.organization);
            const previewImg = course.frontMatter.image || (course.frontMatter.certificate && course.frontMatter.certificate.match(/\.(jpg|jpeg|png|webp)$/i) ? course.frontMatter.certificate : null);

            return (
              <div key={index} className="coursera-card" style={{
                backgroundColor: 'var(--global-bg-color, #ffffff)',
                border: '1px solid var(--global-divider-color, #e2e8f0)',
                borderRadius: '12px',
                padding: '14px 14px 16px 14px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                transition: 'all 0.25s ease',
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                position: 'relative',
                overflow: 'hidden'
              }}>
                {/* Top subtle highlight line */}
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
                  backgroundColor: 'var(--global-theme-color, #0056b3)',
                  opacity: 0.8
                }}></div>

                {/* Thumbnail Frame like Coursera */}
                {previewImg ? (
                  <div style={{
                    width: '100%',
                    height: '155px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    marginBottom: '12px',
                    border: '1px solid var(--global-divider-color, #e5e7eb)',
                    backgroundColor: '#f8fafc',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative'
                  }}>
                    <img
                      src={previewImg}
                      alt={titleText}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: isCert ? 'contain' : 'cover',
                        objectPosition: 'center',
                        backgroundColor: isCert ? '#ffffff' : 'transparent',
                        transition: 'transform 0.3s ease'
                      }}
                      className="coursera-card-img"
                    />
                    {course.frontMatter.year && (
                      <span style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        backgroundColor: 'rgba(15, 23, 42, 0.75)',
                        color: '#ffffff',
                        fontSize: '0.72rem',
                        fontWeight: '600',
                        padding: '2px 7px',
                        borderRadius: '6px',
                        backdropFilter: 'blur(4px)',
                        letterSpacing: '0.3px'
                      }}>
                        {course.frontMatter.year}
                      </span>
                    )}
                  </div>
                ) : (
                  <div style={{
                    width: '100%',
                    height: '130px',
                    borderRadius: '8px',
                    marginBottom: '12px',
                    border: '1px dashed var(--global-divider-color, #e5e7eb)',
                    backgroundColor: '#f8fafc',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <i className={`fas ${iconClass}`} style={{ fontSize: '2.5rem', color: 'var(--global-theme-color)', opacity: 0.3 }}></i>
                  </div>
                )}

                {/* Title */}
                <h3
                  style={{
                    fontSize: '0.96rem',
                    lineHeight: '1.38',
                    fontWeight: cardTitleBold ? '700' : '600',
                    color: cardTitleColor || 'var(--global-text-color, #1e293b)',
                    marginTop: '2px',
                    marginBottom: '8px',
                    minHeight: '2.76em',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                  title={titleText}
                >
                  <span style={{ color: cardTitleColor || 'inherit' }}>{titleText}</span>
                </h3>

                {/* Coursera-style Action Links */}
                <div className="d-flex align-items-center flex-wrap gap-3 mb-2" style={{ fontSize: '0.84rem' }}>
                  {course.frontMatter.show_certificate && course.frontMatter.certificate && (
                    <a
                      href={course.frontMatter.certificate}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="coursera-action-link"
                    >
                      <i className={course.frontMatter.certificate.endsWith('.pdf') ? "fa-regular fa-file-pdf" : "fa-solid fa-award"} style={{ fontSize: '0.78rem' }}></i>
                      <span>{course.frontMatter.certificate.endsWith('.pdf') ? (lang === 'vi' ? 'Xem file PDF' : 'View PDF') : (lang === 'vi' ? 'Xem chứng nhận' : 'View certificate')}</span>
                    </a>
                  )}

                  {course.frontMatter.verify_url && (
                    <a
                      href={course.frontMatter.verify_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="coursera-action-link"
                    >
                      <i className="fa-solid fa-arrow-up-right-from-square" style={{ fontSize: '0.72rem' }}></i>
                      <span>{lang === 'vi' ? 'Xác minh' : 'Verify'}</span>
                    </a>
                  )}
                </div>

                {/* Organization */}
                {orgName && (
                  <div className="text-muted text-truncate mb-1" style={{ fontSize: '0.83rem', color: '#475569' }} title={orgName}>
                    <span>{orgName}</span>
                  </div>
                )}

                {/* Completed Year */}
                <div className="text-muted mb-2" style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  <span>{lang === 'vi' ? `Hoàn thành năm ${course.frontMatter.year}` : `Completed ${course.frontMatter.year}`}</span>
                </div>

                {/* Short Description */}
                {descText && (
                  <p className="text-muted mt-auto pt-2 mb-0" style={{
                    fontSize: '0.79rem',
                    lineHeight: '1.45',
                    color: '#64748b',
                    borderTop: '1px dashed var(--global-divider-color, #e5e7eb)',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }} title={descText}>
                    {descText}
                  </p>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center p-5 w-100" style={{ border: '2px dashed var(--global-divider-color)', borderRadius: '12px', gridColumn: '1 / -1' }}>
            <i className={`fas ${iconClass} mb-3`} style={{ fontSize: '3rem', color: 'var(--global-text-color)', opacity: 0.2 }}></i>
            <h4 className="text-muted">{emptyMessage}</h4>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div role="main" style={{ minHeight: '80vh', width: '100%', overflowX: 'hidden' }}>
      {/* Page Header */}
      <div className="container mt-5 mb-4 text-center">
        <header className="post-header mb-4">
          <h1
            className="title-nexa-rust star-title post-title"
            style={{
              fontSize: 'clamp(32px, 4.5vw, 54px)',
              lineHeight: '1.25',
              marginBottom: '16px',
            }}
          >
            <span className="star-icon">★</span>
            <span>{pageTitle}</span>
            <span className="star-icon">★</span>
          </h1>
          {fm.description && <p className="post-description text-muted fs-5 mt-2">{fm.description}</p>}
          <div style={{ width: '60px', height: '4px', backgroundColor: '#6f3706', margin: '18px auto', borderRadius: '2px' }}></div>
        </header>
        
        {content && (
          <div className="content mb-4" style={{ fontSize: '1.05rem', lineHeight: '1.7', maxWidth: '850px', margin: '0 auto 20px auto' }}>
            <ReactMarkdown>{content.replace(/{%.*?%}/g, '')}</ReactMarkdown>
          </div>
        )}
      </div>

      {/* Unified Achievements Container: Coursera-style standard width for both sections */}
      <div className="achievements-main-container" style={{
        width: '100%',
        maxWidth: '1280px',
        marginLeft: 'auto',
        marginRight: 'auto',
        paddingLeft: '24px',
        paddingRight: '24px',
        marginBottom: '70px',
        boxSizing: 'border-box'
      }}>
        {/* Honors Section */}
        <section style={{ marginBottom: '60px' }}>
          {renderGrid(honors, honorsTitle, 'fa-award', lang === 'vi' ? 'Chưa có dữ liệu thành tích' : 'No honors available', honorsTitleBold, honorsTitleColor, false)}
        </section>

        {/* Certificates Section */}
        <section style={{
          borderTop: '1px solid var(--global-divider-color, rgba(0,0,0,0.08))',
          paddingTop: '45px'
        }}>
          {renderGrid(certificates, certificatesTitle, 'fa-certificate', lang === 'vi' ? 'Chưa có dữ liệu chứng chỉ' : 'No certificates available', certificatesTitleBold, certificatesTitleColor, true)}
        </section>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .achievements-grid-4 {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 20px;
        }
        .achievements-grid-auto {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 20px;
        }
        @media (max-width: 1200px) {
          .achievements-grid-4, .achievements-grid-auto {
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 18px;
          }
        }
        @media (max-width: 860px) {
          .achievements-grid-4, .achievements-grid-auto {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 16px;
          }
          .achievements-main-container {
            padding-left: 18px !important;
            padding-right: 18px !important;
          }
        }
        @media (max-width: 560px) {
          .achievements-grid-4, .achievements-grid-auto {
            grid-template-columns: 1fr;
            gap: 16px;
          }
          .achievements-main-container {
            padding-left: 12px !important;
            padding-right: 12px !important;
          }
        }
        .coursera-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 25px rgba(0,0,0,0.08) !important;
          border-color: #cbd5e1 !important;
        }
        .coursera-card:hover .coursera-card-img {
          transform: scale(1.03);
        }
        .coursera-action-link {
          color: var(--global-theme-color, #0056b3) !important;
          font-weight: 500;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          transition: color 0.15s ease, text-decoration 0.15s ease;
        }
        .coursera-action-link:hover {
          color: #003366 !important;
          text-decoration: underline !important;
        }
        html[data-theme="dark"] .coursera-action-link {
          color: #60a5fa !important;
        }
        html[data-theme="dark"] .coursera-action-link:hover {
          color: #93c5fd !important;
        }
      `}} />
    </div>
  );
}
