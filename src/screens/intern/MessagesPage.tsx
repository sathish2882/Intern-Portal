import { useEffect, useState, useRef, useCallback } from "react";
import { toast } from "react-toastify";
import { getMeApi } from "../../services/authApi";
import chatSocket, { WsChatMessage } from "../../services/chatSocket";
import {
  FiSend,
  FiSmile,
} from "react-icons/fi";

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

const normalizeMessage = (item: any, conversationId: number): ChatMessage => ({
  id: String(item.message_id),
  chatId: makeChatId(item.conversation_id ?? conversationId),
  senderId: Number(item.sender_id),
  senderName: item.sender_name,
  text: item.content,
  timestamp: new Date(item.created_on).getTime(),
  status: "delivered",
});

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

  const messagesEndRef = useRef<HTMLDivElement>(null);

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
      } catch {
        toast.error("Failed to load conversations");
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
          normalizeMessage(m, activeChat.conversationId)
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
    chatSocket.connect();

    const unsub = chatSocket.on((data: WsChatMessage) => {
      if (data.type === "connected") {
        setWsConnected(true);
      }

      if (data.type === "new_message" && data.message) {
        const msg: ChatMessage = {
          id: data.message.id,
          chatId: makeChatId(Number(data.message.chat_id)),
          senderId: data.message.sender_id,
          senderName: data.message.sender_name,
          text: data.message.text,
          timestamp: new Date(data.message.timestamp).getTime(),
          status: "delivered",
        };

        setMessages((prev) => {
          if (prev.find((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      }
    });

    return () => {
      unsub();
      chatSocket.disconnect();
    };
  }, []);

  // ── Send message ─────────────────
  const sendMessage = useCallback(async () => {
    if (!input.trim() || !activeChat || !myUserId) return;

    const tempId = `tmp_${Date.now()}`;

    const msg: ChatMessage = {
      id: tempId,
      chatId: activeChat.id,
      senderId: myUserId,
      senderName: myName,
      text: input,
      timestamp: Date.now(),
      status: "sending",
    };

    setMessages((prev) => [...prev, msg]);
    setInput("");

    try {
      // WS send
      chatSocket.send({
        type: "send_message",
        conversation_id: activeChat.conversationId,
        text: msg.text,
      });

      // API save
      const res = await messageApi(activeChat.conversationId, msg.text);

      const saved = normalizeMessage(res.data, activeChat.conversationId);

      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempId ? { ...saved, status: "delivered" } : m
        )
      );
    } catch {
      toast.error("Send failed");
    }
  }, [input, activeChat, myUserId, myName]);

  // ── Auto scroll ─────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (loading)   return (
      <div className="flex flex-col items-center justify-center py-32 font-jakarta">
        <div className="loader" />
        <p className="text-sm text-slate mt-4 animate-pulse">Loading dashboard…</p>
      </div>
    )

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
          {conversations.map((c) => (
            <div
              key={c.conversationId}
              onClick={() =>
                setActiveChat({
                  id: makeChatId(c.conversationId),
                  conversationId: c.conversationId,
                  name: c.conversationName,
                })
              }
              className="px-4 py-3 cursor-pointer hover:bg-gray-100 border-b"
            >
              <p className="font-semibold text-sm">
                {c.conversationName}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT */}
      <div className="flex flex-col flex-1 bg-[#e5ddd5]">

        {/* HEADER */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#075E54] text-white">
          <div className="font-semibold">{activeChat?.name}</div>
          <div>{wsConnected ? "🟢" : "🔴"}</div>
        </div>

        {/* MESSAGES */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {messages.map((msg) => {
            const isMe = msg.senderId === myUserId;

            return (
              <div
                key={msg.id}
                className={`flex ${isMe ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`relative max-w-[70%] px-3 py-2 rounded-lg shadow text-sm ${
                    isMe
                      ? "bg-[#dcf8c6] rounded-tr-none"
                      : "bg-white rounded-tl-none"
                  }`}
                >
                  <p>{msg.text}</p>

                  <div className="text-[10px] text-gray-500 text-right mt-1">
                    {new Date(msg.timestamp).toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>
            );
          })}

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