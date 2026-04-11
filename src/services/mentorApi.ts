import API from "./authInstance";

export const getTypes = ()  => {
    return API.get("/mentor_assessment/types");
}   