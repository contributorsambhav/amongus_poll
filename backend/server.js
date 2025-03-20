const WebSocket = require('ws');
const http = require('http');
const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('WebSocket server is running with CORS enabled');
});
const wss = new WebSocket.Server({ server });
const clients = new Map();
const votes = new Map();
wss.on('connection', (ws) => {
  const clientId = Math.random().toString(36).substr(2, 9);
  clients.set(clientId, ws);
  console.log(`Client connected: ${clientId}`);
  ws.send(JSON.stringify({ type: "your_id", clientId }));
  broadcastClients();
  ws.on('message', (message) => {
    const data = JSON.parse(message);
    if (data.type === "message") {
      broadcast({ type: "message", text: data.text, senderId: clientId }, ws);
    } else if (data.type === "start_voting") {
      votes.clear();
      broadcast({ type: "start_voting" }, ws);
    } else if (data.type === "vote" && clients.has(data.targetClientId)) {
      if (data.targetClientId !== clientId) {
        votes.set(
          data.targetClientId,
          (votes.get(data.targetClientId) || 0) + 1
        );
        checkForElimination();
      }
    }
  });
  ws.on('close', () => {
    clients.delete(clientId);
    console.log(`Client disconnected: ${clientId}`);
    broadcastClients();
  });
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    clients.delete(clientId);
  });
});
function broadcast(message, sender = null) {
  const msgString = JSON.stringify(message);
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN && client !== sender) {
      client.send(msgString);
    }
  });
}
function broadcastClients() {
  const clientList = Array.from(clients.keys());
  broadcast({ type: "client_list", clients: clientList });
}
function checkForElimination() {
  let maxVotes = 1;
  let eliminatedClient = null;
  votes.forEach((count, clientId) => {
    if (count > maxVotes) {
      maxVotes = count;
      eliminatedClient = clientId;
    }
  });
  if (eliminatedClient && clients.has(eliminatedClient)) {
    console.log(`Eliminating client: ${eliminatedClient}`);
    clients.get(eliminatedClient).close();
    clients.delete(eliminatedClient);
    votes.delete(eliminatedClient);
    broadcastClients();
  }
}
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});