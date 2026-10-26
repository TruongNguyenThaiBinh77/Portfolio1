export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const user = searchParams.get('username') || searchParams.get('user') || 'TruongNguyenThaiBinh77';
    
    // Forward all params to github-readme-stats
    const upstreamParams = new URLSearchParams(searchParams);
    if (!upstreamParams.has('username')) {
      upstreamParams.set('username', user);
    }
    upstreamParams.delete('user');
    
    // Ensure essential params (do not force include_all_commits as it frequently causes upstream rate-limit errors)
    if (!upstreamParams.has('show_icons')) upstreamParams.set('show_icons', 'true');
    if (!upstreamParams.has('show')) upstreamParams.set('show', 'reviews,prs_merged_percentage');
    if (!upstreamParams.has('rank_icon')) upstreamParams.set('rank_icon', 'github');

    let upstreamUrl = `https://github-readme-stats.vercel.app/api/?${upstreamParams.toString()}`;

    let res = await fetch(upstreamUrl, {
      next: { revalidate: 1800 },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!res.ok) {
      return new Response(`Error fetching upstream stats: ${res.statusText}`, { 
        status: res.status,
        headers: { 'Cache-Control': 'no-store, max-age=0' }
      });
    }

    let svg = await res.text();

    // Check if upstream returned an error inside the SVG (e.g. rate limit on commits)
    const isErrorSvg = svg.includes('Something went wrong!') || svg.includes('Could not fetch total commits');

    if (isErrorSvg && upstreamParams.has('include_all_commits')) {
      // Automatic fallback: remove include_all_commits and retry immediately
      upstreamParams.delete('include_all_commits');
      upstreamUrl = `https://github-readme-stats.vercel.app/api/?${upstreamParams.toString()}`;
      try {
        const retryRes = await fetch(upstreamUrl, {
          next: { revalidate: 1800 },
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        if (retryRes.ok) {
          const retrySvg = await retryRes.text();
          if (!retrySvg.includes('Something went wrong!')) {
            svg = retrySvg;
          }
        }
      } catch (retryErr) {
        console.warn('Fallback fetch without include_all_commits failed:', retryErr);
      }
    }

    const stillHasError = svg.includes('Something went wrong!') || svg.includes('Could not fetch');

    // 1. Detect rank level (e.g. B+, A, S, etc.)
    const titleMatch = svg.match(/Rank:\s*([A-Za-z0-9+]+)/);
    const rank = titleMatch ? titleMatch[1] : 'B+';

    // 2. Detect title/rank accent color
    let rankColor = '#e07a5f';
    const fillMatch = svg.match(/\.header\s*\{[^}]*fill:\s*([^;]+);/i);
    if (fillMatch && fillMatch[1]) {
      rankColor = fillMatch[1].trim();
    } else if (upstreamParams.get('title_color')) {
      rankColor = `#${upstreamParams.get('title_color').replace('#', '')}`;
    }

    return new Response(svg, {
      headers: {
        'Content-Type': 'image/svg+xml; charset=utf-8',
        'Cache-Control': stillHasError 
          ? 'no-cache, no-store, must-revalidate'
          : 'public, max-age=1800, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (err) {
    console.error('Error generating github stats SVG:', err);
    return new Response(
      `<svg xmlns="http://www.w3.org/2000/svg" width="467" height="195"><text x="20" y="30" fill="red">Error loading stats</text></svg>`,
      {
        status: 500,
        headers: { 
          'Content-Type': 'image/svg+xml; charset=utf-8',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        },
      }
    );
  }
}
