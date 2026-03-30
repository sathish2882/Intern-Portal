import API from "./authInstance";

export const checkInApi = ()=>{
    return API.post("/Check-in")
}

export const checkOutApi = ()=>{
    return API.post("/check-out")
}