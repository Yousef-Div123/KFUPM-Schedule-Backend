import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export const authAPI = {
  register: data => api.post('/auth/register', data),
  login: data => api.post('/auth/login', data),
}

export const courseAPI = {
  getAll: () => api.get('/courses'),
  getById: id => api.get(`/courses/${id}`),
  create: data => api.post('/courses', data),
  update: (id, data) => api.put(`/courses/${id}`, data),
  delete: id => api.delete(`/courses/${id}`),
}

export const enrollmentAPI = {
  enroll: data => api.post('/enrollments', data),
  getByStudent: studentId => api.get(`/enrollments?student_id=${studentId}`),
  getByCourse: courseId => api.get(`/enrollments?course_id=${courseId}`),
  remove: id => api.delete(`/enrollments/${id}`),
}

export const instructorCourseAPI = {
  assign: data => api.post('/instructor-courses', data),
  getByInstructor: instructorId => api.get(`/instructor-courses?instructor_id=${instructorId}`),
  getByCourse: courseId => api.get(`/instructor-courses?course_id=${courseId}`),
  remove: id => api.delete(`/instructor-courses/${id}`),
}

export const scheduleAPI = {
  create: data => api.post('/schedules', data),
  getByInstructor: instructorId => api.get(`/schedules?instructor_id=${instructorId}`),
  getByCourse: courseId => api.get(`/schedules?course_id=${courseId}`),
  update: (id, data) => api.put(`/schedules/${id}`, data),
  delete: id => api.delete(`/schedules/${id}`),
}

export const officeHourAPI = {
  create: data => api.post('/office-hours', data),
  getBySchedule: scheduleId => api.get(`/office-hours?schedule_id=${scheduleId}`),
  getByDate: date => api.get(`/office-hours?date=${date}`),
  update: (id, data) => api.put(`/office-hours/${id}`, data),
  cancel: id => api.patch(`/office-hours/${id}/cancel`),
}

export const timeSlotAPI = {
  create: data => api.post('/time-slots', data),
  getByOfficeHour: officeHourId => api.get(`/time-slots?office_hour_id=${officeHourId}`),
  update: (id, data) => api.put(`/time-slots/${id}`, data),
  delete: id => api.delete(`/time-slots/${id}`),
}

export const bookingAPI = {
  book: data => api.post('/bookings', data),
  getByStudent: studentId => api.get(`/bookings?student_id=${studentId}`),
  getBySlot: slotId => api.get(`/bookings?slot_id=${slotId}`),
  cancel: id => api.patch(`/bookings/${id}/cancel`),
  complete: id => api.patch(`/bookings/${id}/complete`),
}

export default api
