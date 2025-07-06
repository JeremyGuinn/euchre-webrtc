import { type RouteConfig, index, route } from '@react-router/dev/routes';

export default [
  index('routes/home.tsx'),
  route('host', 'routes/host.tsx'),
  route('join/:gameCode', 'routes/join.tsx'),
  route('lobby/:gameCode', 'routes/lobby.tsx'),
  route('game/:gameCode', 'routes/game.tsx'),
  route('*', 'routes/not-found.tsx'),
] satisfies RouteConfig;
