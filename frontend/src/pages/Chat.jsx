import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { chatApi } from "../services/chatApi";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import Loader from "../components/common/Loader";
import toast from "react-hot-toast";

export default function Chat() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialRoomId = searchParams.get("roomId");
  const { user } = useAuth();
  const { connected, subscribe, publish } = useSocket();

  const [rooms, setRooms] = useState([]);
  const [activeRoomId, setActiveRoomId] = useState(initialRoomId ? parseInt(initialRoomId, 10) : null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const messagesEndRef = useRef(null);

  // Auto-scroll to latest message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chat rooms
  useEffect(() => {
    async function loadRooms() {
      try {
        setLoadingRooms(true);
        const data = await chatApi.getRooms();
        setRooms(data || []);
        if (!activeRoomId && data && data.length > 0) {
          setActiveRoomId(data[0].id);
        }
      } catch (err) {
        console.error("Failed to load chat rooms:", err);
      } finally {
        setLoadingRooms(false);
      }
    }
    loadRooms();
  }, []);

  // When active room changes: fetch messages & subscribe to STOMP channel
  useEffect(() => {
    if (!activeRoomId) return;

    setSearchParams({ roomId: activeRoomId });

    async function loadMessages() {
      try {
        setLoadingMessages(true);
        const msgs = await chatApi.getMessages(activeRoomId);
        setMessages(msgs || []);
      } catch (err) {
        console.error("Failed to load messages:", err);
      } finally {
        setLoadingMessages(false);
      }
    }
    loadMessages();

    // STOMP WebSocket subscription
    let subscription = null;
    if (connected) {
      subscription = subscribe(`/topic/chat/${activeRoomId}`, (newMsg) => {
        setMessages((prev) => {
          // Avoid duplicate append if already present
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
      });
    }

    return () => {
      if (subscription && typeof subscription.unsubscribe === "function") {
        subscription.unsubscribe();
      }
    };
  }, [activeRoomId, connected]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !activeRoomId) return;

    const text = inputText.trim();
    setInputText("");

    try {
      // Send via REST endpoint (which persists and broadcasts to WebSocket broker)
      const savedMsg = await chatApi.sendMessage(activeRoomId, text);
      setMessages((prev) => {
        if (prev.some((m) => m.id === savedMsg.id)) return prev;
        return [...prev, savedMsg];
      });
    } catch (err) {
      toast.error("Message delivery failed");
    }
  };

  const activeRoom = rooms.find((r) => r.id === activeRoomId);

  return (
    <div className="container" style={{ padding: "2rem 1.25rem 4rem", maxWidth: "1100px" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.8rem", marginBottom: "0.25rem" }}>Live Inquiries & Seller Chat</h1>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
          <span
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: connected ? "var(--accent-success)" : "var(--accent-warning)",
            }}
          />
          {connected ? "WebSocket Connected" : "Connecting to chat server..."}
        </div>
      </div>

      <div
        className="glass-panel"
        style={{
          display: "grid",
          gridTemplateColumns: "320px 1fr",
          height: "650px",
          overflow: "hidden",
        }}
      >
        {/* Left Side: Rooms List */}
        <div
          style={{
            borderRight: "1px solid var(--border-subtle)",
            display: "flex",
            flexDirection: "column",
            background: "var(--bg-surface)",
          }}
        >
          <div style={{ padding: "1.25rem", borderBottom: "1px solid var(--border-subtle)" }}>
            <h3 style={{ fontSize: "1.05rem" }}>Conversations ({rooms.length})</h3>
          </div>

          <div style={{ overflowY: "auto", flex: 1 }}>
            {loadingRooms ? (
              <Loader message="Loading conversations..." />
            ) : rooms.length === 0 ? (
              <div style={{ padding: "2rem 1rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.9rem" }}>
                No active conversations yet. Visit a bike listing and click "Chat with Seller".
              </div>
            ) : (
              rooms.map((room) => {
                const isSelected = room.id === activeRoomId;
                const otherPartyName = user?.id === room.buyerId ? room.sellerName : room.buyerName;

                return (
                  <div
                    key={room.id}
                    onClick={() => setActiveRoomId(room.id)}
                    style={{
                      padding: "1rem 1.25rem",
                      cursor: "pointer",
                      background: isSelected ? "var(--bg-surface-elevated)" : "transparent",
                      borderLeft: isSelected ? "3px solid var(--accent-primary)" : "3px solid transparent",
                      borderBottom: "1px solid var(--border-subtle)",
                      transition: "background 0.15s",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.25rem" }}>
                      <strong style={{ fontSize: "0.95rem", color: isSelected ? "#fff" : "var(--text-primary)" }}>
                        {otherPartyName || "User"}
                      </strong>
                      <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                        {room.updatedAt ? new Date(room.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                      </span>
                    </div>

                    <div style={{ fontSize: "0.8rem", color: "var(--accent-primary)", fontWeight: 600, marginBottom: "0.25rem" }}>
                      🏍 {room.bikeBrand} {room.bikeModel}
                    </div>

                    <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {room.lastMessage || "Tap to read conversation..."}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Active Messages Stream */}
        <div style={{ display: "flex", flexDirection: "column", background: "var(--bg-main)" }}>
          {activeRoom ? (
            <>
              {/* Active Room Header */}
              <div
                style={{
                  padding: "1rem 1.5rem",
                  background: "var(--bg-surface)",
                  borderBottom: "1px solid var(--border-subtle)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <h3 style={{ fontSize: "1.1rem" }}>
                    {user?.id === activeRoom.buyerId ? activeRoom.sellerName : activeRoom.buyerName}
                  </h3>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                    Inquiry regarding: <strong style={{ color: "var(--accent-primary)" }}>{activeRoom.bikeBrand} {activeRoom.bikeModel}</strong>
                  </div>
                </div>
              </div>

              {/* Messages Scroll Area */}
              <div style={{ flex: 1, padding: "1.5rem", overflowY: "auto", display: "flex", flexDirection: "column", gap: "1rem" }}>
                {loadingMessages ? (
                  <Loader message="Loading messages..." />
                ) : messages.length === 0 ? (
                  <div style={{ textAlign: "center", color: "var(--text-muted)", margin: "auto" }}>
                    👋 Say hello! Ask about vehicle service history or test rides.
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMine = msg.senderId === user?.id;
                    return (
                      <div
                        key={msg.id}
                        style={{
                          alignSelf: isMine ? "flex-end" : "flex-start",
                          maxWidth: "70%",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: isMine ? "flex-end" : "flex-start",
                        }}
                      >
                        <div
                          style={{
                            padding: "0.75rem 1rem",
                            borderRadius: isMine ? "14px 14px 2px 14px" : "14px 14px 14px 2px",
                            background: isMine
                              ? "linear-gradient(135deg, #f97316 0%, #ea580c 100%)"
                              : "var(--bg-surface-elevated)",
                            color: "#ffffff",
                            fontSize: "0.92rem",
                            lineHeight: 1.5,
                            boxShadow: "var(--shadow-sm)",
                          }}
                        >
                          {msg.messageText}
                        </div>
                        <span style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginTop: "4px", padding: "0 4px" }}>
                          {msg.createdAt
                            ? new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                            : "Just now"}
                        </span>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input Bar */}
              <form
                onSubmit={handleSendMessage}
                style={{
                  padding: "1rem 1.25rem",
                  background: "var(--bg-surface)",
                  borderTop: "1px solid var(--border-subtle)",
                  display: "flex",
                  gap: "0.75rem",
                }}
              >
                <input
                  type="text"
                  className="form-control"
                  placeholder="Type your message..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                />
                <button type="submit" disabled={!inputText.trim()} className="btn btn-primary">
                  Send ✈
                </button>
              </form>
            </>
          ) : (
            <div style={{ margin: "auto", textAlign: "center", color: "var(--text-muted)" }}>
              <div style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>💬</div>
              <p>Select a conversation from the left to start chatting</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
