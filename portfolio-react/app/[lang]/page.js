import { getConfig, getPageContent, getNews } from '../../lib/config';
import { remark } from 'remark';
import html from 'remark-html';

export const dynamic = 'force-dynamic';

export default async function Home({ params }) {
  const resolvedParams = await params;
  const lang = resolvedParams.lang || 'en';
  const config = getConfig(lang);
  const { data: fm, content } = getPageContent('about.md', lang);
  const newsItems = getNews(lang);
  const st = lang === 'vi' ? (config.section_titles || {}) : (config.section_titles_en || {});

  // Convert markdown content to HTML
  const processedContent = await remark().use(html, { sanitize: false }).process(content);
  const contentHtml = processedContent.toString();

  // Process news content
  const processedNews = await Promise.all(newsItems.map(async (item) => {
    let htmlContent = "";
    if (item.content) {
      const p = await remark().use(html, { sanitize: false }).process(item.content);
      htmlContent = p.toString();
    }
    
    // Format date: "Jun 13, 2026"
    let dateParts = [];
    let dateStr = "";
    if (item.date) {
      const d = new Date(item.date);
      if (!isNaN(d.getTime())) {
        if (lang === 'vi') {
          const monthsVi = ["Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"];
          dateParts = [monthsVi[d.getMonth()], d.getDate().toString() + ",", d.getFullYear().toString()];
          dateStr = dateParts.join(' ');
        } else {
          const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
          dateParts = [months[d.getMonth()], d.getDate().toString() + ",", d.getFullYear().toString()];
          dateStr = dateParts.join(' ');
        }
      } else {
        dateStr = item.date;
        dateParts = item.date.split(' ');
      }
    }
    
    return {
      ...item,
      htmlContent,
      dateStr,
      dateParts
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
          <div className="clearfix" dangerouslySetInnerHTML={{ __html: contentHtml }}></div>

          {/* News Section */}
          {processedNews.length > 0 && (fm.news || fm.announcements?.enabled !== false) && (
            <div className="news mt-5">
              <h2 style={{ marginBottom: '1.5rem', color: config.section_titles_color || 'inherit' }}>{st.about_news || (lang === 'vi' ? 'Tin tức' : 'News')}</h2>
              <div className="table-responsive">
                <table className="table table-sm table-borderless">
                  <tbody>
                    {processedNews.map((item, index) => (
                      <tr key={index}>
                        <th scope="row" style={{ width: '15%', fontWeight: '600', paddingRight: '1rem' }}>
                          {item.dateParts && item.dateParts.length === 3 ? (
                            <>
                              {item.dateParts[0]} {item.dateParts[1]}<br/>
                              {item.dateParts[2]}
                            </>
                          ) : (
                            item.dateStr
                          )}
                        </th>
                        <td>
                          {item.frontMatter.inline ? (
                            <div dangerouslySetInnerHTML={{ __html: item.htmlContent }} />
                          ) : (
                            <a href={`/news/${item.slug}`} className="news-title">{item.frontMatter.title || item.slug}</a>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
                    const strId = String(id);
                    if (strId.startsWith('http://') || strId.startsWith('https://')) return strId;
                    return `${baseUrl}${strId}`;
                  };
                  return (
                    <>
                      {config.email && <a href={String(config.email).startsWith('mailto:') ? String(config.email) : `mailto:${config.email}`} title="email"><i className="fas fa-envelope"></i></a>}
                      {config.orcid_id && <a href={getSocialUrl(config.orcid_id, 'https://orcid.org/')} title="ORCID"><i className="ai ai-orcid"></i></a>}
                      {config.scholar_userid && <a href={getSocialUrl(config.scholar_userid, 'https://scholar.google.com/citations?user=')} title="Google Scholar"><i className="ai ai-google-scholar"></i></a>}
                      {config.scopus_id && <a href={getSocialUrl(config.scopus_id, 'https://www.scopus.com/authid/detail.uri?authorId=')} title="Scopus"><i className="ai ai-scopus"></i></a>}
                      {config.github_username && <a href={getSocialUrl(config.github_username, 'https://github.com/')} title="GitHub"><i className="fab fa-github"></i></a>}
                      {config.linkedin_username && <a href={getSocialUrl(config.linkedin_username, 'https://www.linkedin.com/in/')} title="LinkedIn"><i className="fab fa-linkedin"></i></a>}
                      {config.research_gate_profile && <a href={getSocialUrl(config.research_gate_profile, 'https://www.researchgate.net/profile/')} title="ResearchGate"><i className="ai ai-researchgate"></i></a>}
                      {config.semantic_scholar_id && <a href={getSocialUrl(config.semantic_scholar_id, 'https://www.semanticscholar.org/author/')} title="Semantic Scholar"><i className="ai ai-semantic-scholar"></i></a>}
                      {config.kaggle_id && <a href={getSocialUrl(config.kaggle_id, 'https://kaggle.com/')} title="Kaggle"><i className="fab fa-kaggle"></i></a>}
                      {config.discord_id && <a href={getSocialUrl(config.discord_id, 'https://discord.com/users/')} title="Discord"><i className="fab fa-discord"></i></a>}
                      {config.rss_icon && <a href="/feed.xml" title="RSS"><i className="fas fa-rss"></i></a>}
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
