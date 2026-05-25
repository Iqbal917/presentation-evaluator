
// Utility: safely parse JSON (handles empty or invalid bodies)
async function safeJson(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export const authAPI = {
  register: async (userData) => {
    console.log('=== FRONTEND DATA BEING SENT ===');
    console.log('Original userData:', userData);
    console.log('JSON.stringify:', JSON.stringify(userData));
    console.log('================================');

    const response = await fetch(`/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(userData),
    });

    console.log('=== RESPONSE DETAILS ===');
    console.log('Response status:', response.status);
    console.log('Response statusText:', response.statusText);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log('Raw response text:', responseText);
    console.log('========================');

    let data = null;
    if (responseText) {
      try {
        data = JSON.parse(responseText);
        console.log('Parsed response data:', data);
      } catch (e) {
        console.error('Failed to parse response:', e);
        console.log('Response was not valid JSON');
      }
    }

    if (!response.ok) {
      const errorMessage = data?.detail || data?.message || `Registration failed (${response.status})`;
      throw new Error(errorMessage);
    }

    return data || { success: response.ok };
  },

  login: async (credentials) => {
    console.log('Login data being sent:', credentials);

    const response = await fetch(`/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });

    const data = await safeJson(response);
    console.log('Login response:', { status: response.status, data });

    if (!response.ok) {
      const errorMessage = data?.detail || data?.message || `Login failed (${response.status})`;
      throw new Error(errorMessage);
    }

    return data || { success: response.ok };
  },

  // ADD THIS MISSING FUNCTION:
  getCurrentUser: async (token) => {
    const response = await fetch(`/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await safeJson(response);

    if (!response.ok) {
      throw new Error(data?.detail || "Failed to get user info");
    }

    return data;
  },

  // ADD THIS MISSING FUNCTION TOO:
};

// Keep the rest of your code the same...
export const evaluationAPI = {
  startEvaluation: async (token = null) => {
    const headers = { "Content-Type": "application/json" };
    const clientId = localStorage.getItem("clientIdentifier");
    if (clientId) headers["x-client-identifier"] = clientId;
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const response = await fetch(`/start-evaluation`, { method: "POST", headers });
    const text = await response.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch (e) {
      console.error("Failed to parse start evaluation response", text, e);
    }

    if (!response.ok) {
      console.error("Start evaluation failed", response.status, data, text);
      throw new Error(data?.detail?.message || data?.detail || data?.message || `Failed to start evaluation (${response.status})`);
    }

    return data || { success: response.ok };
  },

  stopEvaluation: async (token = null) => {
    const headers = { Accept: "application/json" };
    const clientId = localStorage.getItem("clientIdentifier");
    if (clientId) headers["x-client-identifier"] = clientId;
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const response = await fetch(`/stop-evaluation?no_redirect=1`, { method: "POST", headers });
    return (await safeJson(response)) || { success: response.ok };
  },

  getEvaluationStatus: async (token = null) => {
    const headers = {};
    const clientId = localStorage.getItem("clientIdentifier");
    if (clientId) headers["x-client-identifier"] = clientId;
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const response = await fetch(`/evaluation-status`, { headers });
    return (await safeJson(response)) || { success: response.ok };
  },

  getMetrics: async (token = null) => {
    const headers = { cache: "no-store" };
    const clientId = localStorage.getItem("clientIdentifier");
    if (clientId) headers["x-client-identifier"] = clientId;
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const response = await fetch(`/api/metrics`, { headers });
    return (await safeJson(response)) || { success: response.ok };
  },

  getReport: async (token = null) => {
    const headers = {};
    const clientId = localStorage.getItem("clientIdentifier");
    if (clientId) headers["x-client-identifier"] = clientId;
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const response = await fetch(`/api/report`, { headers });
    const data = await safeJson(response);

    if (!response.ok) {
      throw new Error(data?.detail?.message || data?.detail || "Failed to get report");
    }

    return data || { success: response.ok };
  },

  uploadVideo: async (file, token = null) => {
    const formData = new FormData();
    formData.append("file", file);

    const headers = {};
    const clientId = localStorage.getItem("clientIdentifier");
    if (clientId) headers["x-client-identifier"] = clientId;
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const response = await fetch(`/upload_video`, {
      method: "POST",
      headers,
      body: formData,
    });

    const data = await safeJson(response);

    if (!response.ok) {
      throw new Error(data?.detail || "Failed to upload video");
    }

    return data || { success: response.ok };
  },
};

// ---------------- COMBINED API ----------------
export const api = {
  ...authAPI,
  ...evaluationAPI,

  getHealthStatus: async () => {
    const response = await fetch(`/health`);
    return (await safeJson(response)) || { status: response.ok ? "ok" : "error" };
  },
};

// ---------------- TOKEN MANAGER ----------------
export const tokenManager = {
  getToken: () => localStorage.getItem("token"),
  setToken: (token) => localStorage.setItem("token", token), // Fixed: was localStorage.setToken
  removeToken: () => localStorage.removeItem("token"),
  isAuthenticated: () => !!localStorage.getItem("token"),
};

// ---------------- AUTH SERVICE ----------------
export const authService = {

  login: async (credentials) => {
    try {
      const response = await authAPI.login(credentials);
      console.log('Login service response:', response);

      // Handle different possible response formats
      const token = response.access_token || response.token;
      if (!token) {
        throw new Error("No access token received from server");
      }

      tokenManager.setToken(token);

      const userData = await authAPI.getCurrentUser(token);
      return { success: true, user: userData };
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, error: error.message };
    }
  },

  register: async (userData) => {
    try {
      const response = await authAPI.register(userData);
      console.log('Register service response:', response);

      // Handle different possible response formats
      const token = response.access_token || response.token;
      if (!token) {
        // If no token in response, maybe registration doesn't auto-login
        // Try to login with the provided credentials
        console.log('No token in registration response, attempting login...');
        return await authService.login({
          email: userData.email,
          password: userData.password
        });
      }

      tokenManager.setToken(token);

      const userInfo = await authAPI.getCurrentUser(token);
      return { success: true, user: userInfo };
    } catch (error) {
      console.error("Registration error:", error);
      return { success: false, error: error.message };
    }
  },

  logout: () => {
    tokenManager.removeToken();
  },

  checkAuth: async () => {
    const token = tokenManager.getToken();
    if (token) {
      try {
        return await authAPI.getCurrentUser(token);
      } catch (error) {
        console.error("Token invalid, logging out:", error);
        tokenManager.removeToken();
        return null;
      }
    }
    return null;
  },
};