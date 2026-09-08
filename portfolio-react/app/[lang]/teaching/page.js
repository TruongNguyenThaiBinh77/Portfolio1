export const dynamic = 'force-dynamic';
import { getPageContent, getTeachings } from '../../../lib/config';
import ReactMarkdown from 'react-markdown';

export default async function Teaching({ params }) {
  const resolvedParams = await params;
  const lang = resolvedParams.lang || 'vi';
  const { data: fm, content } = getPageContent('teaching.md', lang);
  const teachings = getTeachings(lang);
  
  const honors = teachings.filter(t => !t.frontMatter.is_certificate);
  const certificates = teachings.filter(t => t.frontMatter.is_certificate);

  const renderGrid = (items, title, iconClass, emptyMessage) => (
    <div className="mb-5">
      <h2 className="mb-4 d-flex align-items-center" style={{ fontSize: '1.8rem', color: 'var(--global-text-color)', fontWeight: 'bold' }}>
        <i className={`fas ${iconClass} me-3`} style={{ color: 'var(--global-theme-color)' }}></i> {title}
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

                <h3 className="mb-3 fw-bold" style={{ fontSize: '1.4rem' }}>{lang === 'vi' ? course.frontMatter.title : (course.frontMatter.title_en || course.frontMatter.title)}</h3>
                <p className="text-muted flex-grow-1" style={{ fontSize: '0.95rem', lineHeight: '1.6' }}>
                  {lang === 'vi' ? course.frontMatter.description : (course.frontMatter.description_en || course.frontMatter.description)}
                </p>

                <div className="mt-4 pt-4 d-flex flex-column gap-2" style={{ borderTop: '1px dashed var(--global-divider-color)', fontSize: '0.9rem' }}>
                  {(lang === 'vi' ? course.frontMatter.organization : (course.frontMatter.organization_en || course.frontMatter.organization)) && (
                    <div className="d-flex align-items-center mb-2">
                      <i className="fas fa-building me-3" style={{ width: '20px', color: 'var(--global-text-color)' }}></i>
                      <span>{lang === 'vi' ? course.frontMatter.organization : (course.frontMatter.organization_en || course.frontMatter.organization)}</span>
                    </div>
                  )}
                  {course.frontMatter.show_certificate && course.frontMatter.certificate && (
                    <div className="mt-2 d-flex align-items-center">
                      <a href={course.frontMatter.certificate} target="_blank" rel="noopener noreferrer" className="btn btn-sm fw-bold btn-certificate" style={{
                        background: 'linear-gradient(135deg, var(--global-theme-color), #b162cf)',
                        color: 'white',
                        border: 'none',
                        boxShadow: '0 4px 10px rgba(177, 98, 207, 0.3)',
                        borderRadius: '6px',
                        padding: '6px 14px',
                        fontSize: '0.8rem',
                        transition: 'all 0.3s ease',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <i className="fas fa-external-link-alt"></i> {lang === 'vi' ? 'Xem chứng nhận' : 'View Certificate'}
                      </a>
                    </div>
                  )}
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
          <h1 className="post-title fw-bold" style={{ fontSize: '3rem', color: 'var(--global-theme-color)' }}>
            {fm.title || "Teaching"}
          </h1>
          <p className="post-description text-muted fs-5 mt-3">{fm.description}</p>
          <div style={{ width: '60px', height: '4px', backgroundColor: 'var(--global-theme-color)', margin: '20px auto', borderRadius: '2px' }}></div>
        </header>
        
        <article>
          <div className="content mb-5 text-center" style={{ fontSize: '1.1rem', lineHeight: '1.8' }}>
            <ReactMarkdown>{content.replace(/{%.*?%}/g, '')}</ReactMarkdown>
          </div>

          {renderGrid(honors, lang === 'vi' ? 'Thành tích nổi bật' : 'Awards & Honors', 'fa-award', lang === 'vi' ? 'Chưa có dữ liệu thành tích' : 'No honors available')}
          
          {renderGrid(certificates, lang === 'vi' ? 'Chứng chỉ & Bằng cấp' : 'Certificates', 'fa-certificate', lang === 'vi' ? 'Chưa có dữ liệu chứng chỉ' : 'No certificates available')}
        </article>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .teaching-card:hover {
          transform: translateY(-10px);
          box-shadow: 0 15px 40px rgba(0,0,0,0.1) !important;
          border-color: var(--global-theme-color) !important;
        }
        .btn-certificate:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 15px rgba(177, 98, 207, 0.4) !important;
          color: white !important;
          opacity: 0.95;
        }
      `}} />
    </div>
  );
}
