// Hugging Face trending models and Spaces.
import { http } from '../util.mjs';

export default async function huggingface() {
  const out = [];
  const now = new Date().toISOString();
  try {
    const models = await http('https://huggingface.co/api/models?sort=trendingScore&direction=-1&limit=15');
    for (const m of models) out.push({
      title: `${m.id} (model)`,
      url: `https://huggingface.co/${m.id}`,
      source: 'Hugging Face',
      sourceKey: 'huggingface',
      sourceUrl: `https://huggingface.co/${m.id}`,
      summary: [m.pipeline_tag, m.library_name, m.likes ? `${m.likes} likes` : ''].filter(Boolean).join(' · '),
      publishedAt: now, // trending today
      engagement: Math.min(60, Math.round((m.trendingScore || 0) / 4)),
      hint: 'models',
    });
  } catch { /* skip */ }
  try {
    const spaces = await http('https://huggingface.co/api/spaces?sort=trendingScore&direction=-1&limit=8');
    for (const s of spaces) out.push({
      title: `${s.id} (Space)`,
      url: `https://huggingface.co/spaces/${s.id}`,
      source: 'Hugging Face',
      sourceKey: 'huggingface',
      sourceUrl: `https://huggingface.co/spaces/${s.id}`,
      summary: ['Trending demo', s.sdk, s.likes ? `${s.likes} likes` : ''].filter(Boolean).join(' · '),
      publishedAt: now,
      engagement: Math.min(60, Math.round((s.trendingScore || 0) / 4)),
      hint: 'products',
    });
  } catch { /* skip */ }
  return out;
}
