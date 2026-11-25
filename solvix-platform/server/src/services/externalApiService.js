const axios = require('axios');

/**
 * Federated External API Aggregator
 * Queries Stack Exchange (Stack Overflow), Reddit, and GitHub REST APIs concurrently,
 * normalizes results, and ranks them alongside Solvix Knowledge Base entries.
 */

async function searchStackOverflow(query) {
  try {
    const url = 'https://api.stackexchange.com/2.3/search/advanced';
    const params = {
      order: 'desc',
      sort: 'relevance',
      q: query,
      site: 'stackoverflow',
      pagesize: 5,
      filter: 'default'
    };
    if (process.env.STACKEXCHANGE_KEY) params.key = process.env.STACKEXCHANGE_KEY;

    const { data } = await axios.get(url, { params, timeout: 4500 });
    return (data.items || []).map((item) => ({
      id: `so-${item.question_id}`,
      source: 'Stack Overflow',
      title: item.title,
      url: item.link,
      score: item.score || 0,
      answerCount: item.answer_count || 0,
      isAnswered: Boolean(item.is_answered),
      tags: item.tags || [],
      author: item.owner?.display_name || 'SO Contributor',
      createdAt: new Date(item.creation_date * 1000).toISOString(),
      relevanceScore: (item.score || 0) * 2 + (item.is_answered ? 25 : 0) + (item.answer_count || 0) * 3
    }));
  } catch (err) {
    console.warn('StackOverflow API fallback triggered:', err.message);
    return [];
  }
}

async function searchReddit(query) {
  try {
    const url = 'https://www.reddit.com/search.json';
    const { data } = await axios.get(url, {
      params: { q: query, sort: 'relevance', limit: 5, type: 'link' },
      headers: { 'User-Agent': 'SolvixAcademicProject/1.0 (JIIT)' },
      timeout: 4500
    });
    const children = data?.data?.children || [];
    return children.map(({ data: post }) => ({
      id: `rd-${post.id}`,
      source: 'Reddit',
      title: post.title,
      url: `https://www.reddit.com${post.permalink}`,
      score: post.ups || 0,
      answerCount: post.num_comments || 0,
      isAnswered: (post.num_comments || 0) > 2,
      tags: [post.subreddit_name_prefixed || 'r/programming'],
      author: post.author || 'redditor',
      createdAt: new Date((post.created_utc || Date.now() / 1000) * 1000).toISOString(),
      relevanceScore: Math.min(post.ups || 0, 150) + (post.num_comments || 0) * 2
    }));
  } catch (err) {
    console.warn('Reddit API fallback triggered:', err.message);
    return [];
  }
}

async function searchGitHub(query) {
  try {
    const url = 'https://api.github.com/search/issues';
    const headers = {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'Solvix-ProblemSolver-App'
    };
    if (process.env.GITHUB_TOKEN) {
      headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    }
    const { data } = await axios.get(url, {
      params: { q: `${query} is:issue`, per_page: 5, sort: 'reactions-+1', order: 'desc' },
      headers,
      timeout: 4500
    });
    return (data.items || []).map((issue) => ({
      id: `gh-${issue.id}`,
      source: 'GitHub',
      title: issue.title,
      url: issue.html_url,
      score: issue.reactions?.total_count || 0,
      answerCount: issue.comments || 0,
      isAnswered: issue.state === 'closed',
      tags: (issue.labels || []).slice(0, 3).map((l) => l.name),
      author: issue.user?.login || 'github-user',
      createdAt: issue.created_at,
      relevanceScore: (issue.reactions?.total_count || 0) * 4 + (issue.state === 'closed' ? 20 : 5)
    }));
  } catch (err) {
    console.warn('GitHub API fallback triggered:', err.message);
    return [];
  }
}

async function federatedExternalSearch(query, sources = ['stackoverflow', 'reddit', 'github']) {
  if (!query || !query.trim()) return [];
  const tasks = [];
  if (sources.includes('stackoverflow')) tasks.push(searchStackOverflow(query));
  if (sources.includes('reddit')) tasks.push(searchReddit(query));
  if (sources.includes('github')) tasks.push(searchGitHub(query));

  const results = await Promise.all(tasks);
  const merged = results.flat();

  // Merge and rank by computed relevanceScore descending
  return merged.sort((a, b) => b.relevanceScore - a.relevanceScore);
}

module.exports = { federatedExternalSearch };
