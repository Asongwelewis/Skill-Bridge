/**
 * WebRTC signaling — Session Service
 *
 * A thin WebSocket relay that lets two peers in a session room exchange
 * SDP offers/answers and ICE candidates. It does NOT touch media itself;
 * the actual audio/video flows peer-to-peer in the browser.
 *
 * Peers connect to:  /ws/signal?token=<supabase access token>&room=<session id>
 */
const { WebSocketServer } = require('ws');
const supabase = require('./supabaseClient');

/**
 * Attach the signaling WebSocket server to an existing HTTP server.
 * Uses noServer mode so it only claims upgrades for the /ws/signal path
 * and leaves any other upgrade requests untouched.
 *
 * @param {import('http').Server} server
 */
function attachSignaling(server) {
  const wss = new WebSocketServer({ noServer: true });

  // roomId -> Set<{ ws, userId }>
  const rooms = new Map();

  const send = (ws, payload) => {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify(payload));
    }
  };

  server.on('upgrade', async (req, socket, head) => {
    let pathname;
    let token;
    let room;

    try {
      const url = new URL(req.url, 'http://localhost');
      pathname = url.pathname;
      token = url.searchParams.get('token');
      room = url.searchParams.get('room');
    } catch {
      socket.destroy();
      return;
    }

    // Only handle our signaling path; leave other upgrades alone.
    if (pathname !== '/ws/signal') {
      socket.destroy();
      return;
    }

    if (!token || !room) {
      socket.destroy();
      return;
    }

    // Validate the Supabase token before completing the handshake.
    let userId;
    try {
      const { data: { user } = {}, error } = await supabase.auth.getUser(token);
      if (error || !user) {
        socket.destroy();
        return;
      }
      userId = user.id;
    } catch {
      socket.destroy();
      return;
    }

    wss.handleUpgrade(req, socket, head, (ws) => {
      handleConnection(ws, room, userId);
    });
  });

  function handleConnection(ws, roomId, userId) {
    let peers = rooms.get(roomId);
    if (!peers) {
      peers = new Set();
      rooms.set(roomId, peers);
    }

    // Cap each room at 2 peers.
    if (peers.size >= 2) {
      send(ws, { type: 'room-full' });
      ws.close();
      return;
    }

    const member = { ws, userId };
    // The second peer to join initiates the offer.
    const isInitiator = peers.size === 1;

    let cleaned = false;
    const cleanup = () => {
      if (cleaned) return;
      cleaned = true;

      const set = rooms.get(roomId);
      if (set) {
        set.delete(member);
        for (const other of set) {
          send(other.ws, { type: 'peer-left' });
        }
        if (set.size === 0) rooms.delete(roomId);
      }
      try { ws.close(); } catch { /* already closed */ }
    };

    // Notify the existing peer that someone joined.
    for (const other of peers) {
      send(other.ws, { type: 'peer-joined' });
    }

    peers.add(member);

    send(ws, { type: 'joined', isInitiator, peers: peers.size });

    ws.on('message', (raw) => {
      let msg;
      try {
        msg = JSON.parse(raw.toString());
      } catch {
        return;
      }

      if (msg.type === 'leave') {
        cleanup();
        return;
      }

      // Relay signaling messages to the other peer in the room only.
      if (msg.type === 'offer' || msg.type === 'answer' || msg.type === 'ice-candidate') {
        const set = rooms.get(roomId);
        if (!set) return;
        for (const other of set) {
          if (other !== member) send(other.ws, msg);
        }
      }
    });

    ws.on('close', cleanup);
    ws.on('error', cleanup);
  }

  return wss;
}

module.exports = { attachSignaling };
