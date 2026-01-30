// Cloudflare Pages Function - Fetch real GitHub activity for CrustyClawd

function formatTimeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function parseEvent(event) {
  const repoName = event.repo.name.split('/')[1] || event.repo.name;
  const repoUrl = `https://github.com/${event.repo.name}`;

  switch (event.type) {
    case 'PushEvent':
      const commitCount = event.payload.commits?.length || 0;
      const commitMsg = event.payload.commits?.[0]?.message?.split('\n')[0] || '';
      return {
        id: event.id,
        repo: repoName,
        action: 'pushed to',
        detail: commitCount > 1 ? `${commitCount} commits` : commitMsg.slice(0, 50),
        time: formatTimeAgo(event.created_at),
        url: repoUrl,
      };

    case 'CreateEvent':
      if (event.payload.ref_type === 'repository') {
        return {
          id: event.id,
          repo: repoName,
          action: 'created repo',
          detail: '',
          time: formatTimeAgo(event.created_at),
          url: repoUrl,
        };
      }
      return {
        id: event.id,
        repo: repoName,
        action: `created ${event.payload.ref_type}`,
        detail: event.payload.ref || '',
        time: formatTimeAgo(event.created_at),
        url: repoUrl,
      };

    case 'IssuesEvent':
      return {
        id: event.id,
        repo: repoName,
        action: `${event.payload.action} issue`,
        detail: `#${event.payload.issue?.number}`,
        time: formatTimeAgo(event.created_at),
        url: `${repoUrl}/issues/${event.payload.issue?.number}`,
      };

    case 'PullRequestEvent':
      return {
        id: event.id,
        repo: repoName,
        action: `${event.payload.action} PR`,
        detail: `#${event.payload.pull_request?.number}`,
        time: formatTimeAgo(event.created_at),
        url: `${repoUrl}/pull/${event.payload.pull_request?.number}`,
      };

    case 'WatchEvent':
      return {
        id: event.id,
        repo: repoName,
        action: 'starred',
        detail: '',
        time: formatTimeAgo(event.created_at),
        url: repoUrl,
      };

    case 'ForkEvent':
      return {
        id: event.id,
        repo: repoName,
        action: 'forked',
        detail: '',
        time: formatTimeAgo(event.created_at),
        url: repoUrl,
      };

    default:
      return null;
  }
}

export async function onRequest(context) {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'public, max-age=60',
  };

  try {
    // Fetch GitHub events for CrustyClawd
    const response = await fetch('https://api.github.com/users/CrustyClawd/events/public?per_page=30', {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'ClawTank/1.0',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return new Response(JSON.stringify({ activity: [], stats: { repos: 0, followers: 0 } }), { headers });
      }
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const events = await response.json();
    const activity = events
      .map(parseEvent)
      .filter(item => item !== null)
      .slice(0, 10);

    // Also fetch user stats
    const userResponse = await fetch('https://api.github.com/users/CrustyClawd', {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'ClawTank/1.0',
      },
    });

    let stats = { repos: 0, followers: 0 };
    if (userResponse.ok) {
      const userData = await userResponse.json();
      stats = {
        repos: userData.public_repos || 0,
        followers: userData.followers || 0,
      };
    }

    return new Response(JSON.stringify({ activity, stats }), { headers });
  } catch (error) {
    console.error('GitHub API error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch GitHub data', activity: [], stats: { repos: 0, followers: 0 } }),
      { status: 500, headers }
    );
  }
}
