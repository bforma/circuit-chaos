# Circuit Chaos - AI Development Guide

## Project Overview

Circuit Chaos is a browser-based multiplayer robot programming game inspired by Robo Rally. Players program their robots with movement cards, then watch them execute simultaneously on a factory floor filled with hazards.

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite + Pixi.js (@pixi/react)
- **Backend**: Node.js + Express + Socket.io
- **State**: Zustand (client), Redis (server persistence)
- **Shared**: TypeScript types and game logic in monorepo
- **Deployment**: Render.com (free tier)

## Project Structure

```
circuit-chaos/
├── packages/
│   ├── client/          # React frontend
│   │   ├── src/
│   │   │   ├── assets/themes/  # 10 visual themes (SVG tiles)
│   │   │   ├── components/     # React UI components
│   │   │   ├── game/           # Pixi.js game rendering
│   │   │   ├── hooks/          # Custom hooks (useSocket)
│   │   │   └── stores/         # Zustand state
│   │   └── package.json
│   ├── server/          # Node.js backend
│   │   ├── src/
│   │   │   ├── game/           # Game logic & manager
│   │   │   └── index.ts        # Express + Socket.io server
│   │   └── package.json
│   └── shared/          # Shared types & constants
│       ├── src/
│       │   ├── types/          # TypeScript interfaces
│       │   └── constants.ts
│       └── package.json
└── package.json         # Workspace root
```

## Development Guidelines

### Code Quality
- Keep functions short and focused (max ~20 lines)
- Write unit tests for game logic
- Use TypeScript strictly - no `any` types
- Follow existing code patterns and naming conventions

### Visual Assets
- All game tiles are SVG with `shape-rendering="crispEdges"` for pixel art style
- All tiles are 128x128 pixels (walls are 128x32)
- Each theme has 9 tiles: floor, pit, repair, conveyor, conveyor-fast, gear-cw, gear-ccw, checkpoint, wall
- Use consistent color palettes per theme

### Game Architecture
- Server-authoritative model (server validates all actions)
- Real-time sync via Socket.io events
- Game state persisted to Redis for reconnection support
- Phases: lobby → programming → executing → cleanup → (repeat or finished)

## Common Commands

```bash
# Install dependencies
npm install

# Run development (client + server)
npm run dev

# Build all packages
npm run build

# Type check
npm run typecheck

# Run tests
npm test
```

## Key Files

- `packages/shared/src/types/game-state.ts` - Core game state interface
- `packages/server/src/game/GameManager.ts` - Server game session logic
- `packages/server/src/game/executor.ts` - Turn execution logic
- `packages/client/src/game/GameBoard.tsx` - Pixi.js board rendering
- `packages/client/src/hooks/useSocket.ts` - Socket.io client hook

## Adding Features

1. **New tile types**: Add to `shared/types/tile.ts`, update `executor.ts`, create SVG for all 10 themes
2. **New game settings**: Add to `GameState`/`GameSettings`, update `GameManager`, add UI in `Lobby.tsx`
3. **New socket events**: Define in `useSocket.ts` interfaces, handle in `GameManager`, emit from components

## Deployment

The app auto-deploys to Render.com on push to main. Configuration in `render.yaml`.

Production URL: https://circuit-chaos.onrender.com
