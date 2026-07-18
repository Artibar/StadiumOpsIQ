import axios from 'axios'

const resolveApiBaseUrl = () => {
  if (typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location?.hostname)) {
    return 'http://localhost:5000'
  }

  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL
  }

  return 'https://stadiumopsiq.onrender.com'
}

const api = axios.create({
  baseURL: resolveApiBaseUrl(),
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json'
  }
})

const FALLBACK_STADIUMS = [
  { _id: '1', id: '1', name_en: 'Estadio Azteca', city_en: 'Mexico City', country_en: 'Mexico', capacity: 83000, region: 'Central' },
  { _id: '2', id: '2', name_en: 'Estadio Akron', city_en: 'Guadalajara (Zapopan)', country_en: 'Mexico', capacity: 48000, region: 'Central' },
  { _id: '3', id: '3', name_en: 'Estadio BBVA', city_en: 'Monterrey (Guadalupe)', country_en: 'Mexico', capacity: 53500, region: 'Central' },
  { _id: '4', id: '4', name_en: 'AT&T Stadium', city_en: 'Dallas (Arlington, Texas)', country_en: 'United States', capacity: 94000, region: 'Central' },
  { _id: '5', id: '5', name_en: 'NRG Stadium', city_en: 'Houston', country_en: 'United States', capacity: 72000, region: 'Central' },
  { _id: '6', id: '6', name_en: 'GEHA Field at Arrowhead Stadium', city_en: 'Kansas City', country_en: 'United States', capacity: 73000, region: 'Central' },
  { _id: '7', id: '7', name_en: 'Mercedes-Benz Stadium', city_en: 'Atlanta', country_en: 'United States', capacity: 75000, region: 'Eastern' },
  { _id: '8', id: '8', name_en: 'Hard Rock Stadium', city_en: 'Miami (Miami Gardens)', country_en: 'United States', capacity: 65000, region: 'Eastern' },
  { _id: '9', id: '9', name_en: 'Gillette Stadium', city_en: 'Boston (Foxborough)', country_en: 'United States', capacity: 65000, region: 'Eastern' },
  { _id: '10', id: '10', name_en: 'Lincoln Financial Field', city_en: 'Philadelphia', country_en: 'United States', capacity: 69000, region: 'Eastern' },
  { _id: '11', id: '11', name_en: 'MetLife Stadium', city_en: 'New York/New Jersey (East Rutherford)', country_en: 'United States', capacity: 82500, region: 'Eastern' },
  { _id: '12', id: '12', name_en: 'BMO Field', city_en: 'Toronto', country_en: 'Canada', capacity: 45000, region: 'Eastern' },
  { _id: '13', id: '13', name_en: 'BC Place', city_en: 'Vancouver', country_en: 'Canada', capacity: 54000, region: 'Western' },
  { _id: '14', id: '14', name_en: 'Lumen Field', city_en: 'Seattle', country_en: 'United States', capacity: 69000, region: 'Western' },
  { _id: '15', id: '15', name_en: "Levi's Stadium", city_en: 'San Francisco Bay Area (Santa Clara)', country_en: 'United States', capacity: 71000, region: 'Western' },
  { _id: '16', id: '16', name_en: 'SoFi Stadium', city_en: 'Los Angeles (Inglewood)', country_en: 'United States', capacity: 70000, region: 'Western' }
];

export const getStadiums = async () => {
  try {
    const response = await api.get('/api/stadiums')
    const list = response.data.stadiums || response.data || []
    return Array.isArray(list) && list.length > 0 ? list : FALLBACK_STADIUMS
  } catch (error) {
    console.error('getStadiums failed:', error)
    return FALLBACK_STADIUMS
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
