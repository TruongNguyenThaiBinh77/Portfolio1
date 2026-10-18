export const dynamic = 'force-dynamic';
import { getPageContent, getRepositories } from '../../../lib/config';

export default async function Repositories({ params }) {
  const resolvedParams = await params;
  const lang = resolvedParams.lang || 'vi';
  const { data: fm, content } = getPageContent('repositories.md', lang);
  const repoData = getRepositories() || {};

  const githubUsers = repoData.github_users || [];
  const githubRepos = repoData.github_repos || [];
  const hiddenRepos = new Set(repoData.hidden_repos || []);
  const visibleRepos = githubRepos.filter((repo) => {
    const repoName = typeof repo === 'string' ? repo : (repo?.name || '');
    return !hiddenRepos.has(repoName) && !repo?.hidden;
  });

  // Filter out any legacy Liquid template or heading artifacts from Jekyll
  const cleanContent = content
    ? content
        .replace(/\{%[\s\S]*?%\}/g, '')
        .replace(/\{\{[\s\S]*?\}\}/g, '')
        .replace(/##\s*GitHub\s*users/gi, '')
        .replace(/##\s*GitHub\s*Repositories/gi, '')
        .replace(/---/g, '')
        .trim()
    : '';

  // Title styling options from config
  const pageTitle = (lang === 'en' ? repoData.page_title_en : repoData.page_title) 
    || fm.title 
    || (lang === 'vi' ? 'Lưu trữ' : 'Repositories');
  const pageTitleBold = repoData.page_title_bold !== false;
  const pageTitleColor = repoData.page_title_color || '';

  const overviewTitle = (lang === 'en' ? repoData.overview_title_en : repoData.overview_title) 
    || (lang === 'vi' ? 'Tổng quan GitHub' : 'GitHub Overview');
  const overviewTitleBold = repoData.overview_title_bold !== false;
  const overviewTitleColor = repoData.overview_title_color || '';

  const reposTitle = (lang === 'en' ? repoData.repos_title_en : repoData.repos_title) 
    || (lang === 'vi' ? 'Kho lưu trữ nổi bật' : 'Featured Repositories');
  const reposTitleBold = repoData.repos_title_bold !== false;
  const reposTitleColor = repoData.repos_title_color || '';

  const statsTheme = repoData.stats_theme || 'light';
  const totalReposCount = repoData.total_repos_count || visibleRepos.length || 21;

  // Colors for light/custom cards (defaults match site palette)
  const cardBgColor = (repoData.card_bg_color || '#ffffff').replace('#', '');
  const cardBorderColor = (repoData.card_border_color || '#e2e8f0').replace('#', '');
  const cardTitleColor = (repoData.card_title_color || repoData.repos_title_color || '#15803d').replace('#', '');
  const cardTextColor = (repoData.card_text_color || '#334155').replace('#', '');

  const getStatsUrl = (user) => {
    if (statsTheme === 'radical') {
      return `https://github-readme-stats.vercel.app/api/?username=${user}&show_icons=true&theme=radical`;
    }
    if (statsTheme === 'tokyonight' || statsTheme === 'dracula' || statsTheme === 'dark') {
      return `https://github-readme-stats.vercel.app/api/?username=${user}&show_icons=true&theme=${statsTheme}`;
    }
    return `https://github-readme-stats.vercel.app/api/?username=${user}&show_icons=true&bg_color=${cardBgColor}&border_color=${cardBorderColor}&title_color=${cardTitleColor}&icon_color=${cardTitleColor}&text_color=${cardTextColor}`;
  };

  const getTopLangsUrl = (user) => {
    if (statsTheme === 'radical') {
      return `https://github-readme-stats.vercel.app/api/top-langs/?username=${user}&layout=compact&theme=radical`;
    }
    if (statsTheme === 'tokyonight' || statsTheme === 'dracula' || statsTheme === 'dark') {
      return `https://github-readme-stats.vercel.app/api/top-langs/?username=${user}&layout=compact&theme=${statsTheme}`;
    }
    return `https://github-readme-stats.vercel.app/api/top-langs/?username=${user}&layout=compact&bg_color=${cardBgColor}&border_color=${cardBorderColor}&title_color=${cardTitleColor}&text_color=${cardTextColor}`;
  };

  const getStreakUrl = (user) => {
    if (statsTheme === 'radical') {
      return `https://github-readme-streak-stats.herokuapp.com/?user=${user}&theme=radical`;
    }
    if (statsTheme === 'tokyonight' || statsTheme === 'dracula' || statsTheme === 'dark') {
      return `https://github-readme-streak-stats.herokuapp.com/?user=${user}&theme=${statsTheme}`;
    }
    return `https://github-readme-streak-stats.herokuapp.com/?user=${user}&background=${cardBgColor}&border=${cardBorderColor}&stroke=${cardBorderColor}&ring=${cardTitleColor}&fire=${cardTitleColor}&currStreakNum=${cardTitleColor}&sideNums=${cardTextColor}&currStreakLabel=${cardTitleColor}&sideLabels=64748b&dates=64748b`;
  };

  const getPinUrl = (username, reponame) => {
    if (statsTheme === 'radical') {
      return `https://github-readme-stats.vercel.app/api/pin/?username=${username}&repo=${reponame}&show_icons=true&theme=radical`;
    }
    if (statsTheme === 'tokyonight' || statsTheme === 'dracula' || statsTheme === 'dark') {
      return `https://github-readme-stats.vercel.app/api/pin/?username=${username}&repo=${reponame}&show_icons=true&theme=${statsTheme}`;
    }
    return `https://github-readme-stats.vercel.app/api/pin/?username=${username}&repo=${reponame}&show_icons=true&bg_color=${cardBgColor}&border_color=${cardBorderColor}&title_color=${cardTitleColor}&text_color=${cardTextColor}&icon_color=${cardTitleColor}`;
  };

  return (
    <div className="container mt-5" role="main">
      <div className="post">
        <header className="post-header mb-4 text-center">
          <h1
            className="title-nexa-rust star-title post-title"
            style={{
              fontSize: 'clamp(30px, 4.2vw, 50px)',
              lineHeight: '1.25',
              marginBottom: '16px',
            }}
          >
            <span className="star-icon">★</span>
            <span>{pageTitle}</span>
            <span className="star-icon">★</span>
          </h1>
          {fm.description && (
            <p className="post-description text-muted text-center" style={{ fontSize: '1.05rem' }}>
              {fm.description}
            </p>
          )}
          <div style={{ width: '60px', height: '4px', backgroundColor: '#6f3706', margin: '16px auto', borderRadius: '2px' }}></div>
        </header>

        <article>
          {cleanContent && (
            <div dangerouslySetInnerHTML={{ __html: cleanContent }} className="mb-4" />
          )}

          {githubUsers.length > 0 && (
            <>
              <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                <h2
                  className="title-nexa-rust h4 mb-0"
                  style={{
                    color: '#6f3706',
                    letterSpacing: '1px',
                    textTransform: 'uppercase',
                  }}
                >
                  <i className="fab fa-github mr-2"></i>
                  {overviewTitle}
                </h2>
                {githubUsers[0] && (
                  <a
                    href={`https://github.com/${githubUsers[0]}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-sm btn-outline-secondary text-truncate"
                    style={{ borderRadius: '20px', fontSize: '0.85rem', maxWidth: '100%' }}
                  >
                    <i className="fab fa-github mr-1"></i>
                    github.com/{githubUsers[0]} <i className="fas fa-external-link-alt ml-1" style={{ fontSize: '10px' }}></i>
                  </a>
                )}
              </div>

              <div className="d-flex flex-wrap justify-content-center align-items-center mb-4" style={{ gap: '1.25rem' }}>
                {githubUsers.map((user, idx) => (
                  <div key={idx} style={{ flex: '1 1 300px', width: '100%', maxWidth: '480px', minWidth: 0, textAlign: 'center' }}>
                    <a
                      href={`https://github.com/${user}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="d-block"
                    >
                      <img
                        src={getStatsUrl(user)}
                        alt={`${user} GitHub Stats`}
                        style={{
                          width: '100%',
                          borderRadius: '12px',
                          boxShadow: '0 4px 14px rgba(0, 0, 0, 0.05)',
                          border: '1px solid rgba(0, 0, 0, 0.06)',
                          transition: 'transform 0.22s ease, box-shadow 0.22s ease'
                        }}
                        className="hover-card"
                      />
                    </a>
                  </div>
                ))}

                {githubUsers.map((user, idx) => (
                  <div key={`langs-${idx}`} style={{ flex: '1 1 300px', width: '100%', maxWidth: '480px', minWidth: 0, textAlign: 'center' }}>
                    <a
                      href={`https://github.com/${user}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="d-block"
                    >
                      <img
                        src={getTopLangsUrl(user)}
                        alt={`${user} Top Languages`}
                        style={{
                          width: '100%',
                          borderRadius: '12px',
                          boxShadow: '0 4px 14px rgba(0, 0, 0, 0.05)',
                          border: '1px solid rgba(0, 0, 0, 0.06)',
                          transition: 'transform 0.22s ease, box-shadow 0.22s ease'
                        }}
                        className="hover-card"
                      />
                    </a>
                  </div>
                ))}

                {githubUsers.map((user, idx) => (
                  <div key={`streak-${idx}`} style={{ width: '100%', maxWidth: '480px', minWidth: 0, textAlign: 'center' }}>
                    <a
                      href={`https://github.com/${user}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="d-block"
                    >
                      <img
                        src={getStreakUrl(user)}
                        alt={`${user} Streak Stats`}
                        style={{
                          width: '100%',
                          borderRadius: '12px',
                          boxShadow: '0 4px 14px rgba(0, 0, 0, 0.05)',
                          border: '1px solid rgba(0, 0, 0, 0.06)',
                          transition: 'transform 0.22s ease, box-shadow 0.22s ease'
                        }}
                        className="hover-card"
                      />
                    </a>
                  </div>
                ))}
              </div>
              <hr className="my-4" />
            </>
          )}

          {visibleRepos.length > 0 && (
            <>
              <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                <h2
                  className="title-nexa-rust h4 mb-0"
                  style={{
                    color: '#6f3706',
                    letterSpacing: '1px',
                    textTransform: 'uppercase',
                  }}
                >
                  <i className="fas fa-code-branch mr-2"></i>
                  {reposTitle}
                </h2>
                <span className="badge badge-light text-muted border px-2 py-1" style={{ fontSize: '0.85rem' }}>
                  {totalReposCount} repositories
                </span>
              </div>

              <div className="row">
                {visibleRepos.map((repoItem, idx) => {
                  const repo = typeof repoItem === 'string' ? repoItem : repoItem.name;
                  const parts = repo.split('/');
                  const username = parts[0];
                  const reponame = parts[1];
                  return (
                    <div key={idx} className="col-12 col-md-6 mb-4">
                      <a
                        href={`https://github.com/${repo}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="d-block h-100"
                        style={{ textDecoration: 'none' }}
                      >
                        <img
                          src={getPinUrl(username, reponame)}
                          alt={`${repo} Repository`}
                          style={{
                            width: '100%',
                            borderRadius: '12px',
                            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.05)',
                            border: '1px solid rgba(0, 0, 0, 0.06)',
                            transition: 'transform 0.22s ease, box-shadow 0.22s ease'
                          }}
                          className="hover-card"
                        />
                      </a>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </article>
      </div>
    </div>
  );
}
