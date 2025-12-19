"use client";

import React, { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatMessage {
  id: string;
  sender: "user" | "agent";
  message: string;
  timestamp: Date;
}

const ROOM_ID = "room1";
const USER_ID = "user123";

export default function GlobalChatWidget() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isConnected, setIsConnected] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Generate user id once
  const userIdRef = useRef(
    `user_${Math.random().toString(36).slice(2, 9)}`
  );

  // ==================== WebSocket Connection ====================
  useEffect(() => {
    if (!isChatOpen) return;

    const ws = new WebSocket(
      `ws://127.0.0.1:8001/ws/${ROOM_ID}/${USER_ID}`
    );

    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type !== "message") return;
        const newMessage: ChatMessage = {
          id: crypto.randomUUID(),
          sender: data.user_id === USER_ID ? "user" : "agent",
          message: data.content,
          timestamp: new Date(data.timestamp || Date.now()),
        };
        setMessages((prev) => [...prev, newMessage]);
      } catch (e) {
        // ignore parse errors
      }
    };

    ws.onerror = () => {
      setIsConnected(false);
    };

    ws.onclose = () => {
      setIsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, [isChatOpen]);

  // ==================== Auto Scroll ====================
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ==================== Send Message ====================
  const handleSendMessage = () => {
    if (!inputMessage.trim() || !wsRef.current || !isConnected) return;

    wsRef.current.send(
      JSON.stringify({
        type: "message",
        user_id: USER_ID,
        content: inputMessage,
        timestamp: new Date().toISOString(),
      })
    );

    setInputMessage("");
  };

  // ==================== UI ====================
  return (
    <>
      {!isChatOpen && (
        <button
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-6 right-6 z-40 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-all duration-300 hover:scale-110"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {isChatOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-96 h-[500px] bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3 flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Chat Support</h3>
              <p className="text-xs opacity-75">
                {isConnected ? "● Online" : "● Connecting..."}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsChatOpen(false)}
              className="text-white hover:bg-blue-600"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-gray-50">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-400">
                <p className="text-center">
                  Start a conversation with our support team
                </p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${
                    msg.sender === "user"
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-xs px-3 py-2 rounded-lg ${
                      msg.sender === "user"
                        ? "bg-blue-600 text-white rounded-br-none"
                        : "bg-gray-300 text-gray-900 rounded-bl-none"
                    }`}
                  >
                    <p className="text-sm">{msg.message}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {msg.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t p-3 bg-white">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSendMessage();
                }}
                placeholder="Type your message..."
                className="flex-1 border rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <Button
                size="icon"
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || !isConnected}
                className="rounded-full bg-blue-600 hover:bg-blue-700"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
