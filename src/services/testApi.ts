import API from "./authInstance";
import { getUserId } from "../utils/authCookies";

export const getTestStatusApi = async () => {
  const userId = getUserId();
  return await API.get(`/users/${userId}/test-status`);
};

export const runCodingCodeApi = (data: {
  question_id: number;
  language: "javascript" | "python" | "java" | "cpp";
  code: string;
}) => {
  const endpoint = window.appConfig?.runCodeEndpoint || "/run-code";
  return API.post(endpoint, data);
};

export const getTestQuestionsApi = () => {
  return API.get("/test/tech-questions");
};

export const runCodeApi = (data: any) => {
  return API.post("/test/test/run", data);
};

export const submitCodeApi = (data: any) => {
  const userId = getUserId();
  return API.post(`/test/test/submit/${userId}`, {
    solutions: data,
  });
};

export const startTestApi = () => {
  const userId = getUserId();
  return API.post(`/start/${userId}`);
};

export const saveScoresApi = (data: any) => {
  const userId = getUserId();
  return API.post(`/save-scores/${userId}`, data);
};
