import {RemixServer} from '@remix-run/react';
import {isbot} from 'isbot';
import {renderToReadableStream} from 'react-dom/server';
import {createContentSecurityPolicy} from '@shopify/hydrogen';

/**
 * @param {Request} request
 * @param {number} responseStatusCode
 * @param {Headers} responseHeaders
 * @param {EntryContext} remixContext
 * @param {AppLoadContext} context
 */
export default async function handleRequest(
  request,
  responseStatusCode,
  responseHeaders,
  remixContext,
  context,
) {
  const {nonce, header, NonceProvider} = createContentSecurityPolicy({
    shop: {
      checkoutDomain: context.env.PUBLIC_CHECKOUT_DOMAIN,
      storeDomain: context.env.PUBLIC_STORE_DOMAIN,
    },
    directives: {
      scriptSrc: [
        'https://cdn.pendo.io',
        'https://pendo-io-static.storage.googleapis.com',
      ],
      connectSrc: ['https://app.pendo.io', 'https://data.pendo.io'],
      imgSrc: [
        'https://cdn.pendo.io',
        'https://pendo-io-static.storage.googleapis.com',
        'https://app.pendo.io',
      ],
      frameSrc: ['https://app.pendo.io'],
      childSrc: ['https://app.pendo.io'],
      styleSrc: [
        "'unsafe-inline'",
        'https://cdn.pendo.io',
        'https://pendo-io-static.storage.googleapis.com',
        'https://app.pendo.io',
      ],
    },
  });

  const body = await renderToReadableStream(
    <NonceProvider>
      <RemixServer context={remixContext} url={request.url} nonce={nonce} />
    </NonceProvider>,
    {
      nonce,
      signal: request.signal,
      onError(error) {
        console.error(error);
        responseStatusCode = 500;
      },
    },
  );

  if (isbot(request.headers.get('user-agent'))) {
    await body.allReady;
  }

  responseHeaders.set('Content-Type', 'text/html');
  responseHeaders.set('Content-Security-Policy', header);

  return new Response(body, {
    headers: responseHeaders,
    status: responseStatusCode,
  });
}

/** @typedef {import('@shopify/remix-oxygen').EntryContext} EntryContext */
/** @typedef {import('@shopify/remix-oxygen').AppLoadContext} AppLoadContext */
