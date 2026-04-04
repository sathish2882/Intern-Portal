import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { toast } from "react-toastify";
import { getMeApi, getUserByBatchApi } from "../../services/authApi";
import chatSocket, { WsChatMessage } from "../../services/chatSocket";
import {
  FiSearch,
  FiSend,
  FiSmile,
  FiArrowLeft,
  FiUsers,
  FiCheck,
  FiCheckCircle,
  FiMoreVertical,
  FiRefreshCw,
  FiMessageCircle,
  FiWifi,
  FiWifiOff,
} from "react-icons/fi";

// ── Types ──────────────────────────────────────────
interface BatchMember {
  user_id: number;
  username: string;
  email: string;
  tech_stack: string | null;
  status?: number;
}

interface ChatMessage {
  id: string;
  chatId: string;
  senderId: number;
  senderName: string;
  text: string;
  timestamp: number;
  status: "sending" | "sent" | "delivered" | "read" | "failed";
}

type ChatType = "group" | "dm";

interface ChatTarget {
  type: ChatType;
  id: string;
  name: string;
  member?: BatchMember;
}

// ── Storage helpers (offline fallback) ─────────────
const MSG_KEY = "intern_chat_messages";

const loadMessages = (): ChatMessage[] => {
  try {
    const raw = localStorage.getItem(MSG_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveMessages = (msgs: ChatMessage[]) => {
  localStorage.setItem(MSG_KEY, JSON.stringify(msgs));
};

const makeDmChatId = (a: number, b: number) => {
  const [lo, hi] = a < b ? [a, b] : [b, a];
  return `dm_${lo}_${hi}`;
};

const makeGroupChatId = (batchId: number | string) => `group_${batchId}`;

// ── Time helpers ───────────────────────────────────
const formatMsgTime = (ts: number) =>
  new Date(ts).toLocaleTimeString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

const formatDateLabel = (ts: number) => {
  const d = new Date(ts);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

// ── BroadcastChannel (cross-tab real-time) ─────────
let channel: BroadcastChannel | null = null;
try {
  channel = new BroadcastChannel("intern_chat_sync");
} catch {
  /* not supported */
}

// ── Emoji data ─────────────────────────────────────
const QUICK_EMOJIS = ["😀", "😂", "❤️", "👍", "🔥", "🎉", "😎", "🙏", "💯", "✅", "👋", "🤔", "😍", "🚀", "💪", "😊"];

// ════════════════════════════════════════════════════
// Component
// ════════════════════════════════════════════════════
const MessagesPage = () => {
  const [members, setMembers] = useState<BatchMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [batchId, setBatchId] = useState<number | string | null>(null);
  const [myUserId, setMyUserId] = useState<number | null>(null);
  const [myName, setMyName] = useState("");
  const [search, setSearch] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>(loadMessages);
  const [activeChat, setActiveChat] = useState<ChatTarget | null>(null);
  const [input, setInput] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [sendingMsg, setSendingMsg] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Persist messages offline ──
  useEffect(() => {
    saveMessages(messages);
  }, [messages]);

  // ── BroadcastChannel sync ──
  useEffect(() => {
    if (!channel) return;
    const handler = (e: MessageEvent) => {
      if (e.data?.type === "new_message") {
        setMessages((prev) => {
          if (prev.find((m) => m.id === e.data.message.id)) return prev;
          return [...prev, e.data.message];
        });
      }
    };
    channel.addEventListener("message", handler);
    return () => channel!.removeEventListener("message", handler);
  }, []);

  // ── Storage sync ──
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === MSG_KEY) setMessages(loadMessages());
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  // ── WebSocket connection & incoming messages ──
  useEffect(() => {
    chatSocket.connect();

    const unsub = chatSocket.on((data: WsChatMessage) => {
      if (data.type === "connected") {
        setWsConnected(true);
      } else if (data.type === "error") {
        setWsConnected(false);
      } else if (data.type === "new_message" && data.message) {
        const incoming: ChatMessage = {
          id: data.message.id,
          chatId: data.message.chat_id,
          senderId: data.message.sender_id,
          senderName: data.message.sender_name,
          text: data.message.text,
          timestamp: new Date(data.message.timestamp).getTime(),
          status: "delivered",
        };
        setMessages((prev) => {
          if (prev.find((m) => m.id === incoming.id)) return prev;
          return [...prev, incoming];
        });
        try {
          channel?.postMessage({ type: "new_message", message: incoming });
        } catch { /* ignore */ }
      } else if (data.type === "message_sent" && data.message) {
        // Confirm a message we sent
        setMessages((prev) =>
          prev.map((m) =>
            m.id === data.message!.id ? { ...m, status: "delivered" } : m
          )
        );
      }
    });

    return () => {
      unsub();
      chatSocket.disconnect();
    };
  }, []);

  // ── Load members ──
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const meRes = await getMeApi();
        const me = meRes.data;
        setMyUserId(me.user_id);
        setMyName(me.username || "Me");
        setBatchId(me.batch);

        if (!me.batch) {
          toast.info("No batch assigned yet");
          setLoading(false);
          return;
        }

        const res = await getUserByBatchApi(me.batch);
        const raw = res.data as any[];
        setMembers(
          Array.isArray(raw)
            ? raw.map((u: any) => ({
                user_id: u.user_id,
                username: u.username ?? u.name ?? "Unknown",
                email: u.email ?? "",
                tech_stack: u.tech_stack ?? null,
                status: u.status,
              }))
            : []
        );
      } catch (err: any) {
        console.error("Failed to load batch members:", err);
        toast.error("Failed to load batch members");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // ── Auto-scroll ──
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeChat]);

  useEffect(() => {
    if (activeChat) inputRef.current?.focus();
  }, [activeChat]);

  // ── Chat list ──
  const chatList = useMemo((): ChatTarget[] => {
    const list: ChatTarget[] = [];

    if (batchId) {
      list.push({
        type: "group",
        id: makeGroupChatId(batchId),
        name: `Batch ${batchId} Group`,
      });
    }

    members
      .filter((m) => m.user_id !== myUserId)
      .forEach((m) => {
        if (myUserId) {
          list.push({
            type: "dm",
            id: makeDmChatId(myUserId, m.user_id),
            name: m.username,
            member: m,
          });
        }
      });

    return list;
  }, [members, myUserId, batchId]);

  const filteredChats = useMemo(() => {
    if (!search.trim()) return chatList;
    const q = search.toLowerCase();
    return chatList.filter((c) => c.name.toLowerCase().includes(q));
  }, [chatList, search]);

  const lastMessageMap = useMemo(() => {
    const map: Record<string, ChatMessage> = {};
    messages.forEach((m) => {
      if (!map[m.chatId] || m.timestamp > map[m.chatId].timestamp) map[m.chatId] = m;
    });
    return map;
  }, [messages]);

  const unreadMap = useMemo(() => {
    const map: Record<string, number> = {};
    messages.forEach((m) => {
      if (m.senderId !== myUserId && m.status !== "read") {
        map[m.chatId] = (map[m.chatId] || 0) + 1;
      }
    });
    return map;
  }, [messages, myUserId]);

  const chatMessages = useMemo(
    () => (activeChat ? messages.filter((m) => m.chatId === activeChat.id).sort((a, b) => a.timestamp - b.timestamp) : []),
    [messages, activeChat]
  );

  // ── Mark as read ──
  useEffect(() => {
    if (!activeChat || !myUserId) return;
    setMessages((prev) =>
      prev.map((m) =>
        m.chatId === activeChat.id && m.senderId !== myUserId && m.status !== "read" ? { ...m, status: "read" } : m
      )
    );
  }, [activeChat, myUserId, messages.length]);

  // ── Send message ──
  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || !activeChat || !myUserId) return;

      const msgId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const msg: ChatMessage = {
        id: msgId,
        chatId: activeChat.id,
        senderId: myUserId,
        senderName: myName,
        text: text.trim(),
        timestamp: Date.now(),
        status: "sending",
      };

      setMessages((prev) => [...prev, msg]);
      setInput("");
      setShowEmoji(false);
      setSendingMsg(true);

      // Send via WebSocket
      if (chatSocket.isConnected) {
        chatSocket.send({
          type: "send_message",
          chat_id: activeChat.id,
          text: text.trim(),
          sender_id: myUserId,
          sender_name: myName,
        });
        // Status will update via "message_sent" WS event; fallback to "sent" after a brief delay
        setTimeout(() => {
          setMessages((prev) =>
            prev.map((m) => (m.id === msgId && m.status === "sending" ? { ...m, status: "sent" } : m))
          );
        }, 3000);
      } else {
        // Offline — save locally and mark as sent
        setMessages((prev) =>
          prev.map((m) => (m.id === msgId ? { ...m, status: "sent" } : m))
        );
      }

      setSendingMsg(false);

      try {
        channel?.postMessage({ type: "new_message", message: { ...msg, status: "delivered" } });
      } catch {
        /* ignore */
      }
    },
    [activeChat, myUserId, myName]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const openChat = (chat: ChatTarget) => {
    setActiveChat(chat);
    setMobileShowChat(true);
    setShowEmoji(false);
  };

  const goBack = () => {
    setMobileShowChat(false);
    setActiveChat(null);
    setShowEmoji(false);
  };

  const sortedChats = useMemo(
    () =>
      [...filteredChats].sort((a, b) => {
        const aTime = lastMessageMap[a.id]?.timestamp ?? 0;
        const bTime = lastMessageMap[b.id]?.timestamp ?? 0;
        return bTime - aTime;
      }),
    [filteredChats, lastMessageMap]
  );

  const groupedMessages = useMemo(() => {
    const groups: { label: string; messages: ChatMessage[] }[] = [];
    let currentLabel = "";
    chatMessages.forEach((msg) => {
      const label = formatDateLabel(msg.timestamp);
      if (label !== currentLabel) {
        currentLabel = label;
        groups.push({ label, messages: [msg] });
      } else {
        groups[groups.length - 1].messages.push(msg);
      }
    });
    return groups;
  }, [chatMessages]);

  // ── Render ───────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-60px)] font-jakarta">
        <div className="loader" />
        <p className="text-sm text-slate mt-4 animate-pulse">Loading messages…</p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-60px)] flex font-jakarta text-navy animate-fadeUp overflow-hidden">
      {/* ═══════ LEFT: Chat List ═══════ */}
      <div
        className={`flex flex-col border-r border-line bg-white w-full lg:w-[360px] lg:flex-shrink-0 ${
          mobileShowChat ? "hidden lg:flex" : "flex"
        }`}
      >
        {/* Header */}
        <div className="px-4 pt-4 pb-3 border-b border-line">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <FiMessageCircle className="text-primary text-xl" />
              <h1 className="text-lg font-extrabold text-navy">Messages</h1>
            </div>
            <div className="flex items-center gap-1.5">
              {/* WebSocket status badge */}
              <div
                className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full ${
                  wsConnected
                    ? "bg-green-50 text-green-600"
                    : "bg-amber-50 text-amber-600"
                }`}
              >
                {wsConnected ? <FiWifi className="text-[10px]" /> : <FiWifiOff className="text-[10px]" />}
                {wsConnected ? "Connected" : "Offline"}
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-mist text-sm" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search conversations…"
              className="w-full border border-line rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-lightbg"
            />
          </div>
        </div>

        {/* Chat items */}
        <div className="flex-1 overflow-y-auto">
          {sortedChats.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-4">
              <FiMessageCircle className="text-5xl text-primary/20 mb-3" />
              <p className="text-sm text-mist">No conversations yet.</p>
              <p className="text-xs text-mist mt-1">
                Start a chat with your batch mates.
              </p>
            </div>
          ) : (
            sortedChats.map((chat) => {
              const lastMsg = lastMessageMap[chat.id];
              const unread = unreadMap[chat.id] || 0;
              const isActive = activeChat?.id === chat.id;
              const initial = chat.type === "group" ? "G" : chat.name.charAt(0).toUpperCase();
              return (
                <button
                  key={chat.id}
                  onClick={() => openChat(chat)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors border-b border-line/50 ${
                    isActive ? "bg-primary/5" : "hover:bg-lightbg/60"
                  }`}
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div
                      className={`w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                        chat.type === "group"
                          ? "bg-gradient-to-br from-primary to-primary/80"
                          : "bg-gradient-to-br from-navy to-navy3"
                      }`}
                    >
                      {chat.type === "group" ? <FiUsers className="text-base" /> : initial}
                    </div>
                    {/* Online dot */}
                    {chat.member?.status === 1 && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-navy truncate">{chat.name}</span>
                      {lastMsg && (
                        <span className="text-[10px] text-mist ml-2 flex-shrink-0">
                          {formatMsgTime(lastMsg.timestamp)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <p className="text-xs text-slate truncate max-w-[200px]">
                        {lastMsg
                          ? `${lastMsg.senderId === myUserId ? "You: " : chat.type === "group" ? `${lastMsg.senderName}: ` : ""}${lastMsg.text}`
                          : chat.type === "group"
                          ? "Batch group chat"
                          : chat.member?.tech_stack ?? "Start a conversation"}
                      </p>
                      {unread > 0 && (
                            <span className="ml-2 min-w-[20px] h-5 flex items-center justify-center bg-primary text-white text-[10px] font-bold rounded-full px-1.5">
                          {unread}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ═══════ RIGHT: Chat Window ═══════ */}
      <div
        className={`flex flex-col flex-1 bg-[#e5ddd5] ${mobileShowChat ? "flex" : "hidden lg:flex"}`}
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23c8c3bc' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
        }}
      >
        {!activeChat ? (
          /* Empty state */
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
            <div className="w-24 h-24 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center mb-5 shadow-sm">
              <FiMessageCircle className="text-5xl text-primary" />
            </div>
            <h2 className="text-xl font-extrabold text-navy mb-2">M-Guru Chat</h2>
            <p className="text-sm text-slate max-w-sm mb-4">
              Real-time messaging with your batch mates. Select a conversation to get started.
            </p>
            <div className="mt-6 flex flex-col gap-2 text-left max-w-xs">
              <div className="flex items-start gap-2.5 bg-white/60 backdrop-blur-sm rounded-xl px-4 py-3">
                <span className="text-lg">🔐</span>
                <div>
                  <p className="text-xs font-bold text-navy">Secure</p>
                  <p className="text-[10px] text-slate">Messages routed through your backend</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5 bg-white/60 backdrop-blur-sm rounded-xl px-4 py-3">
                <span className="text-lg">⚡</span>
                <div>
                  <p className="text-xs font-bold text-navy">Real-time</p>
                  <p className="text-[10px] text-slate">Instant delivery via WebSocket</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5 bg-white/60 backdrop-blur-sm rounded-xl px-4 py-3">
                <span className="text-lg">📱</span>
                <div>
                  <p className="text-xs font-bold text-navy">Cross-platform</p>
                  <p className="text-[10px] text-slate">Chat from any device with a browser</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="flex items-center gap-3 px-4 py-3 bg-navy text-white">
              <button onClick={goBack} className="lg:hidden p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                <FiArrowLeft className="text-lg" />
              </button>

              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                  activeChat.type === "group"
                    ? "bg-gradient-to-br from-primary to-primary/80"
                    : "bg-white/20"
                }`}
              >
                {activeChat.type === "group" ? <FiUsers className="text-base" /> : activeChat.name.charAt(0).toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">{activeChat.name}</p>
                <p className="text-[11px] text-white/60">
                  {activeChat.type === "group"
                    ? `${members.length} members`
                    : activeChat.member?.status === 1
                    ? "● Online"
                    : "Offline"}
                  {wsConnected && " · Live"}
                </p>
              </div>

              {activeChat.member?.tech_stack && (
                <span className="text-[10px] font-bold text-white bg-white/15 px-2 py-0.5 rounded-full hidden sm:inline-block">
                  {activeChat.member.tech_stack}
                </span>
              )}

              <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <FiMoreVertical />
              </button>
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 space-y-1">
              {chatMessages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="bg-white/70 backdrop-blur-sm rounded-xl px-5 py-4 shadow-sm">
                    <FiMessageCircle className="text-3xl text-primary mx-auto mb-2" />
                    <p className="text-sm text-navy font-semibold">No messages yet</p>
                    <p className="text-xs text-slate mt-0.5">Send a message to start the conversation</p>
                  </div>
                </div>
              )}

              {groupedMessages.map((group) => (
                <div key={group.label}>
                  <div className="flex items-center justify-center my-3">
                    <span className="text-[10px] font-semibold text-slate bg-white/90 backdrop-blur-sm px-3 py-1 rounded-md shadow-sm">
                      {group.label}
                    </span>
                  </div>

                  {group.messages.map((msg, i) => {
                    const isMe = msg.senderId === myUserId;
                    const showName =
                      activeChat.type === "group" &&
                      !isMe &&
                      (i === 0 || group.messages[i - 1]?.senderId !== msg.senderId);

                    return (
                      <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"} mb-1`}>
                        <div
                          className={`relative max-w-[80%] sm:max-w-[65%] rounded-lg px-3 py-1.5 shadow-sm ${
                            isMe
                              ? "bg-[#dcf8c6] text-navy rounded-tr-none"
                              : "bg-white text-navy rounded-tl-none"
                          }`}
                        >
                          {/* Tail */}
                          <div
                            className={`absolute top-0 w-2 h-3 ${
                              isMe
                                ? "-right-1.5 text-[#dcf8c6]"
                                : "-left-1.5 text-white"
                            }`}
                            style={{
                              clipPath: isMe
                                ? "polygon(0 0, 100% 0, 0 100%)"
                                : "polygon(100% 0, 0 0, 100% 100%)",
                              backgroundColor: isMe ? "#dcf8c6" : "white",
                            }}
                          />

                          {showName && (
                            <p className="text-[11px] font-bold text-primary mb-0.5">{msg.senderName}</p>
                          )}
                          <p className="text-[13.5px] leading-relaxed whitespace-pre-wrap break-words pr-14">
                            {msg.text}
                          </p>
                          <div className="absolute bottom-1 right-2 flex items-center gap-0.5">
                            <span className="text-[9px] text-slate/60">{formatMsgTime(msg.timestamp)}</span>
                            {isMe && (
                              <span className="ml-0.5">
                                {msg.status === "sending" ? (
                                  <FiRefreshCw className="text-[10px] text-slate/40 animate-spin" />
                                ) : msg.status === "read" ? (
                                  <FiCheckCircle className="text-[10px] text-primary" />
                                ) : msg.status === "delivered" ? (
                                  <span className="flex">
                                    <FiCheck className="text-[10px] text-primary" />
                                    <FiCheck className="text-[10px] text-primary -ml-1" />
                                  </span>
                                ) : msg.status === "failed" ? (
                                  <span className="text-[10px] text-red-500">!</span>
                                ) : (
                                  <FiCheck className="text-[10px] text-slate/50" />
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Emoji picker */}
            {showEmoji && (
              <div className="px-4 pb-1">
                <div className="bg-white border border-line rounded-xl p-3 shadow-lg flex flex-wrap gap-1.5">
                  {QUICK_EMOJIS.map((e) => (
                    <button
                      key={e}
                      onClick={() => {
                        setInput((prev) => prev + e);
                        inputRef.current?.focus();
                      }}
                      className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 text-xl transition-colors"
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input bar */}
            <form
              onSubmit={handleSubmit}
              className="flex items-center gap-2 px-3 sm:px-4 py-2.5 bg-[#f0f0f0]"
            >
              <button
                type="button"
                onClick={() => setShowEmoji((v) => !v)}
                className={`p-2.5 rounded-full transition-colors ${
                  showEmoji ? "bg-primary/10 text-primary" : "text-[#54656f] hover:bg-white"
                }`}
              >
                <FiSmile className="text-xl" />
              </button>

              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message"
                maxLength={2000}
                className="flex-1 bg-white border-none rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-sm"
              />

              <button
                type="submit"
                disabled={!input.trim() || sendingMsg}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-navy text-white hover:bg-navy/90 disabled:opacity-30 transition-colors shadow-sm"
              >
                <FiSend className="text-base" />
              </button>
            </form>
          </>
        )}
      </div>


    </div>
  );
};

export default MessagesPage;
