import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProd = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT) || 3000;

interface StageCue {
  id: string;
  clientId?: string;
  type: 'CALL' | 'CUE';
  code: string;
  title: string;
  senderName: string;
  instrument?: string;
  location?: string;
  musicianName?: string;
  timestamp: number;
  acknowledgedAt: number | null;
  status: 'pending' | 'acknowledged';
  notes?: string;
}

interface RoomState {
  code: string;
  activeAlert: StageCue | null;
  activeAlerts: StageCue[];
  history: StageCue[];
  connectedClients: {
    id: string;
    role: 'stage' | 'booth';
    name: string;
    instrument?: string;
    location?: string;
    lastPing: number;
  }[];
  engineerMessage?: {
    text: string;
    timestamp: number;
  } | null;
}

const rooms = new Map<string, RoomState>();
const socketToRoom = new Map<WebSocket, { roomCode: string; clientId: string }>();

function getOrCreateRoom(code: string): RoomState {
  const normalized = code.trim().toUpperCase();
  let room = rooms.get(normalized);
  if (!room) {
    room = {
      code: normalized,
      activeAlert: null,
      activeAlerts: [],
      history: [],
      connectedClients: [],
      engineerMessage: null,
    };
    rooms.set(normalized, room);
  } else if (!room.activeAlerts) {
    room.activeAlerts = room.activeAlert ? [room.activeAlert] : [];
  }
  return room;
}


const app = express();
app.use(express.json());

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: Date.now() });
});

app.get('/api/rooms/:code', (req, res) => {
  const room = getOrCreateRoom(req.params.code);
  res.json(room);
});

app.post('/api/rooms/:code/cue', (req, res) => {
  const room = getOrCreateRoom(req.params.code);
  const { type, code, title, senderName, instrument, location, musicianName, clientId } = req.body;

  const cue: StageCue = {
    id: `cue_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    clientId: clientId || '',
    type: type || 'CUE',
    code: code || 'CUSTOM',
    title: title || 'Stage Alert',
    senderName: senderName || 'Stage',
    instrument: instrument || '',
    location: location || '',
    musicianName: musicianName || '',
    timestamp: Date.now(),
    acknowledgedAt: null,
    status: 'pending',
  };

  if (!room.activeAlerts) room.activeAlerts = [];
  // Replace pending cue from same client if exists
  room.activeAlerts = room.activeAlerts.filter(a => !(a.clientId && a.clientId === cue.clientId && a.status === 'pending'));
  room.activeAlerts.unshift(cue);
  // Sort: urgent CALLs first, then newest
  room.activeAlerts.sort((a, b) => {
    if (a.type === 'CALL' && b.type !== 'CALL') return -1;
    if (b.type === 'CALL' && a.type !== 'CALL') return 1;
    return b.timestamp - a.timestamp;
  });

  room.activeAlert = room.activeAlerts[0] || null;
  room.history.unshift(cue);
  if (room.history.length > 60) room.history.pop();
  room.engineerMessage = null;

  broadcastRoom(room.code, { type: 'STATE_UPDATE', payload: room });
  res.json({ success: true, cue, room });
});

app.post('/api/rooms/:code/acknowledge', (req, res) => {
  const room = getOrCreateRoom(req.params.code);
  const { alertId, note } = req.body;

  if (!room.activeAlerts) room.activeAlerts = [];
  let acknowledgedCues: StageCue[] = [];

  if (!alertId || alertId === 'ALL') {
    acknowledgedCues = [...room.activeAlerts];
    room.activeAlerts.forEach(alert => {
      alert.status = 'acknowledged';
      alert.acknowledgedAt = Date.now();
      if (note) alert.notes = note;
      const historyItem = room.history.find(h => h.id === alert.id);
      if (historyItem) {
        historyItem.status = 'acknowledged';
        historyItem.acknowledgedAt = Date.now();
        if (note) historyItem.notes = note;
      }
    });
    room.activeAlerts = [];
  } else {
    const targetAlert = room.activeAlerts.find(a => a.id === alertId);
    if (targetAlert) {
      targetAlert.status = 'acknowledged';
      targetAlert.acknowledgedAt = Date.now();
      if (note) targetAlert.notes = note;
      acknowledgedCues.push(targetAlert);

      const historyItem = room.history.find(h => h.id === alertId);
      if (historyItem) {
        historyItem.status = 'acknowledged';
        historyItem.acknowledgedAt = Date.now();
        if (note) historyItem.notes = note;
      }

      room.activeAlerts = room.activeAlerts.filter(a => a.id !== alertId);
    }
  }

  room.activeAlert = room.activeAlerts[0] || null;
  if (note) {
    room.engineerMessage = {
      text: note,
      timestamp: Date.now(),
    };
  }

  broadcastRoom(room.code, {
    type: 'ALERT_ACKNOWLEDGED',
    payload: {
      room,
      acknowledgedCue: acknowledgedCues[0] || null,
      acknowledgedCues,
      alertId,
      note,
    },
  });
  res.json({ success: true, room });
});


app.post('/api/rooms/:code/response', (req, res) => {
  const room = getOrCreateRoom(req.params.code);
  const { text } = req.body;
  room.engineerMessage = {
    text: text || 'Acknowledged',
    timestamp: Date.now(),
  };

  broadcastRoom(room.code, { type: 'STATE_UPDATE', payload: room });
  res.json({ success: true, room });
});

app.post('/api/rooms/:code/clear-history', (req, res) => {
  const room = getOrCreateRoom(req.params.code);
  room.history = [];
  broadcastRoom(room.code, { type: 'STATE_UPDATE', payload: room });
  res.json({ success: true });
});

const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', (req, socket, head) => {
  try {
    const host = req.headers.host || 'localhost';
    const url = new URL(req.url || '', `http://${host}`);
    if (url.pathname === '/ws') {
      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit('connection', ws, req);
      });
    }
  } catch (err) {
    console.error('Error handling upgrade:', err);
  }
});

function broadcastRoom(roomCode: string, message: { type: string; payload: unknown }) {
  const json = JSON.stringify(message);
  for (const [ws, info] of socketToRoom.entries()) {
    if (info.roomCode === roomCode && ws.readyState === WebSocket.OPEN) {
      ws.send(json);
    }
  }
}

wss.on('connection', (ws) => {
  let currentRoomCode = '';
  let clientId = '';

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'JOIN_ROOM') {
        const { roomCode, role, name, instrument, location, id } = msg.payload;
        currentRoomCode = (roomCode || 'SUNDAY').trim().toUpperCase();
        clientId = id || `client_${Math.random().toString(36).substring(2, 7)}`;

        socketToRoom.set(ws, { roomCode: currentRoomCode, clientId });
        const room = getOrCreateRoom(currentRoomCode);

        // Update clients list
        room.connectedClients = room.connectedClients.filter(c => c.id !== clientId);
        room.connectedClients.push({
          id: clientId,
          role: role || 'stage',
          name: name || (role === 'booth' ? 'Booth' : 'Musician'),
          instrument,
          location,
          lastPing: Date.now(),
        });

        // Send state back to the joiner
        ws.send(JSON.stringify({ type: 'INIT_STATE', payload: room }));
        // Broadcast presence
        broadcastRoom(currentRoomCode, { type: 'STATE_UPDATE', payload: room });
      } else if (msg.type === 'SEND_CUE') {
        const { roomCode, cue } = msg.payload;
        const targetRoom = (roomCode || currentRoomCode).trim().toUpperCase();
        const room = getOrCreateRoom(targetRoom);

        const newCue: StageCue = {
          id: `cue_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          clientId: cue.clientId || '',
          type: cue.type || 'CUE',
          code: cue.code,
          title: cue.title,
          senderName: cue.senderName || 'Musician',
          instrument: cue.instrument || '',
          location: cue.location || '',
          musicianName: cue.musicianName || '',
          timestamp: Date.now(),
          acknowledgedAt: null,
          status: 'pending',
        };

        if (!room.activeAlerts) room.activeAlerts = [];
        room.activeAlerts = room.activeAlerts.filter(
          a => !(a.clientId && a.clientId === newCue.clientId && a.status === 'pending')
        );
        room.activeAlerts.unshift(newCue);
        room.activeAlerts.sort((a, b) => {
          if (a.type === 'CALL' && b.type !== 'CALL') return -1;
          if (b.type === 'CALL' && a.type !== 'CALL') return 1;
          return b.timestamp - a.timestamp;
        });

        room.activeAlert = room.activeAlerts[0] || null;
        room.history.unshift(newCue);
        if (room.history.length > 60) room.history.pop();
        room.engineerMessage = null;

        broadcastRoom(targetRoom, { type: 'STATE_UPDATE', payload: room });
      } else if (msg.type === 'ACKNOWLEDGE_CUE') {
        const { roomCode, alertId, note } = msg.payload;
        const targetRoom = (roomCode || currentRoomCode).trim().toUpperCase();
        const room = getOrCreateRoom(targetRoom);

        if (!room.activeAlerts) room.activeAlerts = [];
        let acknowledgedCues: StageCue[] = [];

        if (!alertId || alertId === 'ALL') {
          acknowledgedCues = [...room.activeAlerts];
          room.activeAlerts.forEach(alert => {
            alert.status = 'acknowledged';
            alert.acknowledgedAt = Date.now();
            if (note) alert.notes = note;
            const historyItem = room.history.find(h => h.id === alert.id);
            if (historyItem) {
              historyItem.status = 'acknowledged';
              historyItem.acknowledgedAt = Date.now();
              if (note) historyItem.notes = note;
            }
          });
          room.activeAlerts = [];
        } else {
          const targetAlert = room.activeAlerts.find(a => a.id === alertId);
          if (targetAlert) {
            targetAlert.status = 'acknowledged';
            targetAlert.acknowledgedAt = Date.now();
            if (note) targetAlert.notes = note;
            acknowledgedCues.push(targetAlert);

            const historyItem = room.history.find(h => h.id === alertId);
            if (historyItem) {
              historyItem.status = 'acknowledged';
              historyItem.acknowledgedAt = Date.now();
              if (note) historyItem.notes = note;
            }

            room.activeAlerts = room.activeAlerts.filter(a => a.id !== alertId);
          }
        }

        room.activeAlert = room.activeAlerts[0] || null;
        if (note) {
          room.engineerMessage = {
            text: note,
            timestamp: Date.now(),
          };
        }

        broadcastRoom(targetRoom, {
          type: 'ALERT_ACKNOWLEDGED',
          payload: {
            room,
            acknowledgedCue: acknowledgedCues[0] || null,
            acknowledgedCues,
            alertId,
            note,
          },
        });

      } else if (msg.type === 'ENGINEER_RESPONSE') {
        const { roomCode, text } = msg.payload;
        const targetRoom = (roomCode || currentRoomCode).trim().toUpperCase();
        const room = getOrCreateRoom(targetRoom);

        room.engineerMessage = {
          text: text || 'Acknowledged',
          timestamp: Date.now(),
        };

        broadcastRoom(targetRoom, { type: 'STATE_UPDATE', payload: room });
      } else if (msg.type === 'PING') {
        ws.send(JSON.stringify({ type: 'PONG', time: Date.now() }));
      }
    } catch (err) {
      console.error('Error handling WS message:', err);
    }
  });

  ws.on('close', () => {
    socketToRoom.delete(ws);
    if (currentRoomCode && rooms.has(currentRoomCode)) {
      const room = rooms.get(currentRoomCode)!;
      room.connectedClients = room.connectedClients.filter(c => c.id !== clientId);
      broadcastRoom(currentRoomCode, { type: 'STATE_UPDATE', payload: room });
    }
  });
});

async function startServer() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: { server },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`StageSync server running on http://0.0.0.0:${PORT} (env: ${process.env.NODE_ENV || 'development'})`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
