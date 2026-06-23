// ── PokéScan — Cloudflare Worker Proxy ──────────────────
// Ce worker reçoit les requêtes depuis GitHub Pages,
// ajoute ta clé API Anthropic, et renvoie la réponse.
//
// DÉPLOIEMENT :
// 1. Va sur https://workers.cloudflare.com/ (compte gratuit)
// 2. Crée un nouveau Worker, colle ce code
// 3. Dans Settings > Variables, ajoute :
//    ANTHROPIC_API_KEY = sk-ant-xxxxxxxxxxxxxxxx
// 4. Note l'URL du worker (ex: pokemon-proxy.ton-pseudo.workers.dev)
// 5. Mets cette URL dans ton index.html (variable PROXY_URL)

const ALLOWED_ORIGIN = 'https://0rmx0.github.io'; // Restreins à ton domaine si tu veux : 'https://ton-pseudo.github.io'

export default {
  async fetch(request, env) {
    // Gestion CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    if (request.method !== 'POST') {
      return new Response('Méthode non autorisée', { status: 405 });
    }

    const apiKey = env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: { message: 'Clé API manquante dans les variables du Worker.' } }),
        { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': ALLOWED_ORIGIN } }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(
        JSON.stringify({ error: { message: 'Corps de requête JSON invalide.' } }),
        { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': ALLOWED_ORIGIN } }
      );
    }

    // Appel vers l'API Anthropic
    const anthropicResp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });

    const respData = await anthropicResp.json();

    return new Response(JSON.stringify(respData), {
      status: anthropicResp.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
      },
    });
  },
};
