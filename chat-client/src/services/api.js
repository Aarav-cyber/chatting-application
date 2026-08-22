import axios from "axios";

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000",
});

export const googleLogin = async (credential) => {
  const response = await api.post(
    "/api/auth/google",
    {
      credential,
    }
  );

  return response.data;
};

export default api;