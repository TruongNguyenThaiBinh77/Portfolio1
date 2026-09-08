export const dynamic = 'force-dynamic';
import { getPageContent, getPublications } from '../../../lib/config';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';

export default async function Publications({ params }) {
  const resolvedParams = await params;
  const lang = resolvedParams.lang || 'vi';
  const { data: fm, content } = getPageContent('publications.md', lang);
  const publications = getPublications(lang);

  // Group by year
  const pubsByYear = {};
  publications.forEach(pub => {
    const year = pub.entryTags?.YEAR || pub.entryTags?.year || 'Unknown';
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
  const pageTitle = fm.title ? fm.title.charAt(0).toUpperCase() + fm.title.slice(1) : "Publications";

  return (
    <div className="container mt-5" role="main">
      <div className="post">
        <header className="post-header">
          <h1 className="post-title">{pageTitle}</h1>
          <p className="post-description">{fm.description}</p>
        </header>
        <article>
          {cleanContent && <ReactMarkdown>{cleanContent}</ReactMarkdown>}

          <div className="publications mt-5">
            {sortedYears.length > 0 ? (
              sortedYears.map(year => (
                <div key={year} className="d-flex mb-5" style={{ position: 'relative' }}>
                  <div className="flex-grow-1" style={{ paddingRight: '120px' }}>
                    <ol className="bibliography" style={{ listStyleType: 'none', paddingLeft: 0, margin: 0 }}>
                      {pubsByYear[year].map((pub, index) => {
                        const tags = pub.entryTags;
                        const title = tags.TITLE || tags.title;
                        const authorStr = tags.AUTHOR || tags.author || '';
                        const journal = tags.JOURNAL || tags.journal || tags.BOOKTITLE || tags.booktitle;
                        const url = tags.URL || tags.url;
                        const preview = tags.PREVIEW || tags.preview;
                        const badgeName = tags.BADGE_NAME || tags.badge_name;
                        const badgeColor = tags.BADGE_COLOR || tags.badge_color || '#1e3a8a';
                        const badgeTextColor = tags.BADGE_TEXT_COLOR || tags.badge_text_color || '#ffffff';

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
                        
                        // Construct the owner's full name from config
                        const config = require('../../../lib/config').getConfig(lang);
                        const ownerName = [config.first_name, config.middle_name, config.last_name].filter(Boolean).join(' ');
                        const reversedOwnerName = [config.last_name, config.middle_name, config.first_name].filter(Boolean).join(' ');
                        const ownerRegex = new RegExp(`(${ownerName}|${reversedOwnerName}|Einstein, Albert|Albert Einstein)`, 'gi');
                        
                        // Wrap owner's name with theme color (using markdown/HTML if not already manually styled)
                        if (!finalAuthorContent.includes('<span')) {
                            finalAuthorContent = finalAuthorContent.replace(ownerRegex, '<span style="color: var(--global-theme-color)">$1</span>');
                        }

                        return (
                          <li key={index} className="mb-4 d-flex" style={{ backgroundColor: 'transparent', gap: '1.5rem', alignItems: 'flex-start' }}>
                            {/* Left Sidebar for Preview and Badge */}
                            {(preview || badgeName) ? (
                              <div className="pub-sidebar" style={{ width: '120px', flexShrink: 0, display: 'flex', flexDirection: 'column', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--global-divider-color)', backgroundColor: 'var(--global-bg-color)', minHeight: '120px' }}>
                                {preview ? (
                                  <div style={{ width: '100%', flexGrow: 1, backgroundImage: `url(/assets/img/${preview})`, backgroundSize: 'cover', backgroundPosition: 'center', minHeight: '80px' }} />
                                ) : (
                                  <div style={{ width: '100%', flexGrow: 1, backgroundColor: 'var(--global-bg-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
                                    <i className="fas fa-image fa-2x"></i>
                                  </div>
                                )}
                                <div style={{ backgroundColor: badgeColor, color: badgeTextColor, fontSize: '0.75rem', padding: '6px 4px', textAlign: 'center', fontWeight: 'bold', textTransform: 'uppercase', minHeight: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  {badgeName || 'PUBLICATION'}
                                </div>
                              </div>
                            ) : (
                              <div className="pub-sidebar-empty" style={{ width: '120px', flexShrink: 0 }}></div>
                            )}

                            {/* Right Content */}
                            <div className="pub-content" style={{ flexGrow: 1 }}>
                              <div className="title" style={{ fontWeight: '600', fontSize: '1rem', color: 'var(--global-text-color)' }}>{title}</div>
                              <div className="author author-markdown" style={{ color: 'var(--global-text-color-light)', marginTop: '0.2rem', fontSize: '0.95rem' }}>
                                <ReactMarkdown 
                                  rehypePlugins={[rehypeRaw]}
                                  components={{ p: 'span' }}
                                >
                                  {finalAuthorContent}
                                </ReactMarkdown>
                              </div>
                              <div className="periodical" style={{ fontStyle: 'italic', color: 'var(--global-text-color-light)', marginTop: '0.2rem', fontSize: '0.95rem' }}>
                                {journal} {tags.VOLUME || tags.volume ? `vol. ${tags.VOLUME || tags.volume}` : ''}{journal ? ', ' : ''}{year}
                              </div>
                              {url && (
                                <div className="links mt-2">
                                  <a href={url} className="btn btn-sm z-depth-0" role="button" target="_blank" rel="noopener noreferrer" style={{ border: '1px solid var(--global-theme-color)', color: 'var(--global-theme-color)', padding: '2px 8px', fontSize: '0.8rem' }}>
                                    URL
                                  </a>
                                </div>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ol>
                  </div>
                  <div style={{ position: 'absolute', top: 0, right: 0, width: '100px', textAlign: 'right' }}>
                    <h2 className="year" style={{ color: 'var(--global-divider-color)', fontSize: '2.5rem', fontWeight: 300, margin: 0, lineHeight: 1.2, border: 'none', paddingTop: 0 }}>{year}</h2>
                  </div>
                </div>
              ))
            ) : (
              <p>No publications found.</p>
            )}
          </div>
        </article>
      </div>
    </div>
  );
}
