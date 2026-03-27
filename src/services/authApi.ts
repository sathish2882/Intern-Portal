import API from "./authInstance";

export const loginApi = (data: any) => {
  return API.post("/login", data);
};

export const signupApi = (data: any) => {
  return API.post("/signup", data);
};

export const logoutApi = () => {
  return API.post("/logout");
};

export const submitTestApi = (data: any) => {
  return API.post("/submit-test", data);
};

export const getBatchesApi = () => {
  return API.get("/batches");
};

export const getUserByBatchApi = (batchId: number | string) => {
  return API.get(`/get_userby_batch/${batchId}`);
};

export const paymentEmailApi = (data: any) => {
  return API.post("/payment_email", data);
};
