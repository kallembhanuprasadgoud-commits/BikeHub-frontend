import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { isAuthenticated, token } = useAuth();
  const [connected, setConnected] = useState(false);
  const clientRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated) {
      if (clientRef.current) {
        clientRef.current.deactivate();
        clientRef.current = null;
        setConnected(false);
      }
      return;
    }

    // Initialize STOMP client with SockJS transport
    const client = new Client({
      webSocketFactory: () => new SockJS("/ws"),
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      debug: (msg) => {
        // Disabled noisy console in production
        if (import.meta.env.DEV && false) {
          console.log("[STOMP]", msg);
        }
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        setConnected(true);
      },
      onDisconnect: () => {
        setConnected(false);
      },
      onStompError: (frame) => {
        console.error("Broker reported error: " + frame.headers["message"]);
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      if (clientRef.current) {
        clientRef.current.deactivate();
      }
    };
  }, [isAuthenticated, token]);

  const subscribe = (destination, callback) => {
    if (!clientRef.current || !clientRef.current.connected) {
      return null;
    }
    return clientRef.current.subscribe(destination, (message) => {
      try {
        const payload = JSON.parse(message.body);
        callback(payload);
      } catch (err) {
        callback(message.body);
      }
    });
  };

  const publish = (destination, body) => {
    if (!clientRef.current || !clientRef.current.connected) {
      console.warn("STOMP client not connected");
      return;
    }
    clientRef.current.publish({
      destination,
      body: typeof body === "string" ? body : JSON.stringify(body),
    });
  };

  return (
    <SocketContext.Provider value={{ client: clientRef.current, connected, subscribe, publish }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
}
