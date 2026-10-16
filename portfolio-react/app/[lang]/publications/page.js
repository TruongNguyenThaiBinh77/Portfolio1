export const dynamic = 'force-dynamic';
import { getPageContent, getAllArticles, getConfig } from '../../../lib/config';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';

export default async function Publications({ params }) {
  const resolvedParams = await params;
  const lang = resolvedParams.lang || 'vi';
  const config = getConfig(lang);
  const { data: fm, content } = getPageContent('publications.md', lang);
  
  // Lấy danh sách đầy đủ tất cả bài báo / ấn phẩm từ nguồn dữ liệu dùng chung (Full bài)
  const allArticles = getAllArticles(lang);

  // Group by year
  const pubsByYear = {};
  allArticles.forEach(pub => {
    const year = pub.year || '2026';
    if (!pubsByYear[year]) {
      pubsByYear[year] = [];
    }
    pubsByYear[year].push(pub);
  });

  // Sort years descending
  const sortedYears = Object.keys(pubsByYear).sort((a, b) => {
    if (a === 'Unknown') return 1;
    if (b === 'Unknown') return -1;
    return parseInt(b) - parseInt(a);
  });
  
  // Clean up markdown content: remove liquid tags and HTML comments
  const cleanContent = content
    .replace(/{%.*?%}/g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<div.*?>/g, '')
    .replace(/<\/div>/g, '')
    .trim();

  // Capitalize title
  const rawPageTitle = (lang === 'en' ? fm.title_en : fm.title) || (lang === 'vi' ? 'Ấn phẩm khoa học' : 'Publications');
  const pageTitle = rawPageTitle ? rawPageTitle.charAt(0).toUpperCase() + rawPageTitle.slice(1) : (lang === 'vi' ? 'Ấn phẩm khoa học' : 'Publications');
  const pageTitleBold = fm.page_title_bold !== false;
  const pageTitleColor = fm.page_title_color || config.section_titles_color || '#8c0303';

  const yearTitleBold = fm.year_title_bold !== false;
  const yearTitleColor = fm.year_title_color || '#64748b';

  const articleTitleBold = fm.article_title_bold !== false;
  const articleTitleColor = fm.article_title_color || '#1e293b';

  const ownerName = [config.first_name, config.middle_name, config.last_name].filter(Boolean).join(' ');
  const reversedOwnerName = [config.last_name, config.middle_name, config.first_name].filter(Boolean).join(' ');
  const ownerRegex = new RegExp(`(${ownerName}|${reversedOwnerName}|Trương Nguyễn Thái Bình|Truong Nguyen Thai Binh)`, 'gi');

  return (
    <div className="container mt-5" role="main" style={{ maxWidth: '980px', margin: '0 auto' }}>
      <div className="post">
        <header className="post-header mb-4">
          <h1
            className="post-title"
            style={{
              color: pageTitleColor,
              fontWeight: pageTitleBold ? '700' : '400',
            }}
          >
            <span style={{ color: pageTitleColor || 'inherit' }}>{pageTitle}</span>
          </h1>
          <p className="post-description mb-0" style={{ fontSize: '1.05rem', color: '#64748b' }}>
            {fm.description || (lang === 'vi' ? 'Danh sách đầy đủ các bài báo, nghiên cứu và ấn phẩm khoa học đã được công bố.' : 'Full list of published papers, research and scientific publications.')}
          </p>
        </header>

        <article>
          {cleanContent && <ReactMarkdown>{cleanContent}</ReactMarkdown>}

          <style>{`
            .pub-title-link,
            .pub-title-link:hover,
            .pub-card-item a,
            .pub-card-item a:hover {
              text-decoration: none !important;
            }
            .pub-title-link:hover {
              color: var(--global-hover-color, #8c0303) !important;
            }
            .pub-card-item {
              transition: transform 0.2s ease, border-color 0.2s ease, background-color 0.2s ease;
            }
            .pub-card-item:hover {
              border-color: #cbd5e1 !important;
              background-color: rgba(255, 255, 255, 0.4) !important;
              transform: translateY(-1px);
            }
          `}</style>

          <div className="publications mt-3">
            {sortedYears.length > 0 ? (
              sortedYears.map((year, yearIndex) => (
                <div key={year} className="mb-5">
                  {/* Đường line xám với số năm ở cuối đường line */}
                  <div
                    className="year-divider d-flex align-items-center w-100"
                    style={{
                      marginTop: yearIndex === 0 ? '1.25rem' : '3.5rem',
                      marginBottom: '1.5rem',
                      gap: '16px',
                    }}
                  >
                    <div
                      style={{
                        flexGrow: 1,
                        height: '1.5px',
                        backgroundColor: '#cbd5e1',
                        borderRadius: '2px',
                      }}
                    />
                    <span
                      style={{
                        fontSize: '1.45rem',
                        fontWeight: yearTitleBold ? '700' : '400',
                        color: yearTitleColor,
                        lineHeight: 1,
                        letterSpacing: '0.5px',
                        userSelect: 'none',
                      }}
                    >
                      {year}
                    </span>
                  </div>

                  <div className="w-100 pub-list-container">
                    <ol className="bibliography" style={{ listStyleType: 'none', paddingLeft: 0, margin: 0 }}>
                      {pubsByYear[year].map((pub, index) => {
                        const title = pub.title;
                        const authorStr = pub.author || '';
                        const journal = pub.journal;
                        const volume = pub.volume;
                        const pages = pub.pages;
                        const url = pub.url;
                        const pdfUrl = pub.pdf;
                        const preview = pub.preview;
                        const abstractText = pub.abstract;
                        const badgeName = pub.badge_name;
                        const badgeColor = pub.badge_color || '#1e3a8a';
                        const badgeTextColor = pub.badge_text_color || '#ffffff';

                        let finalAuthorContent = authorStr;
                        if (authorStr.includes(' and ')) {
                          const authorsList = authorStr.split(' and ').map(a => {
                             if (a.includes(',')) {
                               const parts = a.split(',').map(p => p.trim());
                               return `${parts[1]} ${parts[0]}`;
                             }
                             return a.trim();
                          });
                          finalAuthorContent = authorsList.join(', ').replace(/, ([^,]*)$/, ', and $1');
                        }
                        
                        // Highlight owner name
                        if (!finalAuthorContent.includes('<span')) {
                          finalAuthorContent = finalAuthorContent.replace(ownerRegex, `<span style="color: ${config.section_titles_color || '#8c0303'}; font-weight: 600;">$1</span>`);
                        }

                        return (
                          <li
                            key={pub.id || index}
                            className="pub-card-item mb-3 d-flex flex-column flex-md-row w-100"
                            style={{
                              backgroundColor: 'transparent',
                              gap: '0.85rem',
                              alignItems: 'flex-start',
                              padding: '12px 14px',
                              borderRadius: '8px',
                              border: '1px solid #e2e8f0',
                              boxShadow: 'none',
                            }}
                          >
                            {/* Left Sidebar for Preview Cover & Badge */}
                            {(preview || badgeName) ? (
                              <div
                                className="pub-sidebar w-100"
                                style={{
                                  maxWidth: '85px',
                                  flexShrink: 0,
                                  display: 'flex',
                                  flexDirection: 'column',
                                  borderRadius: '4px',
                                  overflow: 'hidden',
                                  border: '1px solid #cbd5e1',
                                  backgroundColor: '#f8fafc',
                                  minHeight: '95px',
                                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                                }}
                              >
                                {preview ? (
                                  <div
                                    style={{
                                      width: '100%',
                                      flexGrow: 1,
                                      backgroundImage: `url(/assets/img/${preview})`,
                                      backgroundSize: 'cover',
                                      backgroundPosition: 'center',
                                      minHeight: '70px',
                                    }}
                                  />
                                ) : (
                                  <div style={{ width: '100%', flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
                                    <i className="fas fa-book-open fa-lg"></i>
                                  </div>
                                )}
                                <div
                                  style={{
                                    backgroundColor: badgeColor,
                                    color: badgeTextColor,
                                    fontSize: '0.65rem',
                                    padding: '3px 2px',
                                    textAlign: 'center',
                                    fontWeight: 'bold',
                                    textTransform: 'uppercase',
                                    minHeight: '20px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}
                                >
                                  {badgeName || (lang === 'vi' ? 'TẠP CHÍ' : 'JOURNAL')}
                                </div>
                              </div>
                            ) : null}

                            {/* Right Content */}
                            <div className="pub-content" style={{ flexGrow: 1, minWidth: 0 }}>
                              <h3 style={{ fontSize: '0.98rem', fontWeight: articleTitleBold ? '700' : '400', lineHeight: '1.38', margin: '0 0 3px 0' }}>
                                {url ? (
                                  <a
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="pub-title-link"
                                    style={{
                                      color: articleTitleColor,
                                      textDecoration: 'none',
                                      display: 'inline-flex',
                                      alignItems: 'baseline',
                                      gap: '5px',
                                    }}
                                  >
                                    <span style={{ color: articleTitleColor || 'inherit' }}>{title}</span>
                                    <i className="fa-solid fa-arrow-up-right-from-square" style={{ fontSize: '0.7rem', opacity: 0.65 }}></i>
                                  </a>
                                ) : (
                                  <span style={{ color: articleTitleColor || 'inherit' }}>{title}</span>
                                )}
                              </h3>

                              <div className="author author-markdown" style={{ color: '#475569', marginTop: '0.1rem', fontSize: '0.82rem' }}>
                                <i className="fa-solid fa-user-pen me-1" style={{ opacity: 0.7 }}></i>
                                <ReactMarkdown 
                                  rehypePlugins={[rehypeRaw]}
                                  components={{ p: 'span' }}
                                >
                                  {finalAuthorContent}
                                </ReactMarkdown>
                              </div>

                              <div className="periodical d-flex flex-wrap align-items-center gap-2" style={{ marginTop: '0.25rem', fontSize: '0.8rem' }}>
                                <span
                                  style={{
                                    backgroundColor: pub.journal_bg_color || '#fee2e2',
                                    color: pub.journal_color || '#991b1b',
                                    border: `1px solid ${pub.journal_border_color || '#fca5a5'}`,
                                    fontSize: '0.7rem',
                                    fontWeight: '600',
                                    padding: '1px 7px',
                                    borderRadius: '8px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
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
                                  {journal}
                                </span>
                                <span style={{ color: '#64748b' }}>
                                  {volume ? `Số ${volume}` : ''}
                                  {pages ? `${volume ? ', ' : ''}Tr. ${pages}` : ''}
                                  {year ? ` (${year})` : ''}
                                </span>
                              </div>

                              {abstractText && (
                                <p
                                  style={{
                                    fontSize: '0.82rem',
                                    lineHeight: '1.6',
                                    color: '#475569',
                                    marginTop: '6px',
                                    marginBottom: '6px',
                                    backgroundColor: 'transparent',
                                    padding: '4px 10px',
                                    borderRadius: '4px',
                                    borderLeft: `2.5px solid ${config.section_titles_color || '#8c0303'}`,
                                    textAlign: 'justify',
                                  }}
                                >
                                  <strong style={{ color: config.section_titles_color || '#8c0303' }}>
                                    {lang === 'vi' ? 'Tóm tắt: ' : 'Abstract: '}
                                  </strong>
                                  {abstractText}
                                </p>
                              )}

                              {/* Metric Badges (IF, Q1, FWCI, ISSN...) */}
                              {(() => {
                                const badges = pub.metric_badges;
                                if (!badges || !Array.isArray(badges) || badges.length === 0) return null;
                                return (
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', alignItems: 'center', marginTop: '6px', marginBottom: '4px' }}>
                                    {badges.map((b, bIdx) => {
                                      let text = '';
                                      if (typeof b === 'string') {
                                        text = b;
                                      } else if (b && typeof b === 'object') {
                                        const lbl = b.label || b.name || '';
                                        const val = b.value !== undefined ? b.value : '';
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
                                            padding: '1.5px 6px',
                                            backgroundColor: '#f1f5f9',
                                            color: '#0f172a',
                                            border: '1px solid #cbd5e1',
                                            borderRadius: '4px',
                                            fontSize: '0.72rem',
                                            fontWeight: '600',
                                            lineHeight: '1.2',
                                            boxShadow: 'none',
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

                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
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
                                {url && (
                                  <a
                                    href={url}
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
                          </li>
                        );
                      })}
                    </ol>
                  </div>
                </div>
              ))
            ) : (
              <p>{lang === 'vi' ? 'Chưa có ấn phẩm nào.' : 'No publications found.'}</p>
            )}
          </div>
        </article>
      </div>
    </div>
  );
}
