const WebSocket = require('ws');
const http = require('http');
const url = require('url');
const firebase_app = require("./firebaseConfig");
const { getFirestore, doc, updateDoc } = require("firebase/firestore/lite");
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

let chatrooms = [];
let activeChatRoom = null;

class ChatRoom {
  constructor(id) {
    this.id = id;
    this.clients = new Map();  
    this.votes = {};
    this.votingActive = false;
    this.votedClients = {};
    this.initialCountdown = 90; 
    this.votingPeriod = 30;
    this.createdAt = Date.now();
    this.initialCountdownTimer = null;
    this.votingCountdownTimer = null;
  }

  addClient(clientId, ws) {
    this.clients.set(clientId, ws);
    ws.chatRoomId = this.id; 
    console.log(`Client ${clientId} joined chatroom ${this.id}`);
    this.send(ws, { type: "your_id", clientId });
    this.broadcastClients();
  }

  send(ws, message) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  broadcast(message, sender = null) {
    const msgString = JSON.stringify(message);
    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN && client !== sender) {
        client.send(msgString);
      }
    });
  }

  broadcastClients() {
    const clientList = Array.from(this.clients.keys());
    this.broadcast({ type: "client_list", clients: clientList });
  }

  initiateVoting() {
    if (this.votingActive) return;
    this.votingActive = true;
    this.votes = {};
    this.votedClients = {};

    this.broadcast({ type: "voting_initiated", countdown: this.initialCountdown });

    let countdown = this.initialCountdown;
    this.initialCountdownTimer = setInterval(() => {
      countdown--;
      this.broadcast({ type: "voting_countdown", countdown });
      if (countdown <= 0) {
        clearInterval(this.initialCountdownTimer);
        this.broadcast({ type: "start_voting", votingPeriod: this.votingPeriod });

        let timeLeft = this.votingPeriod;
        this.votingCountdownTimer = setInterval(() => {
          timeLeft--;
          this.broadcast({ type: "voting_time_left", timeLeft });
          if (timeLeft <= 0) {
            clearInterval(this.votingCountdownTimer);
            this.endVoting();
          }
        }, 1000);
      }
    }, 1000);
  }

  handleVote(fromClientId, targetClientId) {

    if (this.votedClients[fromClientId]) {
      return;
    }
    this.votedClients[fromClientId] = true;

    if (targetClientId !== fromClientId && this.clients.has(targetClientId)) {
      this.votes[targetClientId] = (this.votes[targetClientId] || 0) + 1;
      this.broadcast({ type: "vote_update", voteCounts: this.votes });
    }
  }

  async endVoting() {
    this.votingActive = false;
    this.broadcast({ type: "stop_voting" });

    let maxVotes = 0;
    for (const count of Object.values(this.votes)) {
      if (count > maxVotes) {
        maxVotes = count;
      }
    }

    const clientsWithMax = Object.entries(this.votes).filter(
      ([clientId, count]) => count === maxVotes
    );

    let systemMessage = "";
    if (clientsWithMax.length === 1) {
      const [eliminatedClient] = clientsWithMax[0];
      if (this.clients.has(eliminatedClient)) {
        systemMessage = `Eliminating client: ${eliminatedClient} with ${maxVotes} votes.`;
        console.log(systemMessage);
        try {
          const userRef = doc(db, "AllPlayers", eliminatedClient);
          await updateDoc(userRef, { IsAlive: false });
          console.log(`Updated Firestore: ${eliminatedClient} isAlive = false`);
        } catch (error) {
          console.error("Error updating Firestore:", error);
        }

        let eliminatedWs = this.clients.get(eliminatedClient);
        eliminatedWs.close();
        this.clients.delete(eliminatedClient);
        this.broadcastClients();
      }
    } else {
      systemMessage = `Tie detected among clients: ${clientsWithMax.map(([id]) => id).join(", ")}. No elimination.`;
      console.log(systemMessage);
    }

    this.broadcast({ type: "message", text: systemMessage });

    setTimeout(() => {
      this.clients.forEach((ws, clientId) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
      });
      this.clients.clear();
      console.log(`Chatroom ${this.id} closed after voting.`);
    }, 5000);
  }

  removeClient(clientId) {
    this.clients.delete(clientId);
    this.broadcastClients();
    if (this.clients.size === 0) {

      if (this.initialCountdownTimer) {
        clearInterval(this.initialCountdownTimer);
        this.initialCountdownTimer = null;
      }
      if (this.votingCountdownTimer) {
        clearInterval(this.votingCountdownTimer);
        this.votingCountdownTimer = null;
      }
      console.log(`Chatroom ${this.id} is now empty and can be cleaned up.`);
      
    }
  }
}

function getActiveChatRoom() {

  if (!activeChatRoom || (Date.now() - activeChatRoom.createdAt) > 10000) {
    const newRoomId = Math.random().toString(36).substr(2, 9);
    activeChatRoom = new ChatRoom(newRoomId);
    chatrooms.push(activeChatRoom);
    console.log(`New chatroom created with id: ${newRoomId}`);
  }
  return activeChatRoom;
}

wss.on('connection', (ws, req) => {

  const params = new URLSearchParams(url.parse(req.url).query);
  const email = params.get("email");
  const clientId = email || Math.random().toString(36).substr(2, 9);

  const room = getActiveChatRoom();
  room.addClient(clientId, ws);

  ws.on('message', (message) => {
    let data;
    try {
      data = JSON.parse(message);
    } catch (error) {
      console.error("Invalid JSON received:", message);
      return;
    }

    if (data.type === "message") {
      room.broadcast({ type: "message", text: data.text, senderId: clientId }, ws);
    } else if (data.type === "initiate_voting") {
      room.initiateVoting();
    } else if (data.type === "vote" && room.votingActive) {
      room.handleVote(clientId, data.targetClientId);
    }
  });

  ws.on('close', () => {
    room.removeClient(clientId);
    console.log(`Client disconnected: ${clientId} from chatroom ${room.id}`);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    room.removeClient(clientId);
  });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});