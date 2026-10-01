// Centralized API & Socket Configuration

// Determines the backend host URL automatically
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000';

export function getAuthHeaders() {
  const token = localStorage.getItem('aether_token');
  const headers = {
    'Content-Type': 'application/json'
  };
  if (token && token !== 'null' && token !== 'undefined') {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}
