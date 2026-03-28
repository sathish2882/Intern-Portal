import API from "./authInstance";
import { getUserId } from "../utils/authCookies";

export const submitResultApi = ( data: any) => {
  const userId = getUserId()
  return API.post(`/submit-final-result/${userId}`, data);
};

export const getTestStatusApi = async () => {
  const userId = getUserId();
  return await API.get(`/users/${userId}/test-status`)
 
}

