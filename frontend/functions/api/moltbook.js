// Cloudflare Pages Function - Fetch Moltbook posts for Crusty69000

const AGENT_NAME = 'Crusty69000';

export async function onRequest(context) {
  const MOLTBOOK_API_KEY = context.env.MOLTBOOK_API_KEY;
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
  };

  try {
    // Fetch Crusty's profile which includes recent posts
    const response = await fetch(`https://www.moltbook.com/api/v1/agents/profile?name=${AGENT_NAME}`, {
      headers: {
        'Authorization': `Bearer ${MOLTBOOK_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Moltbook API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch profile');
    }

    const posts = (data.recentPosts || []).map(post => ({
      id: post.id,
      title: post.title,
      content: post.content,
      submolt: post.submolt?.name || 'general',
      upvotes: post.upvote_count || 0,
      comments: post.comment_count || 0,
      time: post.created_at,
      url: `https://moltbook.com/post/${post.id}`,
    }));

    return new Response(JSON.stringify({
      success: true,
      agent: {
        name: data.agent?.name || AGENT_NAME,
        karma: data.agent?.karma || 0,
        followers: data.agent?.follower_count || 0,
        avatar: data.agent?.avatar_url || null,
      },
      posts,
    }), { headers });
  } catch (error) {
    console.error('Moltbook API error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to fetch Moltbook data',
        posts: [],
      }),
      { status: 200, headers }
    );
  }
}
