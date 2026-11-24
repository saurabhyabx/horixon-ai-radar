// Product Hunt GraphQL (needs PRODUCT_HUNT_TOKEN). AI-related posts from the last 2 days.
import { http, daysAgo } from '../util.mjs';

const AI = /\b(ai|gpt|llm|agents?|copilot|assistant|machine learning|chatbot|generative)\b/i;

export default async function producthunt() {
  const token = process.env.PRODUCT_HUNT_TOKEN;
  if (!token) { const r = []; r.skipped = 'PRODUCT_HUNT_TOKEN not set'; return r; }
  const query = `query($after: DateTime!) { posts(first: 40, order: VOTES, postedAfter: $after) { edges { node {
    name tagline description url website votesCount commentsCount createdAt topics(first: 5) { edges { node { name } } } } } } }`;
  const res = await http('https://api.producthunt.com/v2/api/graphql', {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({ query, variables: { after: daysAgo(2).toISOString() } }),
  });
  const edges = res?.data?.posts?.edges || [];
  return edges.map(({ node: n }) => ({ ...n, topicNames: n.topics.edges.map((e) => e.node.name) }))
    .filter((n) => AI.test(`${n.name} ${n.tagline} ${n.topicNames.join(' ')}`))
    .map((n) => ({
      title: `${n.name} — ${n.tagline}`,
      url: n.website || n.url,
      source: 'Product Hunt',
      sourceKey: 'producthunt',
      sourceUrl: n.url,
      summary: n.description || n.tagline,
      publishedAt: n.createdAt,
      engagement: Math.min(100, Math.round(n.votesCount / 5)),
      meta: { votes: n.votesCount, comments: n.commentsCount },
      hint: 'products',
      badges: ['launch'],
    }));
}
