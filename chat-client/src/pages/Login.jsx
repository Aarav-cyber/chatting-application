// import { useState } from "react";

// import GoogleLogin from "../components/auth/GoogleLogin";
// import { googleLogin } from "../services/api";

// export default function Login() {
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//   const handleGoogleLogin = async (credential) => {
//     try {
//       setLoading(true);
//       setError("");

//       const data = await googleLogin(credential);

//       localStorage.setItem(
//         "chat_token",
//         data.token
//       );

//       localStorage.setItem(
//         "chat_user",
//         JSON.stringify(data.user)
//       );

//       window.location.href = "/chat";
//     } catch (error) {
//       console.error(error);

//       setError(
//         error.response?.data?.message ||
//           "Login failed"
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">

//       <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">

//         <div className="mb-8">
//           <h1 className="text-3xl font-bold text-slate-900">
//             BackChat
//           </h1>

//           <p className="mt-2 text-slate-500">
//             Connect. Chat. Stay in touch.
//           </p>
//         </div>

//         {error && (
//           <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
//             {error}
//           </div>
//         )}

//         {loading ? (
//           <div className="text-center text-slate-500">
//             Signing you in...
//           </div>
//         ) : (
//           <div className="flex justify-center">
//             <GoogleLogin
//               onSuccess={handleGoogleLogin}
//             />
//           </div>
//         )}

//       </div>

//     </div>
//   );
// }

import { useState } from "react";

import GoogleLogin from "../components/auth/GoogleLogin";
import { googleLogin } from "../services/api";

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGoogleLogin = async (credential) => {
    try {
      setLoading(true);
      setError("");

      const data = await googleLogin(credential);

      localStorage.setItem(
        "chat_token",
        data.token
      );

      localStorage.setItem(
        "chat_user",
        JSON.stringify(data.user)
      );

      window.location.href = "/chat";
    } catch (error) {
      console.error(error);

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

        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-slate-900">
            BackChat
          </h1>

          <p className="mt-2 text-slate-500">
            Connect. Chat. Stay in touch.
          </p>
        </div>

        {error && (
          <div className="mb-5 rounded-xl bg-red-50 p-3 text-center text-sm text-red-600">
            {error}
          </div>
        )}

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
