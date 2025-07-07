import type { Config } from '@react-router/dev/config';
import { useEffect } from 'react';
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from 'react-router';
import type { Route } from './+types/root';
import './app.css';
import { ErrorBoundary } from './components/error/ErrorBoundary';
import { GameProvider } from './contexts/game/GameContext';
import {
  createScopedLogger,
  initializeLogger,
} from './services/loggingService';

declare global {
  interface Window {
    __reactRouterContext: Config;
  }
}

export const links: Route.LinksFunction = () => [
  { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  {
    rel: 'preconnect',
    href: 'https://fonts.gstatic.com',
    crossOrigin: 'anonymous',
  },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap',
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='en'>
      <head>
        <meta charSet='utf-8' />
        <meta name='viewport' content='width=device-width, initial-scale=1' />
        <Meta />
        <Links />
        {/* GitHub Pages SPA routing script */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Single Page Apps for GitHub Pages
              // https://github.com/rafgraph/spa-github-pages
              (function(l) {
                if (l.search[1] === '/' ) {
                  var decoded = l.search.slice(1).split('&').map(function(s) { 
                    return s.replace(/~and~/g, '&')
                  }).join('?');
                  window.history.replaceState(null, null,
                      l.pathname.slice(0, -1) + decoded + l.hash
                  );
                }
              }(window.location))
            `,
          }}
        />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  const logger = createScopedLogger('App');

  // Initialize logging on app startup
  useEffect(() => {
    logger.withOperation('app-initialization', () => {
      initializeLogger();
      logger.info('Application initialized', {
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        environment: import.meta.env.MODE,
      });
    });
  }, [logger]);

  return (
    <ErrorBoundary>
      <GameProvider>
        <Outlet />
      </GameProvider>
    </ErrorBoundary>
  );
}
