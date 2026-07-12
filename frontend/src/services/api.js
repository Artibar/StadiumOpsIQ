import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000'
});

// Export getStadiums(): fetch directly from worldcup26.ir/get/stadiums
export async function getStadiums() {
  try {
    const response = await axios.get('https://worldcup26.ir/get/stadiums');
    const data = response.data;
    const list = Array.isArray(data) ? data : (data.data || []);
    return { success: true, data: list };
  } catch (error) {
    console.error("Failed to fetch stadiums directly from FIFA API:", error.message);
    return { success: false, error: error.message, data: [] };
  }
}

// Export createIncident(data): POST /api/incidents
export async function createIncident(data) {
  try {
    const response = await api.post('/api/incidents', data);
    return { success: true, incident: response.data.incident };
  } catch (error) {
    console.error("createIncident failed:", error.message);
    const msg = error.response?.data?.error || error.message;
    return { success: false, error: msg };
  }
}

// Export getIncidents(): GET /api/incidents
export async function getIncidents() {
  try {
    const response = await api.get('/api/incidents');
    return { success: true, data: response.data };
  } catch (error) {
    console.error("getIncidents failed:", error.message);
    return { success: false, error: error.message, data: [] };
  }
}

// Export getIncidentById(id): GET /api/incidents/${id}
export async function getIncidentById(id) {
  try {
    const response = await api.get(`/api/incidents/${id}`);
    return { success: true, data: response.data };
  } catch (error) {
    console.error("getIncidentById failed:", error.message);
    return { success: false, error: error.message };
  }
}

// Export confirmIncident(id): PATCH /api/incidents/${id}/confirm
export async function confirmIncident(id) {
  try {
    const response = await api.patch(`/api/incidents/${id}/confirm`);
    return { success: true, data: response.data };
  } catch (error) {
    console.error("confirmIncident failed:", error.message);
    const msg = error.response?.data?.error || error.message;
    return { success: false, error: msg };
  }
}

// Export overrideIncident(id, data): PATCH /api/incidents/${id}/override
export async function overrideIncident(id, data) {
  try {
    const response = await api.patch(`/api/incidents/${id}/override`, data);
    return { success: true, data: response.data };
  } catch (error) {
    console.error("overrideIncident failed:", error.message);
    const msg = error.response?.data?.error || error.message;
    return { success: false, error: msg };
  }
}

// Export getStats(): GET /api/stats
export async function getStats() {
  try {
    const response = await api.get('/api/stats');
    return { success: true, data: response.data };
  } catch (error) {
    console.error("getStats failed:", error.message);
    return { success: false, error: error.message };
  }
}

export default api;
