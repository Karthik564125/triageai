const API_BASE_URL = 'http://localhost:5000/api';

const handleResponse = async (response) => {
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.message || 'API Request failed');
  }
  return data;
};

export const api = {
  // Auth API
  async login(username, password) {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    return handleResponse(res);
  },

  // Teams & Members API
  async getTeams() {
    const res = await fetch(`${API_BASE_URL}/teams`);
    return handleResponse(res);
  },

  // Tickets API
  async createTicket(ticketData) {
    const res = await fetch(`${API_BASE_URL}/tickets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ticketData)
    });
    return handleResponse(res);
  },

  async getMyTickets(email, userId) {
    const query = userId ? `userId=${encodeURIComponent(userId)}` : `email=${encodeURIComponent(email || '')}`;
    const res = await fetch(`${API_BASE_URL}/tickets/my?${query}`);
    return handleResponse(res);
  },

  async getAllTickets() {
    const res = await fetch(`${API_BASE_URL}/tickets`);
    return handleResponse(res);
  },

  async getTicketById(id) {
    const res = await fetch(`${API_BASE_URL}/tickets/${id}`);
    return handleResponse(res);
  },

  async assignTicket(id, payload) {
    const res = await fetch(`${API_BASE_URL}/tickets/${id}/assign`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return handleResponse(res);
  },

  async updateStatus(id, payload) {
    const res = await fetch(`${API_BASE_URL}/tickets/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return handleResponse(res);
  },

  async addComment(id, payload) {
    const res = await fetch(`${API_BASE_URL}/tickets/${id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return handleResponse(res);
  },

  async analyzeTicket(id) {
    const res = await fetch(`${API_BASE_URL}/tickets/${id}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await res.json();
    if (!res.ok && !data.ticket) {
      throw new Error(data.message || 'AI Analysis failed');
    }
    return data;
  },

  async acceptAISuggestions(id, payload) {
    const res = await fetch(`${API_BASE_URL}/tickets/${id}/accept-ai`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return handleResponse(res);
  },

  async rejectAISuggestions(id, payload) {
    const res = await fetch(`${API_BASE_URL}/tickets/${id}/reject-ai`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return handleResponse(res);
  }
};

