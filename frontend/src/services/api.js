import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

// Attach token to every request
api.interceptors.request.use((config) => {
  const userInfo = localStorage.getItem('userInfo')
  if (userInfo) {
    const { token } = JSON.parse(userInfo)
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle an invalid or suspended session globally. The token is dropped so the
// protected routes send the visitor back to sign in instead of looping on 401s.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const suspended =
      status === 403 && /suspended/i.test(error.response?.data?.message || '')

    if (status === 401 || suspended) {
      localStorage.removeItem('userInfo')
      window.dispatchEvent(new CustomEvent('voltcart:session-ended', { detail: { suspended } }))
    }
    return Promise.reject(error)
  }
)

export default api
