import {RemixBrowser} from '@remix-run/react';
import {startTransition, StrictMode} from 'react';
import {hydrateRoot} from 'react-dom/client';

if (!window.location.origin.includes('webcache.googleusercontent.com')) {
  startTransition(() => {
    hydrateRoot(
      document,
      <StrictMode>
        <RemixBrowser />
      </StrictMode>,
    );
  });
}

// Initialize Pendo with an anonymous visitor.
// The SDK resolves visitor identity from cookies/localStorage if available.
if (typeof window !== 'undefined' && window.pendo) {
  window.pendo.initialize({
    visitor: {
      id: '',
    },
  });
}
