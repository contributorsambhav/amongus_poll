const WebSocket = require('ws');
const http = require('http');
const url = require('url');
const firebase_app = require("./firebaseConfig");
const  { getFirestore, doc, updateDoc } = require("firebase/firestore/lite");
const db = getFirestore(firebase_app);


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
let initialCountdown = 90; // Full 90 seconds for chat before voting
let votingPeriod = 30; 

let votedClients = {};

wss.on('connection', (ws,req) => {
  const params = new URLSearchParams(url.parse(req.url).query);
  const email = params.get("email");
  const clientId = email || Math.random().toString(36).substr(2, 9);
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

        // Send voting initiated message with full 90-second countdown
        broadcast({ type: "voting_initiated", countdown: initialCountdown });

        // Start countdown from 90 seconds
        let countdown = initialCountdown;
        initialCountdownTimer = setInterval(() => {
          countdown--;
          broadcast({ type: "voting_countdown", countdown });
          if (countdown <= 0) {
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

    // When all clients disconnect, reset voting state and countdown timers
    if (clients.size === 0) {
      votingActive = false;
      votes = {};
      votedClients = {};
      if (initialCountdownTimer) {
        clearInterval(initialCountdownTimer);
        initialCountdownTimer = null;
      }
      if (votingCountdownTimer) {
        clearInterval(votingCountdownTimer);
        votingCountdownTimer = null;
      }
      // Reset initial countdown back to full 90 seconds for new connections
      initialCountdown = 90;
      console.log('All clients disconnected. Voting state and countdown reset to full 90 seconds.');
    }
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

async function endVoting() {
  votingActive = false;
  broadcast({ type: "stop_voting" });
  
  let maxVotes = 0;
  for (const count of Object.values(votes)) {
    if (count > maxVotes) {
      maxVotes = count;
    }
  }

  const clientsWithMax = Object.entries(votes).filter(
    ([clientId, count]) => count === maxVotes
  );

  let systemMessage = "";

  if (clientsWithMax.length === 1) {
    const [eliminatedClient] = clientsWithMax[0];
    if (clients.has(eliminatedClient)) {
      systemMessage = `Eliminating client: ${eliminatedClient} with ${maxVotes} votes.`;
      console.log(systemMessage);

      try {
        const userRef = doc(db, "AllPlayers", eliminatedClient);
        await updateDoc(userRef, { isAlive: false });
        console.log(JSON.stringify(userRef))

        console.log(`Updated Firestore: ${eliminatedClient} isAlive = false`);
        console.log(JSON.stringify(userRef))
      } catch (error) {
        console.error("Error updating Firestore:", error);
      }
      clients.get(eliminatedClient).close();
      clients.delete(eliminatedClient);
      broadcastClients();
    }
  } else {
    systemMessage = `Tie detected among clients: ${clientsWithMax.map(([id]) => id).join(", ")}. No elimination.`;
    console.log(systemMessage);
  }

  broadcast({ type: "message", text: systemMessage });

  setTimeout(() => {
    const clientIds = Array.from(clients.keys());
    clientIds.forEach((clientId) => {
      const ws = clients.get(clientId);
      if (ws) {
        ws.close();
        clients.delete(clientId);
      }
    });
  }, 5000);
  

  

}


const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
