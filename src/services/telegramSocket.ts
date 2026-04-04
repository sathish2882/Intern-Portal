import Cookies from "js-cookie";

// ══════════════════════════════════════════════
// Telegram WebSocket Service
// ──────────────────────────────────────────────
// Connects to backend WebSocket for real-time
// Telegram message delivery (webhook → WS push).
// ══════════════════════════════════════════════

export interface WsIncomingMessage {
  type: "new_message" | "status_update" | "connected" | "error" | "pong";
  message?: {
    message_id: number;
    chat_id: number | string;
    sender_id: number;
    sender_name: string;
    text: string;
    timestamp: string;
  };
  status?: string;
  error?: string;
}

export type WsMessageHandler = (data: WsIncomingMessage) => void;

// ── Build WebSocket URL from config ────────────
const getWsUrl = (): string => {
  const baseURL: string = window.appConfig?.baseURL ?? "";
  // Convert http(s) → ws(s)
  const wsBase = baseURL
    .replace(/^https:/, "wss:")
    .replace(/^http:/, "ws:");
  return `${wsBase}/ws/telegram`;
};

// ── Singleton WebSocket manager ────────────────
class TelegramSocketManager {
  private ws: WebSocket | null = null;
  private listeners = new Set<WsMessageHandler>();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectDelay = 1000; // start at 1s, backs off
  private maxReconnectDelay = 30000;
  private intentionallyClosed = false;
  private pingInterval: ReturnType<typeof setInterval> | null = null;

  /** Subscribe to incoming WS messages */
  on(handler: WsMessageHandler) {
    this.listeners.add(handler);
    return () => {
      this.listeners.delete(handler);
    };
  }

  /** Open the WebSocket connection */
  connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return; // already connected / connecting
    }

    this.intentionallyClosed = false;
    const token = Cookies.get("token");
    const url = token ? `${getWsUrl()}?token=${encodeURIComponent(token)}` : getWsUrl();

    try {
      this.ws = new WebSocket(url);
    } catch {
      this.scheduleReconnect();
      return;
    }

    this.ws.onopen = () => {
      console.log("[TelegramWS] Connected");
      this.reconnectDelay = 1000; // reset backoff
      this.startPing();
      this.emit({ type: "connected" });
    };

    this.ws.onmessage = (event) => {
      try {
        const data: WsIncomingMessage = JSON.parse(event.data);
        this.emit(data);
      } catch {
        console.warn("[TelegramWS] Non-JSON message:", event.data);
      }
    };

    this.ws.onclose = (event) => {
      console.log("[TelegramWS] Closed:", event.code, event.reason);
      this.stopPing();
      if (!this.intentionallyClosed) {
        this.scheduleReconnect();
      }
    };

    this.ws.onerror = () => {
      console.warn("[TelegramWS] Error — will reconnect");
      // onclose fires after onerror, reconnect handled there
    };
  }

  /** Close the connection (no reconnect) */
  disconnect() {
    this.intentionallyClosed = true;
    this.stopPing();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close(1000, "Client disconnect");
      this.ws = null;
    }
  }

  /** Send a JSON payload over the socket */
  send(payload: Record<string, unknown>) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    } else {
      console.warn("[TelegramWS] Cannot send — not connected");
    }
  }

  /** Send a chat message through the WebSocket */
  sendMessage(chatId: number | string, text: string) {
    this.send({ type: "send_message", chat_id: chatId, text });
  }

  get isConnected() {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  // ── Internal ─────────────────────────────────

  private emit(data: WsIncomingMessage) {
    this.listeners.forEach((fn) => {
      try {
        fn(data);
      } catch (err) {
        console.error("[TelegramWS] Listener error:", err);
      }
    });
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    console.log(`[TelegramWS] Reconnecting in ${this.reconnectDelay}ms…`);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, this.reconnectDelay);
    // Exponential backoff with jitter
    this.reconnectDelay = Math.min(
      this.reconnectDelay * 2 + Math.random() * 500,
      this.maxReconnectDelay
    );
  }

  private startPing() {
    this.stopPing();
    // Keep-alive every 25s (most proxies timeout at 30s)
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

// Singleton instance
const telegramSocket = new TelegramSocketManager();
export default telegramSocket;
