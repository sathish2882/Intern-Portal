import { useEffect, useState, useRef, useCallback } from "react";
import { toast } from "react-toastify";
import { getMeApi } from "../../services/authApi";
import chatSocket, { WsChatMessage } from "../../services/chatSocket";
import {
  FiLoader,
  FiMessageSquare,
  FiPlusSquare,
  FiSend,
  FiSmile,
  FiUsers,
} from "react-icons/fi";
import { FaUserGroup } from "react-icons/fa6";
import ProtectedRoute from "../../components/ui/ProtectedRoute";

import {
  addGroupMemberApi,
  createGroupApi,
  deleteGroupApi,
  getBatchUsersForChatApi,
  getGroupMembersApi,
  messageApi,
  removeGroupMemberApi,
  viewmessageApi,
  getGroupsApi,
} from "../../services/chatApi";
import { getAllMentorsApi } from "../../services/adminApi";

import AdminPortalShell from "../../components/layout/AdminPortalShell";

interface BatchConversation {
  userId: number;
  batch: number | string;
  conversationId: number;
  conversationName: string;
  memberCount: number;
  createdOn: string;
  updatedOn?: string;
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

interface GroupMember {
  userId: number;
  username: string;
  email?: string;
  batch?: number | string;
}

interface SelectableMemberOption {
  userId: number;
  username: string;
  email?: string;
  batch?: number | string;
  techStack?: string;
}

type AdminMessagesMenuKey = "chat" | "addGroup" | "groupMembers";

const makeChatId = (id: number) => `conversation_${id}`;

const normalizeConversation = (item: any) => ({
  userId: Number(item.user_id),
  batch: item.batch,
  conversationId: Number(item.conversation_id),
  conversationName: item.name || "Conversation",
  memberCount: item.member_count || 0,
  createdOn: item.created_on || "",
  updatedOn: item.updated_on || "",
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

const normalizeGroupMember = (item: any): GroupMember => {
  const userId = Number(item?.user_id ?? item?.id ?? item?.user?.user_id ?? 0);
  return {
    userId,
    username:
      item?.username ??
      item?.name ??
      item?.user_name ??
      item?.user?.username ??
      `User ${userId}`,
    email: item?.email ?? item?.user?.email ?? "",
    batch: item?.batch ?? item?.user?.batch,
  };
};

const normalizeSelectableMember = (item: any): SelectableMemberOption => {
  const userId = Number(item?.user_id ?? item?.id ?? item?.user?.user_id ?? 0);
  return {
    userId,
    username:
      item?.username ??
      item?.name ??
      item?.user_name ??
      item?.user?.username ??
      `User ${userId}`,
    email: item?.email ?? item?.user?.email ?? "",
    batch: item?.batch ?? item?.user?.batch,
    techStack: item?.tech_stack ?? item?.user?.tech_stack ?? "",
  };
};

const AdminMessagesPage = () => {
  const [activeMenu, setActiveMenu] = useState<AdminMessagesMenuKey>("chat");
  const [groups, setGroups] = useState<BatchConversation[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeChat, setActiveChat] = useState<ChatTarget | null>(null);

  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [newConversationName, setNewConversationName] = useState("");
  const [newBatch, setNewBatch] = useState<number | "">("");
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [deletingGroupId, setDeletingGroupId] = useState<number | null>(null);
  const [selectedMembersGroupId, setSelectedMembersGroupId] = useState<
    number | ""
  >("");
  const [batchUsers, setBatchUsers] = useState<SelectableMemberOption[]>([]);
  const [allMentors, setAllMentors] = useState<SelectableMemberOption[]>([]);
  const [selectedBatchUserId, setSelectedBatchUserId] = useState<number | "">(
    "",
  );
  const [selectedMentorId, setSelectedMentorId] = useState<number | "">("");
  const [memberOptionsLoading, setMemberOptionsLoading] = useState(false);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [addingBatchUser, setAddingBatchUser] = useState(false);
  const [addingMentor, setAddingMentor] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState<number | null>(null);

  const [myUserId, setMyUserId] = useState<number | null>(null);
  const [myName, setMyName] = useState("");

  const [wsConnected, setWsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [wsFailed, setWsFailed] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const groupMessagesByDate = (chatMessages: ChatMessage[]) => {
    const grouped: Record<string, ChatMessage[]> = {};

    chatMessages.forEach((msg) => {
      const dateKey = new Date(msg.timestamp).toDateString();

      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }

      grouped[dateKey].push(msg);
    });

    return grouped;
  };

  const formatDate = (dateStr: string) => {
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    if (dateStr === today) return "Today";
    if (dateStr === yesterday) return "Yesterday";

    return dateStr;
  };

  const groupedMessages = groupMessagesByDate(messages);
  const filteredGroups = groups.filter((group) =>
    group.conversationName.toLowerCase().includes(search.toLowerCase()),
  );
  const selectedMembersGroup =
    groups.find((group) => group.conversationId === selectedMembersGroupId) ??
    null;
  const selectedGroupBatch = Number(selectedMembersGroup?.batch ?? 0);
  const activeMemberIds = new Set(groupMembers.map((member) => member.userId));
  const availableBatchUsers = batchUsers.filter(
    (user) => !activeMemberIds.has(user.userId),
  );
  const availableMentors = allMentors
    .filter((mentor) => Number(mentor.batch) === selectedGroupBatch)
    .filter((mentor) => !activeMemberIds.has(mentor.userId));

  const menuItems = [
    { key: "chat", label: "Chat", icon: FiMessageSquare },
    { key: "addGroup", label: "Groups", icon: FiPlusSquare },
    { key: "groupMembers", label: "Group Members", icon: FiUsers },
  ] as const;

  const loadGroups = useCallback(async () => {
    const res = await getGroupsApi();
    const raw = Array.isArray(res.data) ? res.data : res.data ? [res.data] : [];
    const normalized = raw.map(normalizeConversation);
    setGroups(normalized);
    return normalized;
  }, []);

  const loadGroupMembers = useCallback(async (conversationId: number) => {
    setMembersLoading(true);
    try {
      const res = await getGroupMembersApi(conversationId);
      const raw = Array.isArray(res.data)
        ? res.data
        : res.data
          ? [res.data]
          : [];
      const normalized = raw
        .map(normalizeGroupMember)
        .filter(
          (member) => Number.isFinite(member.userId) && member.userId > 0,
        );
      setGroupMembers(normalized);
    } catch {
      toast.error("Failed to load group members");
      setGroupMembers([]);
    } finally {
      setMembersLoading(false);
    }
  }, []);

  const loadMentors = useCallback(async () => {
    try {
      const res = await getAllMentorsApi();
      const raw = Array.isArray(res.data) ? res.data : res.data ? [res.data] : [];
      const normalized = raw
        .map(normalizeSelectableMember)
        .filter((mentor) => Number.isFinite(mentor.userId) && mentor.userId > 0);
      setAllMentors(normalized);
    } catch {
      toast.error("Failed to load mentors");
      setAllMentors([]);
    }
  }, []);

  const loadBatchUsersForGroup = useCallback(async (batchId: number) => {
    if (!Number.isInteger(batchId) || batchId <= 0) {
      setBatchUsers([]);
      return;
    }

    setMemberOptionsLoading(true);
    try {
      const res = await getBatchUsersForChatApi(batchId);
      const raw = Array.isArray(res.data) ? res.data : res.data ? [res.data] : [];
      const normalized = raw
        .map(normalizeSelectableMember)
        .filter((user) => Number.isFinite(user.userId) && user.userId > 0);
      setBatchUsers(normalized);
    } catch {
      toast.error("Failed to load users by batch");
      setBatchUsers([]);
    } finally {
      setMemberOptionsLoading(false);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const me = (await getMeApi()).data;
        setMyUserId(me.user_id);
        setMyName(me.username);
        await Promise.all([loadGroups(), loadMentors()]);
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
  }, [loadGroups, loadMentors]);

  useEffect(() => {
    if (!activeChat && groups.length > 0) {
      const c = groups[0];
      setActiveChat({
        id: makeChatId(c.conversationId),
        conversationId: c.conversationId,
        name: c.conversationName,
        batch: c.batch,
      });
    }
  }, [groups, activeChat]);

  useEffect(() => {
    if (groups.length === 0) {
      setSelectedMembersGroupId("");
      setGroupMembers([]);
      return;
    }

    const hasSelectedGroup = groups.some(
      (group) => group.conversationId === selectedMembersGroupId,
    );

    if (!hasSelectedGroup) {
      setSelectedMembersGroupId(groups[0].conversationId);
    }
  }, [groups, selectedMembersGroupId]);

  useEffect(() => {
    if (activeMenu !== "groupMembers" || !selectedMembersGroupId) return;
    loadGroupMembers(selectedMembersGroupId);
  }, [activeMenu, selectedMembersGroupId, loadGroupMembers]);

  useEffect(() => {
    if (activeMenu !== "groupMembers") return;
    if (!Number.isInteger(selectedGroupBatch) || selectedGroupBatch <= 0) {
      setBatchUsers([]);
      return;
    }

    loadBatchUsersForGroup(selectedGroupBatch);
  }, [activeMenu, selectedGroupBatch, loadBatchUsersForGroup]);

  useEffect(() => {
    if (availableBatchUsers.length === 0) {
      setSelectedBatchUserId("");
      return;
    }

    const isSelectedAvailable = availableBatchUsers.some(
      (user) => user.userId === selectedBatchUserId,
    );

    if (!isSelectedAvailable) {
      setSelectedBatchUserId(availableBatchUsers[0].userId);
    }
  }, [availableBatchUsers, selectedBatchUserId]);

  useEffect(() => {
    if (availableMentors.length === 0) {
      setSelectedMentorId("");
      return;
    }

    const isSelectedAvailable = availableMentors.some(
      (mentor) => mentor.userId === selectedMentorId,
    );

    if (!isSelectedAvailable) {
      setSelectedMentorId(availableMentors[0].userId);
    }
  }, [availableMentors, selectedMentorId]);

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

  useEffect(() => {
    if (!activeChat) return;

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

  useEffect(() => {
    if (!activeChat || wsConnected) {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
      return;
    }

    if (!wsFailed) return;

    const poll = async () => {
      try {
        const res = await viewmessageApi(activeChat.conversationId);
        const data = res.data || [];
        const normalized = data.map((m: any) =>
          normalizeMessage(m, activeChat.conversationId),
        );
        setMessages((prev) => {
          if (normalized.length !== prev.length) return normalized;
          const lastNew = normalized[normalized.length - 1];
          const lastOld = prev[prev.length - 1];
          if (lastNew?.id !== lastOld?.id) return normalized;
          return prev;
        });
      } catch {
        toast.error("Failed to load messages");
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
      const res = await messageApi(activeChat.conversationId, msg.text);
      const saved = normalizeMessage(res.data, activeChat.conversationId);

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

  const handleCreateGroup = async () => {
    const conversationName = newConversationName.trim();
    const batchNumber = Number(newBatch);

    if (!conversationName) {
      toast.error("Conversation name is required");
      return;
    }
    if (!Number.isInteger(batchNumber) || batchNumber <= 0) {
      toast.error("Please enter a valid batch number");
      return;
    }

    setCreatingGroup(true);
    try {
      const res = await createGroupApi(conversationName, batchNumber);
      const created = normalizeConversation(res.data);
      await loadGroups();
      setActiveChat({
        id: makeChatId(created.conversationId),
        conversationId: created.conversationId,
        name: created.conversationName,
        batch: created.batch,
      });
      setNewConversationName("");
      setNewBatch("");
      toast.success("Group created successfully");
    } catch {
      toast.error("Failed to create group");
    } finally {
      setCreatingGroup(false);
    }
  };

  const handleDeleteGroup = async (conversationId: number) => {
    const targetGroup = groups.find(
      (group) => group.conversationId === conversationId,
    );
    const confirmed = window.confirm(
      `Delete group "${targetGroup?.conversationName ?? "this group"}"?`,
    );
    if (!confirmed) return;

    setDeletingGroupId(conversationId);
    try {
      await deleteGroupApi(conversationId);
      const updatedGroups = await loadGroups();

      if (activeChat?.conversationId === conversationId) {
        const fallback = updatedGroups[0];
        if (fallback) {
          setActiveChat({
            id: makeChatId(fallback.conversationId),
            conversationId: fallback.conversationId,
            name: fallback.conversationName,
            batch: fallback.batch,
          });
        } else {
          setActiveChat(null);
          setMessages([]);
        }
      }

      toast.success("Group deleted successfully");
    } catch {
      toast.error("Failed to delete group");
    } finally {
      setDeletingGroupId(null);
    }
  };

  const handleAddMember = async (
    userId: number,
    source: "batch-user" | "mentor",
  ) => {
    if (!selectedMembersGroupId) {
      toast.error("Please select a group");
      return;
    }

    if (!Number.isInteger(userId) || userId <= 0) {
      toast.error("Please select a valid user");
      return;
    }

    if (source === "batch-user") {
      setAddingBatchUser(true);
    } else {
      setAddingMentor(true);
    }

    try {
      await addGroupMemberApi(selectedMembersGroupId, userId);
      await Promise.all([
        loadGroupMembers(selectedMembersGroupId),
        loadGroups(),
        loadBatchUsersForGroup(selectedGroupBatch),
      ]);
      toast.success("Member added successfully");
    } catch {
      toast.error("Failed to add member");
    } finally {
      if (source === "batch-user") {
        setAddingBatchUser(false);
      } else {
        setAddingMentor(false);
      }
    }
  };

  const handleRemoveMember = async (userId: number) => {
    if (!selectedMembersGroupId) {
      toast.error("Please select a group");
      return;
    }

    const confirmed = window.confirm(`Remove user ${userId} from this group?`);
    if (!confirmed) return;

    setRemovingMemberId(userId);
    try {
      await removeGroupMemberApi(selectedMembersGroupId, userId);
      await Promise.all([
        loadGroupMembers(selectedMembersGroupId),
        loadGroups(),
        loadBatchUsersForGroup(selectedGroupBatch),
      ]);
      toast.success("Member removed successfully");
    } catch {
      toast.error("Failed to remove member");
    } finally {
      setRemovingMemberId(null);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <AdminPortalShell title="Feedback" hideNav>
      <ProtectedRoute role="1">
        <div className="flex flex-col md:flex-row h-[calc(100vh-170px)] md:h-[70vh] font-syne overflow-hidden bg-abg rounded-xl shadow-lg border border-white/10">
          <div className="w-full md:w-60 border-b md:border-b-0 md:border-r border-white/10 bg-abg2 p-2 md:p-3 flex md:flex-col gap-2 overflow-x-auto md:overflow-x-visible">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeMenu === item.key;

              return (
                <button
                  key={item.key}
                  onClick={() => setActiveMenu(item.key)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-left whitespace-nowrap transition-colors ${
                    isActive
                      ? "bg-golddim text-goldtxt border border-goldtxt/30"
                      : "text-adark hover:bg-abg3 border border-transparent"
                  }`}
                >
                  <Icon size={18} />
                  <span className="font-semibold text-sm">{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex-1 bg-abg min-h-0">
            {activeMenu === "chat" && (
              <div className="flex flex-col md:flex-row h-full">
                <div className="w-full md:w-80 h-[34vh] md:h-full border-b md:border-b-0 md:border-r border-white/10 bg-abg2 flex flex-col">
                  <div className="p-3 border-b border-white/10">
                    <input
                      placeholder="Search"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full border border-white/10 rounded px-3 py-2 text-sm bg-abg3 text-adark focus:outline-none focus:ring-2 focus:ring-goldtxt"
                    />
                  </div>

                  <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {filteredGroups.map((group) => (
                      <div
                        key={group.conversationId}
                        onClick={() =>
                          setActiveChat({
                            id: makeChatId(group.conversationId),
                            conversationId: group.conversationId,
                            name: group.conversationName,
                            batch: group.batch,
                          })
                        }
                        className={`cursor-pointer ${
                          activeChat?.conversationId === group.conversationId
                            ? "bg-abg3"
                            : "hover:bg-abg3"
                        } px-2 py-2 transition-colors`}
                      >
                        <div className="flex items-center gap-3 px-2 py-2">
                          <div className="font-semibold rounded-full bg-blue w-8 h-8 flex items-center justify-center">
                            <FaUserGroup className="text-white" size={18} />
                          </div>
                          <span className="text-md text-adark font-semibold">
                            {group.conversationName}
                          </span>
                        </div>
                      </div>
                    ))}
                    {filteredGroups.length === 0 && (
                      <div className="px-4 py-6 text-sm text-amuted">
                        No matching groups
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col flex-1 min-h-0 bg-abg">
                  <div className="flex items-center gap-3 px-3 sm:px-4 py-3 bg-golddim text-goldtxt border-b border-white/10">
                    <div className="font-semibold rounded-full bg-blue w-8 h-8 flex items-center justify-center">
                      <FaUserGroup className="text-white" size={18} />
                    </div>
                    <span className="text-md font-semibold">
                      {activeChat?.name}
                    </span>
                  </div>

                  <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2 custom-scrollbar">
                    {loading && (
                      <div className="flex flex-col items-center justify-center py-16">
                        <FiLoader className="text-3xl text-blue animate-spin mb-3" />
                        <p className="text-sm text-amuted animate-pulse">
                          Loading Messages...
                        </p>
                      </div>
                    )}
                    {accessDenied && (
                      <div className="flex flex-col items-center justify-center py-16">
                        <p className="text-lg font-semibold text-adanger">
                          Access Denied
                        </p>
                        <p className="text-sm text-amuted mt-2">
                          You don't have permission to access the chat feature
                          (403 Forbidden).
                        </p>
                        <p className="text-sm text-amuted mt-1">
                          Please contact your administrator.
                        </p>
                      </div>
                    )}
                    {!loading &&
                      !accessDenied &&
                      Object.entries(groupedMessages).map(([date, msgs]) => (
                        <div key={date}>
                          <div className="text-center text-xs text-amuted my-3 font-semibold">
                            {formatDate(date)}
                          </div>
                          {msgs.map((msg) => {
                            const isMe = msg.senderId === myUserId;
                            return (
                              <div
                                key={msg.id}
                                className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                              >
                                <div
                                  className={`relative pl-1 min-w-[10%] rounded-lg shadow text-sm my-2 max-w-[85%] sm:max-w-[70%] ${
                                    isMe
                                      ? "bg-goldtxt/10 border border-goldtxt text-goldtxt rounded-tr-none"
                                      : "bg-abg3 border border-white/10 text-adark rounded-tl-none"
                                  }`}
                                >
                                  {!isMe && (
                                    <span className="text-blue font-bold">
                                      {msg.senderName}
                                    </span>
                                  )}
                                  <p className="mt-1 pr-1 break-words">
                                    {msg.text}
                                  </p>
                                  <div className="text-[10px] text-amuted text-right pr-1">
                                    {new Date(msg.timestamp).toLocaleTimeString(
                                      "en-IN",
                                      {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      },
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

                  <div className="flex items-center gap-2 px-2 sm:px-3 py-2 bg-abg2 border-t border-white/10">
                    <button className="text-amuted hover:text-goldtxt transition-colors">
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
                      className="flex-1 bg-abg3 px-4 py-2 rounded-full text-sm outline-none border border-white/10 focus:ring-2 focus:ring-goldtxt text-adark"
                    />
                    <button
                      onClick={sendMessage}
                      className="bg-goldtxt text-white p-2 rounded-full hover:bg-golddim transition-colors"
                    >
                      <FiSend size={18} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeMenu === "addGroup" && (
              <div className="h-full overflow-y-auto custom-scrollbar p-3 sm:p-4 md:p-6">
                <div className="mx-auto w-full max-w-4xl space-y-5">
                  <div className="rounded-lg border border-white/10 bg-abg2 p-6">
                    <h2 className="text-adark text-xl font-semibold">
                      Add Group
                    </h2>

                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        value={newConversationName}
                        onChange={(e) => setNewConversationName(e.target.value)}
                        placeholder="Conversation name"
                        className="w-full border border-white/10 rounded px-3 py-2 text-sm bg-abg3 text-adark focus:outline-none focus:ring-2 focus:ring-goldtxt"
                      />
                      <input
                        type="number"
                        min={1}
                        value={newBatch}
                        onChange={(e) =>
                          setNewBatch(
                            e.target.value ? Number(e.target.value) : "",
                          )
                        }
                        placeholder="Batch number"
                        className="w-full border border-white/10 rounded px-3 py-2 text-sm bg-abg3 text-adark focus:outline-none focus:ring-2 focus:ring-goldtxt"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleCreateGroup}
                      disabled={creatingGroup}
                      className="mt-4 w-full md:w-auto bg-goldtxt text-white px-4 py-2 rounded-md hover:bg-golddim disabled:opacity-60 transition-colors"
                    >
                      {creatingGroup ? "Creating..." : "Create Group"}
                    </button>
                  </div>

                  <div className="rounded-lg border border-white/10 bg-abg2 p-6">
                    <h3 className="text-adark text-lg font-semibold">
                      All Groups
                    </h3>

                    <div className="mt-4 space-y-2">
                      {groups.map((group) => (
                        <div
                          key={group.conversationId}
                          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-md border border-white/10 bg-abg3 px-3 py-2"
                        >
                          <div>
                            <p className="text-adark font-semibold text-sm">
                              {group.conversationName}
                            </p>
                            <p className="text-amuted text-xs">
                              Batch: {group.batch}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              handleDeleteGroup(group.conversationId)
                            }
                            disabled={deletingGroupId === group.conversationId}
                            className="w-full sm:w-auto px-3 py-1.5 rounded-md border border-red-400/40 text-red-300 hover:bg-red-500/10 disabled:opacity-60 text-xs font-semibold transition-colors"
                          >
                            {deletingGroupId === group.conversationId
                              ? "Deleting..."
                              : "Delete"}
                          </button>
                        </div>
                      ))}
                      {groups.length === 0 && (
                        <p className="text-sm text-amuted">
                          No groups available.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeMenu === "groupMembers" && (
              <div className="h-full overflow-y-auto custom-scrollbar p-3 sm:p-4 md:p-6">
                <div className="mx-auto w-full max-w-4xl space-y-5">
                  <div className="rounded-lg border border-white/10 bg-abg2 p-6">
                    <h2 className="text-adark text-xl font-semibold">
                      Group Members
                    </h2>

                    <div className="mt-4 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-center">
                      <select
                        value={selectedMembersGroupId}
                        onChange={(e) =>
                          setSelectedMembersGroupId(
                            e.target.value ? Number(e.target.value) : "",
                          )
                        }
                        className="w-full border border-white/10 rounded px-3 py-2 text-sm bg-abg3 text-adark focus:outline-none focus:ring-2 focus:ring-goldtxt"
                      >
                        {groups.length === 0 && (
                          <option value="">No groups</option>
                        )}
                        {groups.map((group) => (
                          <option
                            key={group.conversationId}
                            value={group.conversationId}
                          >
                            {group.conversationName} (Batch {group.batch})
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() =>
                          selectedMembersGroupId
                            ? loadGroupMembers(selectedMembersGroupId)
                            : null
                        }
                        disabled={!selectedMembersGroupId || membersLoading}
                        className="w-full md:w-auto px-4 py-2 rounded-md border border-white/20 text-adark hover:bg-abg3 disabled:opacity-60 text-sm font-semibold transition-colors"
                      >
                        {membersLoading ? "Refreshing..." : "Refresh Members"}
                      </button>
                    </div>

                    <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div className="rounded-md border border-white/10 bg-abg3 p-3">
                        <p className="text-xs font-semibold text-amuted uppercase tracking-wide">
                          Users In Batch
                        </p>
                        <div className="mt-2 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-2 items-center">
                          <select
                            value={selectedBatchUserId}
                            onChange={(e) =>
                              setSelectedBatchUserId(
                                e.target.value ? Number(e.target.value) : "",
                              )
                            }
                            disabled={
                              !selectedMembersGroupId ||
                              memberOptionsLoading ||
                              availableBatchUsers.length === 0
                            }
                            className="w-full border border-white/10 rounded px-3 py-2 text-sm bg-abg2 text-adark focus:outline-none focus:ring-2 focus:ring-goldtxt disabled:opacity-60"
                          >
                            {availableBatchUsers.length === 0 && (
                              <option value="">No users available</option>
                            )}
                            {availableBatchUsers.map((user) => (
                              <option key={user.userId} value={user.userId}>
                                {user.username}
                                {user.email ? ` (${user.email})` : ""}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() =>
                              selectedBatchUserId
                                ? handleAddMember(
                                    Number(selectedBatchUserId),
                                    "batch-user",
                                  )
                                : null
                            }
                            disabled={!selectedBatchUserId || addingBatchUser}
                            className="w-full md:w-auto px-4 py-2 rounded-md bg-goldtxt text-white hover:bg-golddim disabled:opacity-60 text-sm font-semibold transition-colors"
                          >
                            {addingBatchUser ? "Adding..." : "Add User"}
                          </button>
                        </div>
                      </div>

                      <div className="rounded-md border border-white/10 bg-abg3 p-3">
                        <p className="text-xs font-semibold text-amuted uppercase tracking-wide">
                          Mentors In Batch
                        </p>
                        <div className="mt-2 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-2 items-center">
                          <select
                            value={selectedMentorId}
                            onChange={(e) =>
                              setSelectedMentorId(
                                e.target.value ? Number(e.target.value) : "",
                              )
                            }
                            disabled={
                              !selectedMembersGroupId ||
                              availableMentors.length === 0
                            }
                            className="w-full border border-white/10 rounded px-3 py-2 text-sm bg-abg2 text-adark focus:outline-none focus:ring-2 focus:ring-goldtxt disabled:opacity-60"
                          >
                            {availableMentors.length === 0 && (
                              <option value="">No mentors available</option>
                            )}
                            {availableMentors.map((mentor) => (
                              <option key={mentor.userId} value={mentor.userId}>
                                {mentor.username}
                                {mentor.techStack
                                  ? ` - ${mentor.techStack}`
                                  : ""}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() =>
                              selectedMentorId
                                ? handleAddMember(
                                    Number(selectedMentorId),
                                    "mentor",
                                  )
                                : null
                            }
                            disabled={!selectedMentorId || addingMentor}
                            className="w-full md:w-auto px-4 py-2 rounded-md bg-goldtxt text-white hover:bg-golddim disabled:opacity-60 text-sm font-semibold transition-colors"
                          >
                            {addingMentor ? "Adding..." : "Add Mentor"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-white/10 bg-abg2 p-6">
                    <h3 className="text-adark text-lg font-semibold">
                      Active Members
                    </h3>

                    <div className="mt-4 space-y-2">
                      {membersLoading && (
                        <p className="text-sm text-amuted">
                          Loading members...
                        </p>
                      )}

                      {!membersLoading &&
                        groupMembers.map((member) => (
                          <div
                            key={member.userId}
                            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-md border border-white/10 bg-abg3 px-3 py-2"
                          >
                            <div>
                              <p className="text-adark font-semibold text-sm">
                                {member.username}
                              </p>
                              <p className="text-amuted text-xs">
                                User ID: {member.userId}
                                {member.email ? ` | ${member.email}` : ""}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveMember(member.userId)}
                              disabled={
                                removingMemberId === member.userId ||
                                !selectedMembersGroupId
                              }
                              className="w-full sm:w-auto px-3 py-1.5 rounded-md border border-red-400/40 text-red-300 hover:bg-red-500/10 disabled:opacity-60 text-xs font-semibold transition-colors"
                            >
                              {removingMemberId === member.userId
                                ? "Removing..."
                                : "Remove"}
                            </button>
                          </div>
                        ))}

                      {!membersLoading && groupMembers.length === 0 && (
                        <p className="text-sm text-amuted">
                          No active members found for this group.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </ProtectedRoute>
    </AdminPortalShell>
  );
};

export default AdminMessagesPage;
