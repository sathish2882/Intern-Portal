import API from "./authInstance";

export const messageApi = (conversation_id: number, content: string) => {
  return API.post(`/Chat/groups/${conversation_id}/messages`, {
    content,
  });
};