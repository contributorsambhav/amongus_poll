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
let votes = {}; 
let votingActive = false;
let initialCountdownTimer = null;
let votingCountdownTimer = null;
let initialCountdown = 10; 
let votingPeriod = 30; 

let votedClients = {};

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
    } 

    else if (data.type === "initiate_voting") {
      if (!votingActive) {
        votingActive = true;
        votes = {};       
        votedClients = {}; 

        broadcast({ type: "voting_initiated", countdown: initialCountdown });

        initialCountdown = 10;
        initialCountdownTimer = setInterval(() => {
          initialCountdown--;
          broadcast({ type: "voting_countdown", countdown: initialCountdown });
          if (initialCountdown <= 0) {
            clearInterval(initialCountdownTimer);

            broadcast({ type: "start_voting", votingPeriod });

            let timeLeft = votingPeriod;
            votingCountdownTimer = setInterval(() => {
              timeLeft--;
              broadcast({ type: "voting_time_left", timeLeft });
              if (timeLeft <= 0) {
                clearInterval(votingCountdownTimer);
                endVoting();
              }
            }, 1000);
          }
        }, 1000);
      }
    } 
    else if (data.type === "vote" && votingActive) {

      if (votedClients[clientId]) {
        return;
      }
      votedClients[clientId] = true;

      if (data.targetClientId !== clientId && clients.has(data.targetClientId)) {
        votes[data.targetClientId] = (votes[data.targetClientId] || 0) + 1;
        broadcast({ type: "vote_update", voteCounts: votes });
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

function endVoting() {
  votingActive = false;
  broadcast({ type: "stop_voting" });
  let maxVotes = 0;
  let eliminatedClient = null;
  for (const [clientId, count] of Object.entries(votes)) {
    if (count > maxVotes) {
      maxVotes = count;
      eliminatedClient = clientId;
    }
  }
  if (eliminatedClient && clients.has(eliminatedClient)) {
    console.log(`Eliminating client: ${eliminatedClient} with ${maxVotes} votes`);
    clients.get(eliminatedClient).close();
    clients.delete(eliminatedClient);
    broadcastClients();
  }
  votes = {};
}

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});