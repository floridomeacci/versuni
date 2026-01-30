# Versuni Tools

This workspace hosts the static Philips marketing tools (insight generator, creative reviewer, culture map, ad generator). Deploy the site on Vercel with the API proxy enabled so client-side tools can call OpenAI securely without exposing keys.

## Local Development

1. Serve the project or run `vercel dev` from the repo root.
2. Set your OpenAI key for the creative reviewer in one of two ways:
   - Add it to `localStorage` in the browser console: `localStorage.setItem('philips_openai_api_key', 'sk-...')`
   - Or expose it via a temporary `window.philipsConfig = { openAiKey: 'sk-...' };` script before `js/creative-reviewer.js` loads.

## Vercel Deployment

1. Configure the environment variable `OPENAI_API_KEY` in the Vercel project settings.
2. Deploy. The client automatically routes funnel requests through `/api/openai`, which uses the server-side key.
3. No API key should be bundled in the client output.
