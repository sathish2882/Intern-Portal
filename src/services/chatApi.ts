import API from "./authInstance";

export const messageApi = (conversation_id: number, content: string) => {
  return API.post(`/Chat/groups/${conversation_id}/messages`, {
    content,
  });
};

export const viewmessageApi = (conversation_id: number) => {
  return API.get(`/Chat/groups/${conversation_id}/messages`);
};

export const getbatchbyid = () => {
  return API.get("/Chat/groups/context");
};

export const getGroupsApi = () => {
  return API.get("/Chat/groups");
};

export const createGroupApi = (
  conversation_name: string,
  batch: number | string,
) => {
  return API.post("/Chat/groups", null, {
    params: { conversation_name, batch },
  });
};

export const deleteGroupApi = (conversation_id: number) => {
  return API.delete(`/Chat/groups/${conversation_id}`);
};

export const addGroupMemberApi = (conversation_id: number, user_id: number) => {
  return API.post(`/Chat/groups/${conversation_id}/members`, null, {
    params: { user_id },
  });
};

export const getGroupMembersApi = (conversation_id: number) => {
  return API.get(`/Chat/groups/${conversation_id}/members`);
};

export const getBatchUsersForChatApi = (batch_id: number | string) => {
  return API.get(`/Chat/batches/${batch_id}/users`);
};

export const removeGroupMemberApi = (
  conversation_id: number,
  user_id: number,
) => {
  return API.delete(`/Chat/groups/${conversation_id}/members/${user_id}`);
};

export type BatchConversationApiItem = {
  user_id: number;
  batch: number | string;
  conversation_id: number;
  conversation_name: string;
};

export type ConversationMessageApiItem = {
  message_id?: number | string;
  conversation_id?: number | string;
  sender_id?: number;
  sender_name?: string;
  content?: string;
  created_on?: string;
};
