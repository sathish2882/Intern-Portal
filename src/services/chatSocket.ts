import { getToken, isTokenExpired } from "../utils/authCookies";

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
    id?: string | number;
    message_id?: string | number;
    chat_id?: string | number;
    conversation_id?: string | number;
    sender_id?: number;
    sender_name?: string;
    text?: string;
    content?: string;
    timestamp?: string; // ISO string
  };
  user_id?: number;
  status?: string;
  error?: string;
}

export type WsChatHandler = (data: WsChatMessage) => void;

// ── Build WebSocket URL candidates from config ──
const decodeJwtExpMs = (token: string): number | null => {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
    const parsed = JSON.parse(atob(padded));
    if (!parsed?.exp) return null;
    return Number(parsed.exp) * 1000;
  } catch {
    return null;
  }
};

const getWsBase = (): string => {
  const cfg = (window as any).appConfig ?? {};
  const explicitWs: string = cfg.wsURL ?? cfg.wsBaseURL ?? "";
  const baseURL: string = explicitWs || cfg.baseURL || "";
  const normalizedBase = String(baseURL).replace(/\/+$/, "");
  return normalizedBase.replace(/^https:/, "wss:").replace(/^http:/, "ws:");
};

const getWsUrls = (
  token: string,
  conversationId?: number | string | null,
): string[] => {
  const wsBase = getWsBase();
  if (!wsBase) return [];

  const tokenQuery = `token=${encodeURIComponent(token)}`;
  const hasConversationId =
    conversationId !== undefined &&
    conversationId !== null &&
    String(conversationId).trim() !== "";
  const conversationPart = hasConversationId
    ? encodeURIComponent(String(conversationId))
    : "";

  const pathCandidates = [
    `/Chat/ws/${conversationPart}`,
    `/Chat/${conversationPart}/ws`,
    `/Chat/groups/${conversationPart}/ws`,
    `/Chat/groups/ws/${conversationPart}`,
  ];

  return [
    ...new Set(pathCandidates.map((path) => `${wsBase}${path}?${tokenQuery}`)),
  ];
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
  private connectionOpened = false;
  private consecutiveFailures = 0;
  private maxConsecutiveFailures = 3;
  private activeUrl = "";
  private targetConversationId: number | string | null = null;

  /** Subscribe to incoming WS messages */
  on(handler: WsChatHandler) {
    this.listeners.add(handler);
    return () => {
      this.listeners.delete(handler);
    };
  }

  /** Open the WebSocket connection */
  connect(conversationId?: number | string) {
    if (
      this.ws &&
      (this.ws.readyState === WebSocket.OPEN ||
        this.ws.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    this.intentionallyClosed = false;
    this.connectionOpened = false;
    if (conversationId !== undefined) {
      this.targetConversationId = conversationId;
    }
    const token = getToken();
    if (!token) {
      console.warn("[ChatWS] No auth token - skipping connection");
      this.emit({
        type: "error",
        error: "No authentication token. Please log in again.",
      });
      return;
    }

    const expMs = decodeJwtExpMs(token);
    const expUtc =
      typeof expMs === "number" ? new Date(expMs).toISOString() : "unknown";

    if (isTokenExpired() || (expMs !== null && expMs <= Date.now() + 15000)) {
      console.warn("[ChatWS] Token expired - skipping connection");
      this.emit({
        type: "error",
        error: `Your session expired. Please log in again. Token expiry: ${expUtc}`,
      });
      return;
    }
    const urlCandidates = getWsUrls(token, this.targetConversationId);
    if (urlCandidates.length === 0) {
      this.emit({
        type: "error",
        error: "Chat service URL is not configured.",
      });
      return;
    }

    const openWithFallback = (index: number) => {
      const url = urlCandidates[index];
      this.activeUrl = url;
      console.log(`[ChatWS] Connecting to ${url}`);
      let handshakeTimer: ReturnType<typeof setTimeout> | null = null;

      try {
        this.ws = new WebSocket(url);
      } catch {
        console.warn(`[ChatWS] WebSocket constructor failed for ${url}`);
        if (index < urlCandidates.length - 1) {
          openWithFallback(index + 1);
          return;
        }
        this.scheduleReconnect();
        return;
      }

      handshakeTimer = setTimeout(() => {
        if (
          this.ws &&
          this.ws.readyState !== WebSocket.OPEN &&
          this.ws.readyState !== WebSocket.CLOSING
        ) {
          console.warn(`[ChatWS] Handshake timeout for ${url}`);
          this.ws.close();
        }
      }, 7000);

      this.ws.onopen = () => {
        if (handshakeTimer) clearTimeout(handshakeTimer);
        console.log("[ChatWS] Connected");
        this.connectionOpened = true;
        this.consecutiveFailures = 0;
        this.reconnectDelay = 1000;
        this.startPing();
        this.emit({ type: "connected" });

        this.send({ type: "ping" });
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
        if (handshakeTimer) clearTimeout(handshakeTimer);
        console.log(
          `[ChatWS] Closed on ${this.activeUrl}:`,
          event.code,
          event.reason || "(no reason)",
        );
        this.stopPing();
        this.ws = null;

        // Try the next WS path candidate before counting this as a failed attempt.
        if (
          !this.connectionOpened &&
          !this.intentionallyClosed &&
          index < urlCandidates.length - 1
        ) {
          console.warn(
            `[ChatWS] Handshake failed on ${this.activeUrl}. Trying fallback URL...`,
          );
          openWithFallback(index + 1);
          return;
        }

        // Connection rejected before opening after trying all URL candidates.
        if (!this.connectionOpened && !this.intentionallyClosed) {
          this.consecutiveFailures++;
          console.warn(
            `[ChatWS] Connection rejected (attempt ${this.consecutiveFailures}/${this.maxConsecutiveFailures})`,
          );

          if (this.consecutiveFailures >= this.maxConsecutiveFailures) {
            console.error(
              "[ChatWS] Too many failed attempts - stopping reconnect",
            );
            this.emit({
              type: "error",
              error: isTokenExpired()
                ? "Your session expired. Please log in again."
                : `Chat connection rejected. Last URL: ${this.activeUrl}. Check WS route/domain and token validity.`,
            });
            return;
          }
        }

        if (!this.intentionallyClosed) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = () => {
        console.warn("[ChatWS] Error - will reconnect");
      };
    };

    openWithFallback(0);
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
    this.connectionOpened = false;
    this.activeUrl = "";
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
    console.log(`[ChatWS] Reconnecting in ${this.reconnectDelay}ms...`);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect(this.targetConversationId ?? undefined);
    }, this.reconnectDelay);
    this.reconnectDelay = Math.min(
      this.reconnectDelay * 2,
      this.maxReconnectDelay,
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
