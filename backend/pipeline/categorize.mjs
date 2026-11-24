// Assign one category per item: models | products | industry | research | github | founders.
export const CATEGORIES = [
  { key: 'models', label: 'Models' },
  { key: 'products', label: 'Products' },
  { key: 'industry', label: 'Industry' },
  { key: 'research', label: 'Research' },
  { key: 'github', label: 'GitHub' },
  { key: 'founders', label: 'Founders' },
];

export function categorize(item, keywords) {
  if (item.hint && keywords[item.hint]) return item.hint;
  if (/arxiv\.org/.test(item.domain)) return 'research';
  if (/github\.com/.test(item.domain)) return 'github';
  const text = `${item.title} ${item.summary}`.toLowerCase();
  let best = 'products', bestScore = 0;
  for (const [cat, words] of Object.entries(keywords)) {
    const s = words.reduce((n, w) => n + (text.includes(w) ? 1 : 0), 0);
    if (s > bestScore) { best = cat; bestScore = s; }
  }
  return best;
}

export function tagsFor(item) {
  const t = `${item.title} ${item.summary}`.toLowerCase();
  const TAGS = { openai: /openai|chatgpt|gpt-/, anthropic: /anthropic|claude/, google: /google|gemini|deepmind/, meta: /\bmeta\b|llama/, nvidia: /nvidia/, microsoft: /microsoft|copilot/, agents: /\bagents?\b|agentic/, mcp: /\bmcp\b|model context protocol/, 'open-source': /open[- ]source|open weights/, coding: /coding|code |developer|ide\b/, video: /video/, image: /image|diffusion/, voice: /voice|speech|audio/, funding: /raises|funding|series [abc]|seed round/ };
  return Object.entries(TAGS).filter(([, re]) => re.test(t)).map(([k]) => k).slice(0, 4);
}
