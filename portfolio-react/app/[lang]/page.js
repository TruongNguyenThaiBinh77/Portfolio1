import { getConfig, getPageContent, getAllArticles } from '../../lib/config';
import { remark } from 'remark';
import html from 'remark-html';

export const dynamic = 'force-dynamic';

export default async function Home({ params }) {
  const resolvedParams = await params;
  const lang = resolvedParams.lang || 'en';
  const config = getConfig(lang);
  const { data: fm, content } = getPageContent('about.md', lang);
  const articles = getAllArticles(lang);
  const st = lang === 'vi' ? (config.section_titles || {}) : (config.section_titles_en || {});

  // Convert markdown content to HTML
  const processedContent = await remark().use(html, { sanitize: false }).process(content);
  const contentHtml = processedContent.toString();

  // Process articles content for homepage preview
  const processedNews = await Promise.all(articles.map(async (item) => {
    let htmlContent = "";
    if (item.content) {
      const p = await remark().use(html, { sanitize: false }).process(item.content);
      htmlContent = p.toString();
    }
    
    return {
      ...item,
      htmlContent,
      frontMatter: item.frontMatter || {
        title: item.title,
        author: item.author,
        institution: item.institution,
        journal: item.journal,
        description: item.abstract,
        external_url: item.url,
        pdf: item.pdf,
        preview: item.preview,
      }
    };
  }));

  return (
    <div className="container mt-5" role="main">
      <div className="post">
        <header className="post-header">
          <h1 className="post-title">
            <span className={config.first_name_bold ? "font-weight-bold" : ""}>{config.first_name}</span>{" "}
            <span className={config.middle_name_bold ? "font-weight-bold" : ""}>{config.middle_name}</span>{" "}
            <span className={config.last_name_bold ? "font-weight-bold" : ""}>{config.last_name}</span>
          </h1>
          <p className="desc">{fm.subtitle}</p>
        </header>

        <article>
          <style>{`
            .news-title-link,
            .news-title-link:hover {
              color: var(--global-hover-color, #8c0303) !important;
              text-decoration: none !important;
            }
            .about-content-body p {
              margin-bottom: 1rem;
            }
            .social {
              text-align: center;
              margin: 32px 0 20px;
            }
            .social .contact-icons {
              display: flex;
              justify-content: center;
              align-items: center;
              flex-wrap: wrap;
              gap: 24px;
              font-size: 1.75rem !important;
              margin-bottom: 12px;
            }
            .social .contact-icons a {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              text-decoration: none !important;
              transition: transform 0.2s ease, filter 0.2s ease;
            }
            .social .contact-icons a img {
              width: 1.15em !important;
              height: 1.15em !important;
              object-fit: contain;
              margin-bottom: 0 !important;
              display: inline-block;
            }
            .social .contact-icons a:hover {
              transform: translateY(-3px) scale(1.12);
              filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.16));
            }
            .social .contact-icons a i {
              color: inherit !important;
            }
            .social .contact-icons a i::before {
              color: inherit !important;
            }
            .social .contact-note {
              font-size: 0.88rem;
              color: var(--global-text-color-light, #64748b);
              margin-top: 6px;
            }
            @media (max-width: 767px) {
              .profile.float-right {
                float: none !important;
                margin-left: 0 !important;
                margin-bottom: 2rem !important;
                text-align: center;
              }
              .profile.float-right img {
                max-width: 250px;
                margin: 0 auto;
              }
            }
          `}</style>
          <div className="profile float-right">
            {fm.profile?.image && (
              <figure>
                <picture>
                  <img src={`/assets/img/${fm.profile.image}`} className={`img-fluid z-depth-1 rounded ${fm.profile.image_circular ? 'rounded-circle' : ''}`} width="100%" height="auto" alt={fm.profile.image} />
                </picture>
              </figure>
            )}
            
            <div className="more-info">
              {fm.profile?.more_info_rows ? (
                fm.profile.more_info_rows.map((row, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span dangerouslySetInnerHTML={{ __html: row.text }} />
                    {row.logo && (
                      <div style={{
                        backgroundColor: row.logo_bg_color || 'transparent',
                        padding: row.logo_bg_color && row.logo_bg_color !== '#ffffff' && row.logo_bg_color !== '' ? '5px' : '0',
                        borderRadius: '4px',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginLeft: '10px'
                      }}>
                        <img src={`/assets/img/${row.logo}`} style={{ width: row.logo_width ? (String(row.logo_width).includes('px') || String(row.logo_width).includes('%') ? row.logo_width : `${row.logo_width}px`) : '30px', objectFit: 'contain', display: 'block' }} alt="logo" />
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div dangerouslySetInnerHTML={{ __html: fm.profile?.more_info || '' }} />
              )}
            </div>
          </div>
          
          {/* Render the actual Markdown content from about.md here, not more_info */}
          <div className="clearfix about-content-body" dangerouslySetInnerHTML={{ __html: contentHtml }}></div>

          {/* News Section */}
          {processedNews.length > 0 && (fm.news || fm.announcements?.enabled !== false) && (
            <div className="news mt-5 pt-3" id="news-section">
              <div className="section-header-framed mb-3">
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '4px 14px',
                    borderRadius: '18px',
                    border: 'none',
                    backgroundColor: 'rgba(140, 3, 3, 0.08)',
                    boxShadow: 'none',
                  }}
                >
                  <i
                    className="fa-solid fa-newspaper"
                    style={{
                      fontSize: '0.85rem',
                      color: config.section_titles_color || '#8c0303',
                    }}
                  ></i>
                  <h2
                    style={{
                      margin: 0,
                      fontSize: '1.02rem',
                      fontWeight: '600',
                      letterSpacing: '0.2px',
                      color: config.section_titles_color || '#8c0303',
                      lineHeight: 1.2,
                    }}
                  >
                    {st.about_news || (lang === 'vi' ? 'Bài báo' : 'News')}
                  </h2>
                </div>
              </div>

              <div className="table-responsive">
                <table className="table table-sm table-borderless">
                  <tbody>
                    {/* Hiển thị bài báo tiêu biểu trên trang chủ */}
                    {processedNews.slice(0, 2).map((item, index) => {
                      const fmItem = item.frontMatter || {};
                      const hasTitle = Boolean(fmItem.title);
                      const targetUrl = fmItem.external_url || fmItem.link || (fmItem.inline ? null : `/news/${item.slug}`);
                      const isExternal = Boolean(fmItem.external_url || fmItem.link);
                      const pdfUrl = fmItem.pdf || fmItem.pdf_url;

                      return (
                        <tr
                          key={index}
                          style={{
                            borderBottom: index < Math.min(processedNews.length, 2) - 1 ? '1px solid rgba(0,0,0,0.08)' : 'none',
                          }}
                        >
                          <th
                            scope="row"
                            style={{
                              width: '15%',
                              minWidth: '105px',
                              fontWeight: '600',
                              paddingRight: '1rem',
                              verticalAlign: 'top',
                              paddingTop: '4px',
                              paddingBottom: '1rem',
                              color: '#64748b',
                            }}
                          >
                            <div className="news-date-text" style={{ fontSize: '0.86rem', lineHeight: '1.3' }}>
                              {item.dateParts && item.dateParts.length === 3 ? (
                                <>
                                  <span style={{ whiteSpace: 'nowrap' }}>
                                    {item.dateParts[0]} {item.dateParts[1]}
                                  </span>
                                  <br />
                                  <span style={{ opacity: 0.8, fontSize: '0.88em' }}>{item.dateParts[2]}</span>
                                </>
                              ) : (
                                item.dateStr
                              )}
                            </div>

                            {/* Section mới: Hình chữ nhật nhỏ (text) và hình chữ nhật to (ảnh minh họa) */}
                            {((fmItem.sidebox_text || item.sidebox_text) || (fmItem.sidebox_image || item.sidebox_image)) && (
                              <div
                                className="news-sidebox-container"
                                style={{
                                  marginTop: '8px',
                                  width: `${parseInt(fmItem.sidebox_width || item.sidebox_width || 95, 10)}px`,
                                  maxWidth: '100%',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '6px',
                                }}
                              >
                                                                 {(fmItem.sidebox_text || item.sidebox_text) && (
                                  <div
                                    className="news-sidebox-small-rect"
                                    style={{
                                      width: '100%',
                                      backgroundColor: fmItem.sidebox_bg_color || item.sidebox_bg_color || '#800000',
                                      color: fmItem.sidebox_text_color || item.sidebox_text_color || '#ffffff',
                                      padding: '3px 6px',
                                      borderRadius: '4px',
                                      textAlign: 'center',
                                      fontWeight: '700',
                                      fontSize: '0.74rem',
                                      lineHeight: '1.2',
                                      letterSpacing: '0.3px',
                                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                      wordBreak: 'break-word',
                                    }}
                                  >
                                    {lang === 'en' ? (fmItem.sidebox_text_en || item.sidebox_text_en || fmItem.badge_name_en || fmItem.sidebox_text || item.sidebox_text) : (fmItem.sidebox_text || item.sidebox_text)}
                                  </div>
                                )}

                                {/* Hình chữ nhật to: Ảnh minh họa */}
                                {(fmItem.sidebox_image || item.sidebox_image) && (
                                  <div
                                    className="news-sidebox-big-rect"
                                    style={{
                                      width: '100%',
                                      borderRadius: '4px',
                                      overflow: 'hidden',
                                      border: '1px solid #cbd5e1',
                                      backgroundColor: '#ffffff',
                                      boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      padding: '3px',
                                    }}
                                  >
                                    <img
                                      src={(() => {
                                        const img = fmItem.sidebox_image || item.sidebox_image;
                                        if (img.startsWith('http://') || img.startsWith('https://') || img.startsWith('/')) return img;
                                        return `/assets/img/${img}`;
                                      })()}
                                      alt={fmItem.sidebox_text || item.sidebox_text || 'Illustration'}
                                      style={{
                                        width: '100%',
                                        height: 'auto',
                                        maxHeight: '105px',
                                        objectFit: 'contain',
                                        borderRadius: '3px',
                                        display: 'block',
                                      }}
                                    />
                                  </div>
                                )}
                              </div>
                            )}
                          </th>
                          <td style={{ verticalAlign: 'top', paddingBottom: '1rem' }}>
                            {hasTitle ? (
                              <div className="news-article-card">
                                {/* Badge loại tạp chí ở vị trí ban đầu phía trên tiêu đề */}
                                {fmItem.journal && (
                                  <div style={{ marginBottom: '6px' }}>
                                    <span
                                      style={{
                                        backgroundColor: fmItem.journal_bg_color || item.journal_bg_color || '#fee2e2',
                                        color: fmItem.journal_color || item.journal_color || '#991b1b',
                                        border: `1px solid ${fmItem.journal_border_color || item.journal_border_color || '#fca5a5'}`,
                                        fontSize: '0.72rem',
                                        fontWeight: '600',
                                        padding: '2px 8px',
                                        borderRadius: '8px',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                                      }}
                                    >
                                      <span
                                        style={{
                                          display: 'inline-block',
                                          width: '13px',
                                          height: '13px',
                                          backgroundColor: 'currentColor',
                                          maskImage: 'url(/assets/img/journal-icon.png)',
                                          WebkitMaskImage: 'url(/assets/img/journal-icon.png)',
                                          maskSize: 'contain',
                                          WebkitMaskSize: 'contain',
                                          maskRepeat: 'no-repeat',
                                          WebkitMaskRepeat: 'no-repeat',
                                          maskPosition: 'center',
                                          WebkitMaskPosition: 'center',
                                          verticalAlign: '-1px',
                                          flexShrink: 0,
                                        }}
                                      />
                                      {lang === 'vi' ? fmItem.journal : (fmItem.journal_en || fmItem.journal)}
                                    </span>
                                  </div>
                                )}

                                {/* Tiêu đề bài báo */}
                                <h3 style={{ fontSize: '1.02rem', fontWeight: '600', lineHeight: '1.4', margin: '0 0 6px 0' }}>
                                  {targetUrl ? (
                                    <a
                                      href={targetUrl}
                                      target={isExternal ? '_blank' : undefined}
                                      rel={isExternal ? 'noopener noreferrer' : undefined}
                                      className="news-title-link"
                                      style={{
                                        color: '#1e293b',
                                        textDecoration: 'none',
                                        display: 'inline-flex',
                                        alignItems: 'baseline',
                                        gap: '5px',
                                      }}
                                    >
                                      <span>{fmItem.title}</span>
                                      {isExternal && (
                                        <i
                                          className="fa-solid fa-arrow-up-right-from-square"
                                          style={{ fontSize: '0.72rem', opacity: 0.7 }}
                                        ></i>
                                      )}
                                    </a>
                                  ) : (
                                    <span>{fmItem.title}</span>
                                  )}
                                </h3>

                                {/* Tác giả bên dưới tiêu đề */}
                                {fmItem.author && (
                                  <div style={{ fontSize: '0.82rem', color: '#475569', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '5px', marginTop: '2px', marginBottom: '8px' }}>
                                    <i className="fa-solid fa-user-pen" style={{ fontSize: '0.74rem', color: '#64748b' }}></i>
                                    <span style={{ fontWeight: '600', color: '#334155' }}>
                                      {lang === 'vi' ? fmItem.author : (fmItem.author_en || fmItem.author)}
                                    </span>
                                    {(lang === 'vi' ? fmItem.institution : (fmItem.institution_en || fmItem.institution)) && (
                                      <span style={{ color: '#64748b' }}>
                                        ({lang === 'vi' ? fmItem.institution : (fmItem.institution_en || fmItem.institution)})
                                      </span>
                                    )}
                                  </div>
                                )}

                                {(fmItem.description || item.htmlContent) && (
                                  <p
                                    style={{
                                      fontSize: '0.86rem',
                                      lineHeight: '1.55',
                                      color: '#475569',
                                      marginBottom: '8px',
                                      display: '-webkit-box',
                                      WebkitLineClamp: 2,
                                      WebkitBoxOrient: 'vertical',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                    }}
                                  >
                                    {fmItem.description || item.content?.replace(/^#+\s+/gm, '')?.substring(0, 300) + '...'}
                                  </p>
                                )}

                                {/* Metric Badges (IF, Q1, FWCI, ISSN...) */}
                                {(() => {
                                  const badges = fmItem.metric_badges || item.metric_badges;
                                  if (!badges || !Array.isArray(badges) || badges.length === 0) return null;
                                  return (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center', marginTop: '6px', marginBottom: '6px' }}>
                                      {badges.map((b, bIdx) => {
                                        let text = '';
                                        if (typeof b === 'string') {
                                          text = b;
                                        } else if (b && typeof b === 'object') {
                                          const lbl = b.label || b.name || '';
                                          let val = b.value !== undefined ? b.value : '';
                                          if (lang === 'en' && typeof val === 'string' && val.toLowerCase().includes('chưa có data')) {
                                            val = 'N/A';
                                          }
                                          if (lbl && val) {
                                            if (val.startsWith('(') || lbl.endsWith(':')) {
                                              text = `${lbl} ${val}`.trim();
                                            } else {
                                              text = `${lbl}: ${val}`;
                                            }
                                          } else {
                                            text = lbl || val;
                                          }
                                        }
                                        if (!text) return null;
                                        return (
                                          <span
                                            key={bIdx}
                                            style={{
                                              display: 'inline-flex',
                                              alignItems: 'center',
                                              padding: '2px 7px',
                                              backgroundColor: '#f1f5f9',
                                              color: '#0f172a',
                                              border: '1px solid #cbd5e1',
                                              borderRadius: '4px',
                                              fontSize: '0.74rem',
                                              fontWeight: '600',
                                              lineHeight: '1.25',
                                              boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                                              letterSpacing: '0.2px',
                                              whiteSpace: 'nowrap',
                                            }}
                                          >
                                            {text}
                                          </span>
                                        );
                                      })}
                                    </div>
                                  );
                                })()}

                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
                                  {pdfUrl && (
                                    <a
                                      href={pdfUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="btn-subtle-action"
                                    >
                                      <i className="fa-regular fa-file-pdf" style={{ opacity: 0.7 }}></i>
                                      <span>{lang === 'vi' ? 'Xem file PDF' : 'View PDF'}</span>
                                    </a>
                                  )}
                                  {isExternal && (
                                    <a
                                      href={targetUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="btn-subtle-action"
                                    >
                                      <i className="fa-solid fa-arrow-up-right-from-square" style={{ fontSize: '0.75rem', opacity: 0.65 }}></i>
                                      <span>{lang === 'vi' ? 'Đọc bài báo gốc' : 'Read original article'}</span>
                                    </a>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div dangerouslySetInnerHTML={{ __html: item.htmlContent }} />
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Nút xem toàn bộ danh sách ấn phẩm */}
              <div className="d-flex justify-content-center mt-3 mb-2">
                <a
                  href={`/${lang}/publications`}
                  className="btn-subtle-action"
                  style={{
                    padding: '6px 18px',
                    fontSize: '0.85rem',
                  }}
                >
                  <span>{lang === 'vi' ? 'Xem toàn bộ ấn phẩm khoa học' : 'View all publications'}</span>
                  <i className="fa-solid fa-arrow-right" style={{ fontSize: '0.75rem', opacity: 0.7 }}></i>
                </a>
              </div>
            </div>
          )}
          {/* Social Section */}
          {fm.social && (
            <div className="social">
              <div className="contact-icons">
                {(() => {
                  const getSocialUrl = (id, baseUrl) => {
                    if (!id) return null;
                    let strId = String(id).trim();
                    if (!strId) return null;
                    if (strId.startsWith('http://') || strId.startsWith('https://')) return strId;
                    if (strId.startsWith('www.')) return `https://${strId}`;
                    if (baseUrl.endsWith('/') && strId.startsWith('/')) {
                      strId = strId.slice(1);
                    }
                    return `${baseUrl}${strId}`;
                  };

                  const getEmailUrl = (email) => {
                    if (!email) return null;
                    const str = String(email).trim();
                    if (!str) return null;
                    if (str.startsWith('http://') || str.startsWith('https://') || str.startsWith('mailto:')) {
                      return str;
                    }
                    if (str.startsWith('www.')) {
                      return `https://${str}`;
                    }
                    return `mailto:${str}`;
                  };

                  return (
                    <>
                      {config.email && (
                        <a
                          href={getEmailUrl(config.email)}
                          title="Gmail / Email"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <img
                            src="/assets/img/gmail-icon.png"
                            alt="Gmail"
                            style={{
                              width: '1.15em',
                              height: '1.15em',
                              objectFit: 'contain',
                              display: 'inline-block',
                              verticalAlign: 'middle',
                            }}
                          />
                        </a>
                      )}
                      {config.orcid_id && (
                        <a
                          href={getSocialUrl(config.orcid_id, 'https://orcid.org/')}
                          title="ORCID"
                          style={{ color: '#A6CE39' }}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <i className="ai ai-orcid"></i>
                        </a>
                      )}
                      {(config.scholar_userid || config.google_scholar_id) && (
                        <a
                          href={getSocialUrl(
                            config.scholar_userid || config.google_scholar_id,
                            'https://scholar.google.com/citations?user='
                          )}
                          title="Google Scholar"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <img
                            src="/assets/img/scholar-icon.png"
                            alt="Google Scholar"
                            style={{
                              width: '1.15em',
                              height: '1.15em',
                              objectFit: 'contain',
                              display: 'inline-block',
                              verticalAlign: 'middle',
                            }}
                          />
                        </a>
                      )}
                      {config.scopus_id && (
                        <a
                          href={getSocialUrl(
                            config.scopus_id,
                            'https://www.scopus.com/authid/detail.uri?authorId='
                          )}
                          title="Scopus"
                          style={{ color: '#FF6C00' }}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <i className="ai ai-scopus"></i>
                        </a>
                      )}
                      {config.github_username && (
                        <a
                          href={getSocialUrl(config.github_username, 'https://github.com/')}
                          title="GitHub"
                          style={{ color: '#24292E' }}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <i className="fab fa-github"></i>
                        </a>
                      )}
                      {config.linkedin_username && (
                        <a
                          href={getSocialUrl(config.linkedin_username, 'https://www.linkedin.com/in/')}
                          title="LinkedIn"
                          style={{ color: '#0A66C2' }}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <i className="fab fa-linkedin"></i>
                        </a>
                      )}
                      {config.research_gate_profile && (
                        <a
                          href={getSocialUrl(
                            config.research_gate_profile,
                            'https://www.researchgate.net/profile/'
                          )}
                          title="ResearchGate"
                          style={{ color: '#00CCBB' }}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <i className="ai ai-researchgate"></i>
                        </a>
                      )}
                      {config.semantic_scholar_id && (
                        <a
                          href={getSocialUrl(
                            config.semantic_scholar_id,
                            'https://www.semanticscholar.org/author/'
                          )}
                          title="Semantic Scholar"
                          style={{ color: '#185ADB' }}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <i className="ai ai-semantic-scholar"></i>
                        </a>
                      )}
                      {config.kaggle_id && (
                        <a
                          href={getSocialUrl(config.kaggle_id, 'https://kaggle.com/')}
                          title="Kaggle"
                          style={{ color: '#20BEFF' }}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <i className="fab fa-kaggle"></i>
                        </a>
                      )}
                      {config.discord_id && (
                        <a
                          href={getSocialUrl(config.discord_id, 'https://discord.com/users/')}
                          title="Discord"
                          style={{ color: '#5865F2' }}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <i className="fab fa-discord"></i>
                        </a>
                      )}
                      {config.rss_icon && (
                        <a
                          href={config.rss_url ? String(config.rss_url).trim() : '/feed.xml'}
                          title="RSS"
                          style={{ color: '#FFA500' }}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <i className="fas fa-rss"></i>
                        </a>
                      )}
                      {config.custom_social && config.custom_social.url && (
                        <a
                          href={config.custom_social.url}
                          title={config.custom_social.title || 'Social'}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {config.custom_social.logo ? (
                            <img
                              src={config.custom_social.logo}
                              alt={config.custom_social.title || 'Social'}
                              style={{ width: '1.15em', height: '1.15em', objectFit: 'contain' }}
                            />
                          ) : (
                            <i className="fas fa-globe"></i>
                          )}
                        </a>
                      )}
                    </>
                  );
                })()}
              </div>
              <div className="contact-note">{config.contact_note}</div>
            </div>
          )}
        </article>
      </div>
    </div>
  );
}
