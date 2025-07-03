import { type RouteConfig, index, route } from '@react-router/dev/routes';

export default [
  index('routes/home.tsx'),
  route('host', 'routes/host.tsx'),
  route('join/:gameId', 'routes/join.tsx'),
  route('lobby/:gameId', 'routes/lobby.tsx'),
  route('game/:gameId', 'routes/game.tsx'),
  route('*', 'routes/not-found.tsx'),
] satisfies RouteConfig;
