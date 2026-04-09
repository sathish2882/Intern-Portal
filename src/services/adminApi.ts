// Delete Mentor
export const deleteMentorApi = (mentor_id: number) => {
  return API.post('/delete_mentor', null, { params: { mentor_id } });
};

// Update Mentor
export const updateMentorApi = (mentor_id: number, data: {
  username: string;
  email: string;
  phone: string;
  password: string;
  batch: number;
  tech_stack: string;
}) => {
  return API.put('/update_mentor', data, { params: { mentor_id } });
};
// Get all feedbacks (admin)
export const getAllFeedbackApi = () => {
  return API.get('/feedback/all');
};

// Reply to feedback (admin)
export const replyFeedbackApi = (feedback_id: number | string, reply: string) => {
  return API.post('/feedback/reply/admin', { feedback_id, reply });
};
import API from './authInstance'

export const getAllEmails = (params: any) => {
  return API.get('/emails', { params })
}

export const batchemailHistory = (batchId: number, params: any) => {
  return API.get(`/emails/${batchId}`, { params })
}

export const getAllUsers = (params?: { page_no?: number; page_size?: number }) => {
  return API.get('/get_all_users', {
    params: {
      page_no: params?.page_no ?? 1,
      page_size: params?.page_size ?? 10,
    },
  })
}

export const getBatchUsers = (batchId: number) => {
  return API.get(`/get_userby_batch/${batchId}`)
}

export const viewAttendanceByAdminApi = (userId: number | string) => {
  return API.post('/viewbyadmin', null, {
    params: { user_id: userId },
  })
}

export const viewAttendanceByUserApi = () => {
  return API.post('/viewbyuser')
}

export const deleteUser = (userId: number | string) => {
  return API.delete(`/users/${userId}`)
}

export const getAllMentorsApi = () => {
  return API.get('/get_all_mentors')
}

export const addMentorApi = (data: {
  username: string
  email: string
  password: string
  batch: number
  phone: string
  tech_stack: string
}) => {
  return API.post('/add_mentor', data)
}


export const getBankDetailsApi = (invoiceNo: string) => {
  return API.post(
    `/get_bankdetails?invoice_no=${invoiceNo}`
  );
};
