import axios from "axios";

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000",
});

api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem("chat_token");

    if (token) {
      config.headers.Authorization =
        `Bearer ${token}`;
    }

    return config;
  }
);

export const googleLogin = async (
  credential
) => {
  const response =
    await api.post(
      "/api/auth/google",
      { credential }
    );

  return response.data;
};

export const getUsers = async (query) => {
  const response =
    await api.get(
      `/api/users/search?q=${encodeURIComponent(query)}`
    );

  return response.data;
};

export const getConversations =
  async () => {
    const response =
      await api.get(
        "/api/conversations"
      );

    return response.data;
  };

export const createConversation =
  async (userId) => {
    const response =
      await api.post(
        "/api/conversations",
        { userId }
      );

    return response.data;
  };

export const getMessages =
  async (conversationId) => {
    const response =
      await api.get(
        `/api/conversations/${conversationId}/messages`
      );

    return response.data;
  };

export default api;