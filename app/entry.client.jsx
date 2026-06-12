import {RemixBrowser} from '@remix-run/react';
import {startTransition, StrictMode} from 'react';
import {hydrateRoot} from 'react-dom/client';

if (!window.location.origin.includes('webcache.googleusercontent.com')) {
  if (window.pendo) {
    window.pendo.initialize({
      visitor: {
        id: '',
      },
    });
  }

  startTransition(() => {
    hydrateRoot(
      document,
      <StrictMode>
        <RemixBrowser />
      </StrictMode>,
    );
  });
}
