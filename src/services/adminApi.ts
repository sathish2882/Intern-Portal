import API from "./authInstance";


export const emailHistory = (params: any) => {
  return API.get('/emails', { params })
}

export const viewAttendanceByAdminApi = (userId: number | string) => {
  return API.post('/viewbyadmin', null, {
    params: { user_id: userId },
  })
}
