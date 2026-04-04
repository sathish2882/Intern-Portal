import Cookies from "js-cookie";

// ══════════════════════════════════════════════
// WebSocket Chat Service
// ──────────────────────────────────────────────
// Real-time chat via WebSocket. Handles connect,
// reconnect, send, and incoming message dispatch.
// ══════════════════════════════════════════════

export interface WsChatMessage {
  type:
    | "new_message"
    | "message_sent"
    | "status_update"
    | "connected"
    | "error"
    | "pong"
    | "user_online"
    | "user_offline";
  message?: {
    id: string;
    chat_id: string;
    sender_id: number;
    sender_name: string;
    text: string;
    timestamp: string; // ISO string
  };
  user_id?: number;
  status?: string;
  error?: string;
}

export type WsChatHandler = (data: WsChatMessage) => void;

// ── Build WebSocket URL from config ────────────
const getWsUrl = (): string => {
  const baseURL: string = (window as any).appConfig?.baseURL ?? "";
  const wsBase = baseURL.replace(/^https:/, "wss:").replace(/^http:/, "ws:");
  return `${wsBase}/ws/chat`;
};

// ── Singleton WebSocket manager ────────────────
class ChatSocketManager {
  private ws: WebSocket | null = null;
  private listeners = new Set<WsChatHandler>();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectDelay = 1000;
  private maxReconnectDelay = 30000;
  private intentionallyClosed = false;
  private pingInterval: ReturnType<typeof setInterval> | null = null;

  /** Subscribe to incoming WS messages */
  on(handler: WsChatHandler) {
    this.listeners.add(handler);
    return () => {
      this.listeners.delete(handler);
    };
  }

  /** Open the WebSocket connection */
  connect() {
    if (
      this.ws &&
      (this.ws.readyState === WebSocket.OPEN ||
        this.ws.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    this.intentionallyClosed = false;
    const token = Cookies.get("token");
    const url = token
      ? `${getWsUrl()}?token=${encodeURIComponent(token)}`
      : getWsUrl();

    try {
      this.ws = new WebSocket(url);
    } catch {
      this.scheduleReconnect();
      return;
    }

    this.ws.onopen = () => {
      console.log("[ChatWS] Connected");
      this.reconnectDelay = 1000;
      this.startPing();
      this.emit({ type: "connected" });
    };

    this.ws.onmessage = (event) => {
      try {
        const data: WsChatMessage = JSON.parse(event.data);
        this.emit(data);
      } catch {
        console.warn("[ChatWS] Non-JSON message:", event.data);
      }
    };

    this.ws.onclose = (event) => {
      console.log("[ChatWS] Closed:", event.code, event.reason);
      this.stopPing();
      if (!this.intentionallyClosed) {
        this.scheduleReconnect();
      }
    };

    this.ws.onerror = () => {
      console.warn("[ChatWS] Error — will reconnect");
    };
  }

  /** Send a JSON payload over the socket */
  send(payload: Record<string, unknown>) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    } else {
      console.warn("[ChatWS] Cannot send — socket not open");
    }
  }

  /** Gracefully close the connection */
  disconnect() {
    this.intentionallyClosed = true;
    this.stopPing();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  get isConnected() {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  // ── internal ──

  private emit(data: WsChatMessage) {
    this.listeners.forEach((fn) => {
      try {
        fn(data);
      } catch (err) {
        console.error("[ChatWS] Listener error:", err);
      }
    });
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    console.log(`[ChatWS] Reconnecting in ${this.reconnectDelay}ms…`);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, this.reconnectDelay);
    this.reconnectDelay = Math.min(
      this.reconnectDelay * 2,
      this.maxReconnectDelay
    );
  }

  private startPing() {
    this.stopPing();
    this.pingInterval = setInterval(() => {
      this.send({ type: "ping" });
    }, 25000);
  }

  private stopPing() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }
}

const chatSocket = new ChatSocketManager();
export default chatSocket;
