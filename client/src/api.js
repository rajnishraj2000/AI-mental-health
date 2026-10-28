const API = '/api';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('mindcare_token');
  let res;
  try {
    res = await fetch(`${API}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
  } catch (netErr) {
    throw new Error('Cannot connect to backend server. Make sure the server is running on port 3000.');
  }

  const text = await res.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`Server returned unexpected response (HTTP ${res.status}). The backend may have encountered an error.`);
  }

  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }
  return data;
}

export const api = {
  get:    (url) => request(url),
  post:   (url, body) => request(url, { method: 'POST', body: JSON.stringify(body) }),
  delete: (url) => request(url, { method: 'DELETE' }),
};
