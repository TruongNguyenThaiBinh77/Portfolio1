export const dynamic = 'force-dynamic';
import { getPageContent, getRepositories } from '../../../lib/config';

export default async function Repositories({ params }) {
  const resolvedParams = await params;
  const lang = resolvedParams.lang || 'vi';
  const { data: fm, content } = getPageContent('repositories.md', lang);
  const repoData = getRepositories() || {};

  const githubUsers = repoData.github_users || [];
  const githubRepos = repoData.github_repos || [];

  return (
    <div className="container mt-5" role="main">
      <div className="post">
        <header className="post-header">
          <h1 className="post-title">{fm.title || "Repositories"}</h1>
          {fm.description && <p className="post-description">{fm.description}</p>}
        </header>

        <article>
          <div dangerouslySetInnerHTML={{ __html: content }} className="mb-4" />

          {githubUsers.length > 0 && (
            <>
              <h2 className="mb-4">{lang === 'vi' ? 'Tài khoản GitHub' : 'GitHub Users'}</h2>
              <div className="repositories d-flex flex-wrap flex-md-row flex-column justify-content-between align-items-center">
                {githubUsers.map((user, idx) => (
                  <div key={idx} className="repo-card p-3 mb-4" style={{ width: '100%', maxWidth: '48%', minWidth: '300px' }}>
                    <a href={`https://github.com/${user}`}>
                      <img 
                        src={`https://github-readme-stats.vercel.app/api/?username=${user}&theme=default&show_icons=true`} 
                        alt={`${user} GitHub Stats`} 
                        style={{ width: '100%', borderRadius: '10px' }} 
                      />
                    </a>
                  </div>
                ))}
              </div>
              <hr />
            </>
          )}

          {githubUsers.length > 0 && (
            <>
              <div className="repositories d-flex flex-wrap flex-md-row flex-column justify-content-between align-items-center">
                {githubUsers.map((user, idx) => (
                  <div key={`trophy-${idx}`} className="repo-card p-3 mb-4" style={{ width: '100%' }}>
                    {githubUsers.length > 1 && <h4>{user}</h4>}
                    <a href={`https://github.com/${user}`}>
                      <img 
                        src={`https://github-profile-trophy.vercel.app/?username=${user}&theme=flat&no-frame=true&no-bg=true&margin-w=15`} 
                        alt={`${user} GitHub Trophies`} 
                        style={{ maxWidth: '100%' }} 
                      />
                    </a>
                  </div>
                ))}
              </div>
              <hr />
            </>
          )}

          {githubRepos.length > 0 && (
            <>
              <h2 className="mb-4">{lang === 'vi' ? 'Kho lưu trữ GitHub' : 'GitHub Repositories'}</h2>
              <div className="repositories d-flex flex-wrap flex-md-row flex-column justify-content-between align-items-center">
                {githubRepos.map((repo, idx) => {
                  const parts = repo.split('/');
                  const username = parts[0];
                  const reponame = parts[1];
                  return (
                    <div key={idx} className="repo-card p-3 mb-4" style={{ width: '100%', maxWidth: '48%', minWidth: '300px' }}>
                      <a href={`https://github.com/${repo}`}>
                        <img 
                          src={`https://github-readme-stats.vercel.app/api/pin/?username=${username}&repo=${reponame}&theme=default&show_icons=true`} 
                          alt={`${repo} Repository`} 
                          style={{ width: '100%', borderRadius: '10px' }} 
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
