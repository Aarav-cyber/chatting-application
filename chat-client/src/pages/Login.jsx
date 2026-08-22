import { useState } from "react";

import { useAuth } from "../context/AuthContext";
import GoogleLogin from "../components/auth/GoogleLogin";
import { googleLogin } from "../services/api";

export default function Login() {
  const { login } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGoogleLogin = async (credential) => {
    try {
      setLoading(true);
      setError("");

      // Send Google credential to backend
      const data = await googleLogin(credential);

      // AuthContext handles token + user storage
      login(data);

      // Go to chat after successful login
      window.location.href = "/chat";
    } catch (error) {
      console.error("Google login error:", error);

      setError(
        error.response?.data?.message ||
          "Login failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">

        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-slate-900">
            BackChat
          </h1>

          <p className="mt-2 text-slate-500">
            Connect. Chat. Stay in touch.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-5 rounded-xl bg-red-50 p-3 text-center text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Google Login */}
        {loading ? (
          <div className="py-3 text-center text-slate-500">
            Signing you in...
          </div>
        ) : (
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleLogin}
            />
          </div>
        )}
      </div>
    </div>
  );
}