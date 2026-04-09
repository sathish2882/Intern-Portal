import { useEffect, useState, useRef, useCallback } from "react";
import { toast } from "react-toastify";
import { getMeApi } from "../../services/authApi";
import chatSocket, { WsChatMessage } from "../../services/chatSocket";
import { FiLoader, FiSend, FiSmile } from "react-icons/fi";
import { FaUserGroup } from "react-icons/fa6";

import {
  messageApi,
  viewmessageApi,
  getbatchbyid,
} from "../../services/chatApi";

// ── Types ─────────────────────────
interface BatchConversation {
  userId: number;
  batch: number | string;
  conversationId: number;
  conversationName: string;
}

interface ChatMessage {
  id: string;
  chatId: string;
  senderId: number;
  senderName: string;
  text: string;
  timestamp: number;
  status: "sending" | "delivered" | "read" | "failed";
}

interface ChatTarget {
  id: string;
  conversationId: number;
  name: string;
  batch?: number | string;
}

// ── Helpers ───────────────────────
const makeChatId = (id: number) => `conversation_${id}`;

const normalizeConversation = (item: any): BatchConversation => ({
  userId: Number(item.user_id),
  batch: item.batch,
  conversationId: Number(item.conversation_id),
  conversationName: item.conversation_name || "Conversation",
});

const normalizeMessage = (item: any, conversationId: number): ChatMessage => {
  const rawCreatedOn =
    typeof item?.created_on === "string" ? item.created_on : "";
  const clean = rawCreatedOn ? rawCreatedOn.replace(/(\.\d{3})\d+/, "$1") : "";

  return {
    id: String(item?.message_id ?? item?.id ?? `msg_${Date.now()}`),
    chatId: makeChatId(item.conversation_id ?? conversationId),
    senderId: Number(item?.sender_id ?? 0),
    senderName: item?.sender_name ?? "Unknown",
    text: item?.content ?? item?.text ?? "",
    timestamp: clean ? new Date(`${clean}Z`).getTime() : Date.now(),
    status: "delivered",
  };
};

// ═══════════════════════════════════════
const MessagesPage = () => {
  const [conversations, setConversations] = useState<BatchConversation[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeChat, setActiveChat] = useState<ChatTarget | null>(null);

  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");

  const [myUserId, setMyUserId] = useState<number | null>(null);
  const [myName, setMyName] = useState("");

  const [wsConnected, setWsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [wsFailed, setWsFailed] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const groupMessagesByDate = (messages: ChatMessage[]) => {
    const groups: Record<string, ChatMessage[]> = {};

    messages.forEach((msg) => {
      const dateKey = new Date(msg.timestamp).toDateString();

      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }

      groups[dateKey].push(msg);
    });

    return groups;
  };

  const formatDate = (dateStr: string) => {
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    if (dateStr === today) return "Today";
    if (dateStr === yesterday) return "Yesterday";

    return dateStr;
  };

  const groupedMessages = groupMessagesByDate(messages);
  const filteredConversations = conversations.filter((c) =>
    c.conversationName.toLowerCase().includes(search.trim().toLowerCase()),
  );

  // ── Load user + conversation ─────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const me = (await getMeApi()).data;
        setMyUserId(me.user_id);
        setMyName(me.username);

        const res = await getbatchbyid();

        const raw = res.data ? [res.data] : [];
        const normalized = raw.map(normalizeConversation);

        setConversations(normalized);
      } catch (err: any) {
        if (err?.response?.status === 403) {
          setAccessDenied(true);
          toast.error(
            "Access denied: You don't have permission to access chat",
          );
        } else {
          toast.error("Failed to load conversations");
        }
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  // ── Set first chat ─────────────────
  useEffect(() => {
    if (!activeChat && conversations.length > 0) {
      const c = conversations[0];

      setActiveChat({
        id: makeChatId(c.conversationId),
        conversationId: c.conversationId,
        name: c.conversationName,
        batch: c.batch,
      });
    }
  }, [conversations]);

  // ── Load messages ─────────────────
  useEffect(() => {
    if (!activeChat) return;

    const loadMessages = async () => {
      try {
        const res = await viewmessageApi(activeChat.conversationId);
        const data = res.data || [];

        const normalized = data.map((m: any) =>
          normalizeMessage(m, activeChat.conversationId),
        );

        setMessages(normalized);
      } catch {
        toast.error("Failed to load messages");
      }
    };

    loadMessages();
  }, [activeChat]);

  // ── WebSocket ─────────────────────
  useEffect(() => {
    if (!activeChat) return;

    // ✅ connect (global socket)
    setWsConnected(false);
    setWsFailed(false);
    chatSocket.connect(activeChat.conversationId);

    const unsub = chatSocket.on((data: WsChatMessage) => {
      if (data.type === "connected") {
        setWsConnected(true);
        setWsFailed(false);
      }

      if (data.type === "error") {
        setWsConnected(false);
        setWsFailed(true);
        console.warn("[Chat] WebSocket unavailable, falling back to polling");
      }

      if (data.type === "new_message" && data.message) {
        const incomingChatId = Number(
          data.message.chat_id ?? data.message.conversation_id,
        );

        // ✅ IMPORTANT: only update current chat
        if (!incomingChatId || incomingChatId !== activeChat.conversationId) {
          return;
        }

        const msg: ChatMessage = {
          id: String(
            data.message.id ?? data.message.message_id ?? `ws_${Date.now()}`,
          ),
          chatId: makeChatId(incomingChatId),
          senderId: Number(data.message.sender_id ?? 0),
          senderName: data.message.sender_name ?? "Unknown",
          text: data.message.text ?? data.message.content ?? "",
          timestamp: data.message.timestamp
            ? new Date(data.message.timestamp).getTime()
            : Date.now(),
          status: "delivered",
        };

        setMessages((prev) => {
          // ✅ prevent duplicates
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      }
    });

    return () => {
      unsub();
      chatSocket.disconnect();
    };
  }, [activeChat]);

  // ── Polling fallback when WS is down ──────
  useEffect(() => {
    if (!activeChat || wsConnected) {
      // WS is working or no chat — clear polling
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
      return;
    }

    if (!wsFailed) return; // still trying WS

    const poll = async () => {
      try {
        const res = await viewmessageApi(activeChat.conversationId);
        const data = res.data || [];
        const normalized = data.map((m: any) =>
          normalizeMessage(m, activeChat.conversationId),
        );
        setMessages((prev) => {
          // Only update if there are new messages
          if (normalized.length !== prev.length) return normalized;
          const lastNew = normalized[normalized.length - 1];
          const lastOld = prev[prev.length - 1];
          if (lastNew?.id !== lastOld?.id) return normalized;
          return prev;
        });
      } catch {
        // silent — don't spam errors during polling
      }
    };

    pollTimerRef.current = setInterval(poll, 5000);

    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, [activeChat, wsConnected, wsFailed]);

  // ── Send message ─────────────────
  const sendMessage = useCallback(async () => {
    if (!input.trim() || !activeChat || !myUserId) return;

    const messageText = input.trim();
    const tempId = `tmp_${Date.now()}`;

    const msg: ChatMessage = {
      id: tempId,
      chatId: activeChat.id,
      senderId: myUserId,
      senderName: myName,
      text: messageText,
      timestamp: Date.now(),
      status: "sending",
    };

    setMessages((prev) => [...prev, msg]);
    setInput("");

    try {
      // Send via REST API
      const res = await messageApi(activeChat.conversationId, msg.text);

      const saved = normalizeMessage(res.data, activeChat.conversationId);

      // Also try WS if connected (for real-time delivery to others)
      if (chatSocket.isConnected) {
        chatSocket.send({
          type: "send_message",
          conversation_id: activeChat.conversationId,
          text: msg.text,
        });
      }

      setMessages((prev) =>
        prev
          .map((m) =>
            m.id === tempId ? { ...saved, status: "delivered" as const } : m,
          )
          .filter(
            (m, index, arr) =>
              arr.findIndex((candidate) => candidate.id === m.id) === index,
          ),
      );
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempId ? { ...m, status: "failed" as const } : m,
        ),
      );
      toast.error("Send failed");
    }
  }, [input, activeChat, myUserId, myName]);

  // ── Auto scroll ─────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center py-32 font-jakarta">
        <FiLoader className="text-3xl text-blue animate-spin mb-3" />
        <p className="text-sm text-slate animate-pulse">Loading Messages…</p>
      </div>
    );

  if (accessDenied)
    return (
      <div className="flex flex-col items-center justify-center py-32 font-jakarta">
        <p className="text-lg font-semibold text-red-600">Access Denied</p>
        <p className="text-sm text-gray-500 mt-2">
          You don't have permission to access the chat feature (403 Forbidden).
        </p>
        <p className="text-sm text-gray-400 mt-1">
          Please contact your administrator.
        </p>
      </div>
    );

  return (
    <div className="h-[calc(100vh-60px)] flex font-jakarta overflow-hidden">
      {/* LEFT */}
      <div className="w-80 border-r bg-white flex flex-col">
        <div className="p-3 border-b">
          <input
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm"
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredConversations.map((c) => (
            <div
              key={c.conversationId}
              onClick={() =>
                setActiveChat({
                  id: makeChatId(c.conversationId),
                  conversationId: c.conversationId,
                  name: c.conversationName,
                  batch: c.batch,
                })
              }
              className="px-4 py-3 cursor-pointer hover:bg-gray-100 border-b"
            >
              <div className="flex items-center gap-3 px-2 py-3 text-white">
                <div className="font-semibold rounded-full bg-blue w-8 h-8 flex items-center justify-center">
                  <FaUserGroup className="text-white" size={18} />
                </div>
                <span className="text-md text-black font-semibold">
                  {c.conversationName}
                </span>
              </div>
            </div>
          ))}
          {filteredConversations.length === 0 && (
            <div className="px-4 py-6 text-sm text-gray-500">
              No matching conversations
            </div>
          )}
        </div>
      </div>

      {/* RIGHT */}
      <div className="flex flex-col flex-1 bg-[#e5ddd5]">
        {/* HEADER */}
        <div className="flex items-center gap-3 px-4 py-3 bg-[#075E54] text-white">
          <div className="font-semibold rounded-full bg-gray-400 w-8 h-8 flex items-center justify-center">
            <FaUserGroup className="text-blue" size={18} />
          </div>
          <span className="text-md font-semibold">{activeChat?.name}</span>
        </div>

        {/* MESSAGES */}

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {Object.entries(groupedMessages).map(([date, msgs]) => (
            <div key={date}>
              {/* DATE HEADER */}
              <div className="text-center text-sm text-gray-700 my-3">
                {formatDate(date)}
              </div>

              {/* MESSAGES */}
              {msgs.map((msg) => {
                const isMe = msg.senderId === myUserId;

                return (
                  <div
                    key={msg.id}
                    className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`relative pl-1 min-w-[10%] rounded-lg shadow text-sm my-2 ${
                        isMe
                          ? "bg-[#dcf8c6] rounded-tr-none"
                          : "bg-white rounded-tl-none"
                      }`}
                    >
                      {!isMe && (
                        <span className="text-green-700">{msg.senderName}</span>
                      )}

                      <p className="mt-1 pr-1">{msg.text}</p>

                      <div className="text-[10px] text-gray-500 text-right pr-1">
                        {new Date(msg.timestamp).toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}

          <div ref={messagesEndRef} />
        </div>

        {/* INPUT */}
        <div className="flex items-center gap-2 px-3 py-2 bg-[#f0f0f0] rounded-full">
          <button className="text-gray-500">
            <FiSmile size={20} />
          </button>

          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Type a message"
            className="flex-1 bg-white px-4 py-2 rounded-full text-sm outline-none"
          />

          <button
            onClick={sendMessage}
            className="bg-[#075E54] text-white p-2 rounded-full"
          >
            <FiSend size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;
