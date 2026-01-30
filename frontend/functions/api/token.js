// Cloudflare Pages Function - Fetch Solana token data from DexScreener

export async function onRequest(context) {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'public, max-age=30',
  };

  try {
    // Token mint address (can be overridden via query param)
    const url = new URL(context.request.url);
    const tokenAddress = url.searchParams.get('address') || 'B1ECK8ZBH7iCsf5nRbdPLhYCHCfUx6xhtMgBJ345pump';

    // Fetch from DexScreener API
    const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'ClawTank/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`DexScreener API error: ${response.status}`);
    }

    const data = await response.json();

    // Extract the most relevant pair (highest liquidity)
    const pairs = data.pairs || [];
    if (pairs.length === 0) {
      return new Response(JSON.stringify({
        found: false,
        token: tokenAddress,
        message: 'Token not found or no liquidity pools',
      }), { headers });
    }

    // Sort by liquidity and get the best pair
    const bestPair = pairs.sort((a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0))[0];

    const tokenData = {
      found: true,
      token: {
        address: tokenAddress,
        name: bestPair.baseToken?.name || 'Unknown',
        symbol: bestPair.baseToken?.symbol || '???',
      },
      price: {
        usd: bestPair.priceUsd || '0',
        native: bestPair.priceNative || '0',
        change24h: bestPair.priceChange?.h24 || 0,
        change1h: bestPair.priceChange?.h1 || 0,
        change5m: bestPair.priceChange?.m5 || 0,
      },
      volume: {
        h24: bestPair.volume?.h24 || 0,
        h6: bestPair.volume?.h6 || 0,
        h1: bestPair.volume?.h1 || 0,
      },
      liquidity: {
        usd: bestPair.liquidity?.usd || 0,
        base: bestPair.liquidity?.base || 0,
        quote: bestPair.liquidity?.quote || 0,
      },
      txns: {
        h24: bestPair.txns?.h24 || { buys: 0, sells: 0 },
        h1: bestPair.txns?.h1 || { buys: 0, sells: 0 },
      },
      fdv: bestPair.fdv || 0,
      marketCap: bestPair.marketCap || 0,
      pairAddress: bestPair.pairAddress || '',
      dexId: bestPair.dexId || '',
      url: bestPair.url || `https://dexscreener.com/solana/${tokenAddress}`,
    };

    return new Response(JSON.stringify(tokenData), { headers });
  } catch (error) {
    console.error('DexScreener API error:', error);
    return new Response(
      JSON.stringify({
        found: false,
        error: 'Failed to fetch token data',
        message: error.message
      }),
      { status: 500, headers }
    );
  }
}
