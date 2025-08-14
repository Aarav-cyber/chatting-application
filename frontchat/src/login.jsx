import Logo from "./assets/chat logo.png";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import { Navigate, useNavigate } from "react-router";

import "./App.css";

export default function Login() {
  const navigate = useNavigate();
  return (
    <>
      <div className="login-container">
        <img src={Logo} className="logo-image" alt="Chat Logo" />
        <h1>WELCOME TO CHATAPP</h1>

        <div className="para">
          <p>Sign in to start chatting with your friends</p>
          <p>and colleagues</p>
        </div>

        <div className="main-box">
          <h1>Sign In</h1>
          <p>Use your Google account to continue</p>
          <GoogleLogin
            onSuccess={(credentialResponse) => {
              console.log(credentialResponse);
              console.log("cc");
              localStorage.setItem(
                "googleToken",
                credentialResponse.credential
              );

              const decoded = jwtDecode(credentialResponse.credential);
              localStorage.setItem("data", JSON.stringify(decoded));
              localStorage.setItem("name", decoded.name);
              localStorage.setItem("email", decoded.email);
              localStorage.setItem("profilePic", decoded.picture);

              console.log(decoded);
              navigate(`/chatapp`);

              // Send data to PHP backend
              fetch("http://localhost:3001/api/login", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  full_name: decoded.name,
                  email: decoded.email,
                  google_id: decoded.sub, // This is the Google user ID
                  profilePic: decoded.picture,
                }),
              })
                .then((res) => res.json())
                .then((data) => localStorage.setItem("user_id", data.user_id))
                .catch((error) => console.error("Error:", error));
            }}
            onError={() => {
              console.log("Login Failed");
            }}
            className="google-login-button"
          />
          <p>By signing in, you agree to our Terms of Service</p>
          <p>and Privacy Policy</p>
          <p>
            New to ChatApp?{" "}
            <a href="#" className="learn-more">
              Learn more
            </a>
          </p>
        </div>
      </div>
    </>
  );
}
