/**
 * Server-side Pendo Track Event utility.
 * Sends track events to the Pendo Track API via HTTP POST.
 *
 * Requires the PENDO_INTEGRATION_KEY environment variable to be set
 * in the Oxygen deployment environment.
 */

const PENDO_TRACK_URL = 'https://data.pendo.io/data/track';

/**
 * Sends a track event to Pendo's server-side Track API.
 * Uses waitUntil when available to avoid blocking the response.
 *
 * @param {Object} options
 * @param {string} options.event - Event name (must match a registered Pendo track type)
 * @param {string} [options.visitorId] - Unique visitor identifier
 * @param {string} [options.accountId] - Unique account identifier
 * @param {Record<string, string>} [options.properties] - Event metadata
 * @param {Env} options.env - Environment variables (must include PENDO_INTEGRATION_KEY)
 * @param {Function} [options.waitUntil] - Worker waitUntil for non-blocking execution
 */
export function pendoTrack({
  event,
  visitorId,
  accountId,
  properties,
  env,
  waitUntil,
}) {
  const integrationKey = env?.PENDO_INTEGRATION_KEY;
  if (!integrationKey) {
    return;
  }

  const trackPromise = fetch(PENDO_TRACK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-pendo-integration-key': integrationKey,
    },
    body: JSON.stringify({
      type: 'track',
      event,
      visitorId: visitorId || 'anonymous',
      accountId: accountId || 'system',
      timestamp: Date.now(),
      properties: properties || {},
    }),
  }).catch((err) => {
    console.error('[Pendo] Failed to send track event:', err);
  });

  if (typeof waitUntil === 'function') {
    waitUntil(trackPromise);
  }
}
