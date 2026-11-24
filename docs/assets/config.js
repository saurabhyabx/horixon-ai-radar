// Horixon site settings. Edit these, commit, and GitHub Pages picks them up.
window.HORIXON = {
  siteName: 'Horixon',
  tagline: 'The AI news hub for builders',
  // Where newsletter + lead-magnet forms POST (FormData: email, source, list).
  // Examples: a Beehiiv/ConvertKit/Buttondown form action, Formspree, or a Google Apps Script URL.
  // Leave empty to run in demo mode (shows success, nothing is sent).
  newsletterEndpoint: '',
  // Optional: Pro checkout link (Stripe Payment Link, Lemon Squeezy, Beehiiv paid tier…)
  proCheckoutMonthly: '',
  proCheckoutAnnual: '',
  proPriceMonthly: '$9',
  proPriceAnnual: '$90',
  // Free lead-magnet files (relative to /docs). Shown after the email gate.
  templates: [
    { id: 'ai-tool-scorecard', title: 'AI Tool Evaluation Scorecard', desc: 'A one-page scorecard to judge any new AI product in 10 minutes: job-to-be-done, quality, cost, lock-in, risk.', file: 'templates/ai-tool-scorecard.md', icon: 'check' },
    { id: 'ai-launch-plan', title: 'AI Feature Launch Plan', desc: 'The checklist to ship an AI feature: evals, guardrails, pricing, rollout, and the metrics to watch in week one.', file: 'templates/ai-launch-plan.md', icon: 'rocket' },
    { id: 'founder-ai-stack', title: 'Founder AI Stack 2026', desc: 'A curated stack of AI tools by job (build, sell, support, operate) with free tiers marked.', file: 'templates/founder-ai-stack.md', icon: 'layers' },
  ],
  sponsorEvery: 8, // insert a sponsor/CTA card every N stories
};
