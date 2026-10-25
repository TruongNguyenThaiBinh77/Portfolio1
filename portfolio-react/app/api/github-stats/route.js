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
    
    // Ensure essential params
    if (!upstreamParams.has('show_icons')) upstreamParams.set('show_icons', 'true');
    if (!upstreamParams.has('include_all_commits')) upstreamParams.set('include_all_commits', 'true');
    if (!upstreamParams.has('show')) upstreamParams.set('show', 'reviews,prs_merged_percentage');
    if (!upstreamParams.has('rank_icon')) upstreamParams.set('rank_icon', 'github');

    const upstreamUrl = `https://github-readme-stats.vercel.app/api/?${upstreamParams.toString()}`;

    const res = await fetch(upstreamUrl, {
      next: { revalidate: 1800 },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!res.ok) {
      return new Response(`Error fetching upstream stats: ${res.statusText}`, { status: res.status });
    }

    let svg = await res.text();

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

    // =========================================================================
    // 3. HIỂN THỊ XẾP HẠNG (B, B+, A...) BÊN DƯỚI VÒNG TRÒN HUY HIỆU GITHUB
    // Tạm thời ẩn code theo yêu cầu. Khi nào muốn hiện lại, chỉ cần bỏ comment (xóa /* và */) khối dưới:
    // =========================================================================
    /*
    if (svg.includes('data-testid="rank-circle"')) {
      svg = svg.replace(
        /(<g[^>]*data-testid="rank-circle"[^>]*>[\s\S]*?<\/g>\s*)(<\/g>)/,
        `$1  <text x="-10" y="66" text-anchor="middle" font-family="'Segoe UI', Ubuntu, Sans-Serif, -apple-system" font-size="16" font-weight="800" fill="${rankColor}">${rank}</text>\n    $2`
      );
    }
    */

    return new Response(svg, {
      headers: {
        'Content-Type': 'image/svg+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=1800, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (err) {
    console.error('Error generating github stats SVG:', err);
    return new Response(
      `<svg xmlns="http://www.w3.org/2000/svg" width="467" height="195"><text x="20" y="30" fill="red">Error loading stats</text></svg>`,
      {
        status: 500,
        headers: { 'Content-Type': 'image/svg+xml; charset=utf-8' },
      }
    );
  }
}
