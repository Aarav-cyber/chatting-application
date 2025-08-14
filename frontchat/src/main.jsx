import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google';


import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
<StrictMode>
    <GoogleOAuthProvider clientId="692737393214-tt9l51l6vvjp9f8gmn2ji4q1jgpnnm64.apps.googleusercontent.com">

        <App />
    </GoogleOAuthProvider>
  </StrictMode>,
)
