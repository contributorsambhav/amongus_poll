"use client";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import clsx from "clsx";
// import {
//   Card,
//   CardContent,
//   CardFooter,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SendHorizonal } from "lucide-react";

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [connected, setConnected] = useState(false);
  const [clientId, setClientId] = useState(null);
  const [clients, setClients] = useState([]);
  const [voting, setVoting] = useState(false);
  const [voteCounts, setVoteCounts] = useState({});
  const [initialCountdown, setInitialCountdown] = useState(null);
  const [votingTimeLeft, setVotingTimeLeft] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [autoVotingInitiated, setAutoVotingInitiated] = useState(false);

  const socket = useRef(null);
  const scrollAreaRef = useRef(null);

  const connectToServer = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const userEmail = urlParams.get("email")?.trim() || "test-client";
    // TODO: check here if user is present in the firebase if is present then only connect that user in system
    socket.current = new WebSocket(`wss://amongus-poll-1.onrender.com?email=${userEmail}`);
    

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
      } else if (data.type === "voting_initiated") {
        setInitialCountdown(data.countdown);
        addMessage("Voting will start soon.", "system");
      } else if (data.type === "voting_countdown") {
        setInitialCountdown(data.countdown);
      } else if (data.type === "start_voting") {
        setInitialCountdown(null);
        setVoting(true);
        setVotingTimeLeft(data.votingPeriod);
        addMessage(
          "Voting has started. You have 30 seconds to vote.",
          "system",
        );
      } else if (data.type === "voting_time_left") {
        setVotingTimeLeft(data.timeLeft);
      } else if (data.type === "stop_voting") {
        setVoting(false);
        setVotingTimeLeft(null);
        addMessage("Voting has ended.", "system");
        setHasVoted(false);
      } else if (data.type === "vote_update") {
        setVoteCounts(data.voteCounts);
      } else if (data.type === "message") {
        addMessage(
          data.text,
          data.senderId === clientId ? "sent" : "received",
          data.senderId,
        );
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
    setConnected(false);
    setAutoVotingInitiated(false);
  };

  const addMessage = (text, type, senderId = null) => {
    const newMessage = { id: Date.now(), text, type, senderId };
    setMessages((prev) => [...prev, newMessage]);

    setTimeout(() => {
      if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
      }
    }, 100);
  };

  const sendMessage = () => {
    if (socket.current && message.trim() && connected && !voting) {
      socket.current.send(
        JSON.stringify({ type: "message", text: message, senderId: clientId }),
      );
      addMessage(message, "sent", clientId);
      setMessage("");
    }
  };

  const initiateVoting = () => {
    if (socket.current && connected && !voting) {
      socket.current.send(JSON.stringify({ type: "initiate_voting" }));
      addMessage("Voting has been initiated.", "system");
      setHasVoted(false);
      setAutoVotingInitiated(true);
    }
  };

  const voteForClient = (targetClientId) => {
    if (socket.current && targetClientId !== clientId && voting && !hasVoted) {
      socket.current.send(JSON.stringify({ type: "vote", targetClientId }));
      setHasVoted(true);
    }
  };

  useEffect(() => {
    if (connected && clientId && clients.length === 1 && !autoVotingInitiated) {
      initiateVoting();
    }
  }, [connected, clientId, clients, autoVotingInitiated]);

  return (
    <div className="container mx-auto max-w-md p-4">
      <div className="flex justify-end mb-4">
        {!connected ? (
          <Button
            onClick={connectToServer}
            className="cursor-pointer h-7 text-xs bg-green-600 hover:opacity-90 hover:bg-green-600 transition-all duration-200 ease-out"
          >
            Connect
          </Button>
        ) : (
          <Button
            onClick={disconnectFromServer}
            className="cursor-pointer h-7 text-white hover:text-white text-xs bg-red-600 hover:opacity-90 hover:bg-red-600 transition-all duration-200 ease-out"
            variant="outline"
          >
            Disconnect
          </Button>
        )}
      </div>

      <div className="w-full border p-3 rounded-md">
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold">Among Us Chat</h2>
            <Badge
              variant={connected ? "success" : "destructive"}
              className={clsx(
                "text-xs",
                connected
                  ? "bg-green-100 border border-green-600 text-green-700"
                  : "bg-red-100 border border-red-600 text-red-700",
              )}
            >
              {connected ? "Connected" : "Disconnected"}
            </Badge>
          </div>
          <div className="text-xs text-gray-500">
            {clientId && `Your Client ID: ${clientId.split('@')[0]}`}
          </div>
          <div className="text-xs text-gray-500">
            {connected && `${clients.length} users connected`}
          </div>
          {initialCountdown !== null && initialCountdown > 0 && (
            <div className="text-xs text-blue-600 mt-2">
              Voting will start in {initialCountdown} second
              {initialCountdown !== 1 ? "s" : ""}.
            </div>
          )}
          {voting && votingTimeLeft !== null && (
            <div className="text-xs text-red-600 mt-2">
              Voting ends in {votingTimeLeft} second
              {votingTimeLeft !== 1 ? "s" : ""}.
            </div>
          )}
        </div>

        <div>
          <div className="h-[60vh] relative">
            <ScrollArea
              className="py-4 px-1 pb-12 h-[60vh]"
              ref={scrollAreaRef}
            >
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  No messages yet.
                </div>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className="mb-2">
                    <div
                      className={`flex ${
                        msg.type === "sent" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`px-3 py-1.5 font-medium rounded-lg max-w-[18rem] text-[0.8rem] ${
                          msg.type === "sent"
                            ? "bg-green-400 text-white rounded-br-none"
                            : "bg-gray-200 text-black rounded-bl-none"
                        }`}
                      >
                        {msg.senderId && (
                          <p className={`text-[0.6rem]  ${
                            msg.type === "sent" ? "text-green-100" : "text-neutral-400"
                          }`}>
                            {msg.senderId.split('@')[0]}
                            <br />
                          </p>
                        )}
                        {msg.text}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </ScrollArea>
            <div className="flex flex-col gap-4">
              <div className="flex w-full gap-2 bg-white absolute bottom-0">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type a message..."
                  disabled={!connected || voting}
                  className="shadow-none bg-neutral-50/30 border focus-visible:ring-0 text-neutral-700 text-xs"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") sendMessage();
                  }}
                />
                <Button
                  onClick={sendMessage}
                  className="cursor-pointer bg-blue-700 hover:bg-blue-700 transition-all duration-200 ease-out flex gap-1"
                  disabled={!connected || voting || !message.trim()}
                >
                  <SendHorizonal size={16} />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <h2 className="text-lg font-normal">Connected Clients</h2>
        {clients.length > 0 ? (
          <div className="h-36 overflow-y-auto mt-3">
            {clients.map((id) => (
              <div
                key={id}
                className="flex text-sm justify-between items-center px-2 py-1.5 border rounded-md mt-2"
              >
                <span>
                  Client ID: {id.split('@')[0]} {id === clientId ? "(You)" : ""}
                  {voting && (
                    <span className="ml-2 text-sm text-gray-600">
                      Votes: {voteCounts[id] || 0}
                    </span>
                  )}
                </span>
                <Button
                  onClick={() => voteForClient(id)}
                  disabled={id === clientId || !voting || hasVoted}
                  className="h-7 text-xs cursor-pointer"
                >
                  Vote
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No clients connected.</p>
        )}
      </div>
    </div>
  );
}
