import API from "./authInstance"

export const createTaskApi = (data: any) => {
  return API.post('/task/create', data)
}

export const getTasksApi = () => {
  return API.get('/task/user_tasks')
}

export const startTaskApi = (taskId: number) => {
  return API.put(`/task/${taskId}/start`)
}

export const pauseTaskApi = (taskId: number, reason: string) => {
  return API.put(`/task/${taskId}/pause`, { reason })
}

export const endTaskApi = (taskId: number) => {
  return API.put(`/task/${taskId}/end`)
}

export const updateTaskApi = (taskId: number, data: { title?: string; status?: number; due_time?: string }) => {
  return API.put(`/task/${taskId}`, data)
}