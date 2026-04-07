import API from "./authInstance"

export const createTaskApi = (data: any) => {
  return API.post('/task/create', data)
}

export const getTasksApi = () => {
  return API.get('/task/user_tasks')
}

export const startTaskApi = (taskId: number) => {
  return API.post(`/task/${taskId}/start`)
}

export const pauseTaskApi = (taskId: number, reason: string) => {
  return API.post(`/task/${taskId}/pause`, { reason })
}

export const resumeTaskApi = (taskId: number,) =>{
  return API.post(`/task/${taskId}/resume`)
}

export const endTaskApi = (taskId: number) => {
  return API.post(`/task/${taskId}/stop`)
}

export const updateTaskApi = (taskId: number, data: { title?: string; status?: number; due_time?: string }) => {
  return API.put(`/task/${taskId}`, data)
}