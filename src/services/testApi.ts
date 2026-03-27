import API from "./authInstance";

export const submitResultApi = (data: any) => {
  return API.post("/submit-test", data);
};

export const getResultsApi = () => {
  return API.get("/get-results");
};
