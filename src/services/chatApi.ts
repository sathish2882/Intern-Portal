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
