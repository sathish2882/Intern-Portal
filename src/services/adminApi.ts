import API from "./authInstance";


export const emailHistory = (params: any) => {
  return API.get('/emails', { params })
}