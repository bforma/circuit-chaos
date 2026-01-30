import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { GameManager } from './game/GameManager';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProduction = process.env.NODE_ENV === 'production';

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: isProduction
    ? undefined
    : {
        origin: ['http://localhost:5173', 'http://localhost:3000'],
        methods: ['GET', 'POST'],
      },
});

app.use(cors());
app.use(express.json());

// Serve static files in production
if (isProduction) {
  const clientDist = path.join(__dirname, '../../client');
  app.use(express.static(clientDist));
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Game manager
const gameManager = new GameManager(io);

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('game:create', (playerName: string) => {
    gameManager.createGame(socket, playerName);
  });

  socket.on('game:join', (gameId: string, playerName: string) => {
    gameManager.joinGame(socket, gameId, playerName);
  });

  socket.on('game:leave', () => {
    gameManager.leaveGame(socket);
  });

  socket.on('game:start', () => {
    gameManager.startGame(socket);
  });

  socket.on('game:program', (registerIndex: number, card: any) => {
    gameManager.programRegister(socket, registerIndex, card);
  });

  socket.on('game:submit', () => {
    gameManager.submitProgram(socket);
  });

  socket.on('game:reconnect', (gameId: string, playerId: string) => {
    gameManager.reconnect(socket, gameId, playerId);
  });

  socket.on('game:vote-disconnect', (vote: string) => {
    gameManager.submitDisconnectVote(socket, vote as any);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    gameManager.handleDisconnect(socket);
  });
});

// SPA fallback - serve index.html for all non-API routes in production
if (isProduction) {
  const clientDist = path.join(__dirname, '../../client');
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
