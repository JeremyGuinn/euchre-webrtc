# Euchre WebRTC

A peer-to-peer multiplayer Euchre card game built with React 19 and WebRTC. No servers required.

## Quick Start

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev
```

Visit `http://localhost:5173` to play.

## Tech Stack

- **React 19** with TypeScript
- **React Router 7** for routing
- **WebRTC** via PeerJS for peer-to-peer networking
- **MessagePack** for binary message encoding
- **Tailwind CSS** for styling
- **Zustand** for state management

## How It Works

The game uses WebRTC data channels for real-time communication between players. One player acts as the host and maintains authoritative game state, while all players communicate directly with each other.

Key technical decisions:

- **Binary Protocol**: MessagePack encoding for efficient data transfer
- **Host Authority**: Game state managed by host to prevent conflicts
- **Message Validation**: Origin checking and timestamps for security
- **Session Persistence**: Game state survives page refreshes

## Development commands

```bash
# Development
pnpm dev              # Start dev server
pnpm build            # Build for production
pnpm start            # Preview production build

# Code Quality
pnpm typecheck        # TypeScript checking
pnpm lint             # ESLint
pnpm test             # Run tests
```

## Game Flow

1. **Host** creates a game and receives an 8-character room code
2. **Players** join using the room code (WebRTC connection established)
3. **Lobby** phase for team assignment and game options
4. **Game** plays standard Euchre rules with real-time synchronization

## Network Protocol

Messages are encoded with MessagePack and include:

- Message type and payload
- Sender identification
- Timestamp for ordering
- Checksum for integrity

All game state changes flow through the host to maintain consistency.

## Contributing

1. Fork the repo
2. Create a feature branch
3. Make changes with proper TypeScript types
4. Test with multiple players
5. Submit a PR

## License

MIT - see [LICENSE](LICENSE) file for details.
