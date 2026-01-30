# Circuit Chaos

A browser-based multiplayer robot programming board game. Program your robot to navigate a chaotic factory floor, avoid hazards, and race to the checkpoints.

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Installation

```bash
npm install
```

### Development

Start both the client and server in development mode:

```bash
npm run dev
```

This runs:
- **Client**: http://localhost:5173 (Vite + React)
- **Server**: http://localhost:3001 (Express + Socket.io)

### Running Separately

Start only the server:
```bash
npm run dev:server
```

Start only the client:
```bash
npm run dev:client
```

### Type Checking

```bash
npm run typecheck
```

## Testing

### Unit Tests

Run unit tests with Vitest:

```bash
npm run test          # Run once
npm run test:watch    # Watch mode
```

### End-to-End Tests

Run E2E tests with Playwright:

```bash
npm run test:e2e           # Run in headless mode
npm run test:e2e:headed    # Run with browser visible
npm run test:e2e:ui        # Run with Playwright UI
```

Tests run in Chromium, Firefox, and WebKit (Safari).

## How to Play

1. Open http://localhost:5173 in your browser
2. Enter your name and click **Create Game**
3. Share the 4-letter game code with friends
4. Other players enter the code and click **Join Game**
5. Once 2+ players have joined, the host clicks **Start Game**

### Programming Phase

- You receive a hand of movement cards
- Click a card to select it, then click a register slot (1-5) to place it
- Fill all 5 registers and click **Submit Program**
- Once all players submit, the round executes

### Card Types

| Card | Effect |
|------|--------|
| Move 1 | Move forward 1 tile |
| Move 2 | Move forward 2 tiles |
| Move 3 | Move forward 3 tiles |
| Back Up | Move backward 1 tile |
| Turn Left | Rotate 90° counter-clockwise |
| Turn Right | Rotate 90° clockwise |
| U-Turn | Rotate 180° |

### Board Elements

- **Conveyor Belts** (blue): Move robots in the arrow direction
- **Express Conveyors** (dark blue): Move robots twice
- **Gears** (purple): Rotate robots
- **Pits** (black): Destroy robots that fall in
- **Lasers** (red): Deal damage to robots in their path
- **Repair Stations** (green): Remove 1 damage
- **Checkpoints** (orange): Reach these in order to win

### Winning

The first player to reach all checkpoints in order wins the game.

## Project Structure

```
circuit-chaos/
├── packages/
│   ├── client/     # React frontend with Pixi.js rendering
│   ├── server/     # Node.js backend with Socket.io
│   └── shared/     # Shared types and game logic
└── package.json    # Workspace root
```

## Tech Stack

- **Frontend**: React, TypeScript, Vite, Pixi.js, Zustand
- **Backend**: Node.js, Express, Socket.io
- **Shared**: TypeScript types and game constants
