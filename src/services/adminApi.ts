import API from "./authInstance";


export const getAllEmails = (params: any) => {
  return API.get('/emails', { params })
}

export const batchemailHistory = (batchId: number, params: any) => {
  return API.get(`/emails/${batchId}`, { params })
}

export const getAllUsers = () => {
  return API.get("/get_all_users?page_no=1&page_size=10")
}


export const viewAttendanceByAdminApi = (userId: number | string) => {
  return API.post('/viewbyadmin', null, {
    params: { user_id: userId },
  })
}

export const getBatchUsers = (batchId: number) => {
  return API.get(`/get_userby_batch/${batchId}`)
}

export const deleteUser = ()=>{
  return API.delete("/users/")
}



