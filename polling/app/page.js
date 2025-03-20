"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [connected, setConnected] = useState(false);
  const [clientId, setClientId] = useState(null);
  const [clients, setClients] = useState([]);
  const [voting, setVoting] = useState(false);
  const socket = useRef(null);
  const scrollAreaRef = useRef(null);

  const connectToServer = () => {
    socket.current = new WebSocket("ws://localhost:8080");

    socket.current.onopen = () => {
      setConnected(true);
      addMessage("Connected to the server", "system");
    };

    socket.current.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "your_id") {
        setClientId(data.clientId);
      } else if (data.type === "client_list") {
        setClients(data.clients);
      } else if (data.type === "start_voting") {
        setVoting(true);
      } else if (data.type === "stop_voting") {
        setVoting(false);
      } else if (data.type === "message") {
        addMessage(data.text, data.senderId === clientId ? "sent" : "received");
      }
    };

    socket.current.onclose = () => {
      setConnected(false);
      addMessage("Disconnected from the server", "system");
    };
  };

  const disconnectFromServer = () => {
    if (socket.current) {
      socket.current.close();
      socket.current = null;
    }
  };

  const addMessage = (text, type) => {
    const newMessage = { id: Date.now(), text, type };
    setMessages((prev) => [...prev, newMessage]);

    setTimeout(() => {
      if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
      }
    }, 100);
  };

  const sendMessage = () => {
    if (socket.current && message.trim() && connected) {
      socket.current.send(JSON.stringify({ type: "message", text: message, senderId: clientId }));
      addMessage(message, "sent");
      setMessage("");
    }
  };

  const startVoting = () => {
    if (socket.current) {
      socket.current.send(JSON.stringify({ type: "start_voting" }));
    }
  };

  const voteForClient = (targetClientId) => {
    if (socket.current && targetClientId !== clientId) {
      socket.current.send(JSON.stringify({ type: "vote", targetClientId }));
    }
  };

  return (
    <div className="container mx-auto max-w-md p-4">
      {/* Connect / Disconnect Button */}
      <div className="flex justify-end mb-4">
        {!connected ? (
          <Button onClick={connectToServer}>Connect</Button>
        ) : (
          <Button onClick={disconnectFromServer} variant="outline">Disconnect</Button>
        )}
      </div>

      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>WebSocket Chat</CardTitle>
            <Badge variant={connected ? "success" : "destructive"}>
              {connected ? "Connected" : "Disconnected"}
            </Badge>
          </div>
          <div className="text-sm text-gray-500">
            {clientId && `Your Client ID: ${clientId}`}
          </div>
          <div className="text-sm text-gray-500">
            {connected && `${clients.length} client(s) connected`}
          </div>
        </CardHeader>

        <CardContent>
          <ScrollArea className="h-64 rounded-md border p-4" ref={scrollAreaRef}>
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 py-8">No messages yet.</div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className="mb-2">
                  <div className={`flex ${msg.type === "sent" ? "justify-end" : "justify-start"}`}>
                    <div className={`px-3 py-2 rounded-lg max-w-xs text-sm ${
                      msg.type === "sent"
                        ? "bg-blue-500 text-white"  // Blue for sent messages
                        : "bg-gray-200 text-black"    // Gray for received messages
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                </div>
              ))
            )}
          </ScrollArea>
        </CardContent>

        <CardFooter className="flex flex-col gap-4">
          <div className="flex w-full gap-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message..."
              disabled={!connected}
              onKeyDown={(e) => { if (e.key === "Enter") sendMessage(); }}
            />
            <Button onClick={sendMessage} disabled={!connected || !message.trim()}>Send</Button>
          </div>
        </CardFooter>
      </Card>

      <div className="mt-4">
        <h2 className="text-lg font-bold">Connected Clients</h2>
        {clients.length > 0 ? (
          clients.map((id) => (
            <div key={id} className="flex justify-between items-center p-2 border rounded-md mt-2">
              <span>Client ID: {id} {id === clientId ? "(You)" : ""}</span>
              <Button onClick={() => voteForClient(id)} disabled={id === clientId}>Vote</Button>
            </div>
          ))
        ) : (
          <p className="text-gray-500">No clients connected.</p>
        )}
       
      </div>
    </div>
  );
}
