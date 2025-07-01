# Euchre Online - Peer-to-Peer Card Game

A modern web-based implementation of the classic Euchre card game, built with React 19 and react-router 7. Play with friends using peer-to-peer connections - no servers required!

## 🚀 Live Demo

Play the game online at: [https://yourusername.github.io/euchre-webrtc](https://yourusername.github.io/euchre-webrtc)

## ✨ Features

- **Zero Backend**: Complete peer-to-peer gameplay using WebRTC
- **Real-time Multiplayer**: Connect 4 players instantly with game codes
- **Responsive Design**: Beautiful, mobile-friendly interface
<!-- - **Robust Networking**: Automatic reconnection and session recovery -->
- **Secure Protocol**: Binary message encoding with integrity validation
- **Classic Euchre Rules**: Traditional 24-card deck, bidding, and scoring

## 🎮 How to Play

1. **Host a Game**: Click "Host a New Game" to create a room
2. **Share Game Code**: Send the 8-character code to 3 friends
3. **Join Game**: Players enter the code to join your table
4. **Play Euchre**: Enjoy classic Euchre with your friends!

## 🛠️ Technology Stack

- **Frontend**: React 19 with TypeScript
- **Routing**: react-router 7
- **Styling**: Tailwind CSS
- **P2P Communication**: PeerJS (WebRTC)
- **Message Protocol**: MessagePack (binary encoding)
- **Package Manager**: pnpm
- **Build Tool**: Vite

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm (preferred) or npm

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd euchre-webrtc

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

The game will be available at `http://localhost:5173` (or next available port).

### Build for Production

```bash
# Build the application
pnpm build

# Preview the build
pnpm start
```

## 🎯 Game Features

### Core Gameplay
- **4-Player Support**: Exactly 4 players required (2 teams of 2)
- **Traditional Euchre Rules**: 24-card deck, trump bidding, 5-card hands
- **Smart Card Validation**: Automatic enforcement of suit-following rules
- **Real-time Scoring**: Live score tracking and game state updates

### Networking Features
- **Instant Connection**: No registration or accounts needed
- **Session Recovery**: Rejoin games after page refresh or network issues
- **Connection Health**: Real-time status monitoring and heartbeat system

### User Experience
- **Intuitive Interface**: Drag-and-drop or click-to-play cards
- **Visual Feedback**: Clear indicators for turns, trump suit, and game state
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Accessibility**: Keyboard navigation and screen reader support

## 🏗️ Architecture

### Client-Side Architecture
```
app/
├── components/          # Reusable UI components
│   └── Card.tsx        # Playing card component
├── contexts/           # React Context providers
│   └── GameContext.tsx # Game state management
├── routes/             # Route components
│   ├── home.tsx       # Landing page
│   ├── host.tsx       # Host game creation
│   ├── join.tsx       # Join game with code
│   ├── lobby.tsx      # Player lobby
│   ├── game.tsx       # Main game interface
├── types/              # TypeScript definitions
│   ├── game.ts        # Game state types
│   └── messages.ts    # Network message types
└── utils/              # Core utilities
    ├── gameLogic.ts   # Euchre rules and logic
    ├── gameState.ts   # State management
    ├── networking.ts  # PeerJS wrapper
    └── protocol.ts    # Message encoding/decoding
```

### Network Protocol
- **Binary Encoding**: MessagePack for efficient data transmission
- **Message Validation**: Origin validation and timestamp checking
- **Connection Management**: Automatic heartbeat
- **State Synchronization**: Host-authoritative game state

## 🔧 Development

### Available Scripts

```bash
# Development
pnpm dev          # Start dev server
pnpm typecheck    # Run TypeScript checking
pnpm build        # Build for production
pnpm start        # Start production server

# Linting and Formatting
pnpm lint         # Run ESLint (if configured)
pnpm format       # Format code (if configured)
```

### Project Structure

The application follows modern React patterns:
- **Functional Components**: All components use React hooks
- **Context + useReducer**: Centralized state management
- **TypeScript**: Full type safety throughout
- **Modular Architecture**: Clean separation of concerns

### Adding New Features

1. **Game Logic**: Add rules to `utils/gameLogic.ts`
2. **State Management**: Extend reducer in `utils/gameState.ts`
3. **Network Messages**: Define types in `types/messages.ts`
4. **UI Components**: Create in `components/` directory
5. **Routes**: Add new pages in `routes/` directory

## 🎲 Game Rules

### Euchre Basics
- **Players**: 4 players in 2 partnerships
- **Deck**: 24 cards (9, 10, J, Q, K, A of each suit)
- **Objective**: First team to 10 points wins
- **Hand Size**: 5 cards per player

### Bidding Phase
- One card is turned up as potential trump
- Players bid to make that suit trump or pass
- Bidder's team must win at least 3 of 5 tricks
- Option to play "alone" for higher scoring

### Playing Phase
- Must follow suit if possible
- Trump cards beat non-trump cards
- Jack of trump suit is highest card
- Jack of same color as trump is second highest

### Scoring
- **Made bid (3-4 tricks)**: 1 point
- **Made all 5 tricks**: 2 points (4 if alone)
- **Failed bid**: Opponents get 2 points

## 🔐 Security Considerations

While this is a client-side game, several measures ensure fair play:

- **Message Origin Validation**: All messages verify sender identity
- **Timestamp Checking**: Prevents replay attacks
- **Host Authority**: Game state controlled by host
- **Binary Protocol**: Harder to tamper with than JSON
- **Connection Monitoring**: Detects and handles suspicious behavior

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes with proper TypeScript types
4. Test thoroughly with multiple players
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **PeerJS Team**: For excellent WebRTC abstraction
- **React Team**: For the amazing framework
- **Tailwind CSS**: For beautiful, responsive styling
- **Euchre Community**: For keeping this classic game alive

## 📞 Support

If you encounter issues:

1. Check the browser console for error messages
2. Ensure WebRTC is supported in your browser
3. Try refreshing the page or restarting your network
<!-- 4. Use the reconnect feature if you lose connection -->

For persistent issues, please open a GitHub issue with:
- Browser type and version
- Error messages from console
- Steps to reproduce the problem

---

**Have fun playing Euchre with your friends! 🎉**

A modern, production-ready template for building full-stack React applications using React Router.

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/remix-run/react-router-templates/tree/main/default)

## Features

- 🚀 Server-side rendering
- ⚡️ Hot Module Replacement (HMR)
- 📦 Asset bundling and optimization
- 🔄 Data loading and mutations
- 🔒 TypeScript by default
- 🎉 TailwindCSS for styling
- 📖 [React Router docs](https://reactrouter.com/)

## Getting Started

### Installation

Install the dependencies:

```bash
npm install
```

### Development

Start the development server with HMR:

```bash
npm run dev
```

Your application will be available at `http://localhost:5173`.

## Building for Production

Create a production build:

```bash
npm run build
```

## Deployment

### Docker Deployment

To build and run using Docker:

```bash
docker build -t my-app .

# Run the container
docker run -p 3000:3000 my-app
```

The containerized application can be deployed to any platform that supports Docker, including:

- AWS ECS
- Google Cloud Run
- Azure Container Apps
- Digital Ocean App Platform
- Fly.io
- Railway

### DIY Deployment

If you're familiar with deploying Node applications, the built-in app server is production-ready.

Make sure to deploy the output of `npm run build`

```
├── package.json
├── package-lock.json (or pnpm-lock.yaml, or bun.lockb)
├── build/
│   ├── client/    # Static assets
│   └── server/    # Server-side code
```

## Styling

This template comes with [Tailwind CSS](https://tailwindcss.com/) already configured for a simple default starting experience. You can use whatever CSS framework you prefer.

---

Built with ❤️ using React Router.
