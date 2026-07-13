import axios from 'axios'

const API_BASE_URL = 'https://stadiumopsiq.onrender.com'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json'
  }
})

export const getStadiums = async () => {
  try {
    const response = await api.get(
      '/api/stadiums')
    // Extract stadiums array since the API response is wrapped in { stadiums: [...] }
    return response.data.stadiums || response.data || []
  } catch (error) {
    console.error('getStadiums failed:', 
      error)
    return []
  }
}

export const createIncident = async (data) => {
  try {
    const response = await api.post(
      '/api/incidents', data)
    return response.data
  } catch (error) {
    console.error('createIncident failed:', error)
    return { success: false, error: error.message }
  }
}

export const getIncidents = async () => {
  try {
    const response = await api.get('/api/incidents')
    return response.data
  } catch (error) {
    console.error('getIncidents failed:', error)
    return []
  }
}

export const getIncidentById = async (id) => {
  try {
    const response = await api.get(
      `/api/incidents/${id}`)
    return response.data
  } catch (error) {
    console.error('getIncidentById failed:', error)
    return null
  }
}

export const confirmIncident = async (id) => {
  try {
    const response = await api.patch(
      `/api/incidents/${id}/confirm`)
    return response.data
  } catch (error) {
    console.error('confirmIncident failed:', error)
    return { success: false, error: error.message }
  }
}

export const overrideIncident = async (id, data) => {
  try {
    const response = await api.patch(
      `/api/incidents/${id}/override`, data)
    return response.data
  } catch (error) {
    console.error('overrideIncident failed:', error)
    return { success: false, error: error.message }
  }
}

export const getStats = async () => {
  try {
    const response = await api.get('/api/stats')
    return response.data
  } catch (error) {
    console.error('getStats failed:', error)
    return null
  }
}

export default api
