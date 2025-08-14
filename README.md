## Chatting with Notification(mern)

A full‑stack real‑time chat application with Google Sign‑In, REST APIs, and Socket.IO for instant messaging. This monorepo contains a Node/Express backend (`backchat`) and a React + Vite frontend (`frontchat`).

### Table of Contents
- Overview
- Monorepo Layout
- Tech Stack
- UI Overview
- Backend: APIs, Models, Sockets, Env
- Frontend: Routing, OAuth, Sockets, Env
- Local Setup (Windows/macOS/Linux)
- API Reference (REST + Socket.IO)
- Project Scripts
- Notes & Caveats

## Overview
- **Auth**: Google OAuth on the client. On first login, a user record is created on the server.
- **Messaging**: Real‑time messaging via Socket.IO, persisted in MongoDB via Mongoose.
- **REST**: Simple APIs to log in, list users, send/fetch messages.
- **UI**: User list, selected chat view, message composer, and basic status.

## Monorepo Layout
```text
chatting with notification/
  backchat/               # Node.js + Express backend
    index.js
    package.json
    src/
      controllers/
        userController.js
      models/
        message.js
        user.js
      routes/
        auth.js
        rou-message.js

  frontchat/              # React + Vite frontend
    package.json
    src/
      App.jsx
      chatPage.jsx
      components/
        chat.jsx
        user.jsx
      login.jsx
      ProtectedRoute.jsx
      main.jsx
      assets/
```

## Tech Stack
- **Backend**: Node.js, Express, Mongoose, Socket.IO, CORS, dotenv
- **Frontend**: React 19, Vite 7, React Router 7, Socket.IO Client, `@react-oauth/google`, `jwt-decode`
- **Database**: MongoDB (via Mongoose)

## UI Overview
- **Login (`frontchat/src/login.jsx`)**: Google Sign‑In. On success, stores Google data in `localStorage`, calls backend `/api/login`, then navigates to the app.
- **App Router (`frontchat/src/App.jsx`)**:
  - `/login`: Login screen
  - `/chatapp`: Protected chat app (requires Google token) via `ProtectedRoute`
  - `/user`, `/chats`: Standalone component routes (helper/dev)
- **Chat App (`frontchat/src/chatPage.jsx`)**:
  - Sidebar with current user profile + user list (fetched from `/api/users`)
  - Connects to Socket.IO and joins a room with the current `user_id`
  - Loads conversation history for the selected user
  - Sends messages via the socket and displays incoming messages in real‑time
- **Chat View (`frontchat/src/components/chat.jsx`)**: Header, messages list, and message composer.

## Backend

### Environment
Create `backchat/.env` with:
```env
PORT=3001
MONGODB_URI=mongodb://127.0.0.1:27017/chatapp
```

### Server Entrypoint: `backchat/index.js`
- Loads env, configures CORS and JSON body parsing
- Connects to MongoDB using `MONGODB_URI`
- Mounts routes:
  - `/api` → `src/routes/auth.js`
  - `/api/messages` → `src/routes/rou-message.js`
- Starts HTTP server and attaches Socket.IO for real‑time messaging

### Data Models
- `src/models/user.js`
  - `googleId`, `name`, `email`, `profilePic`, `status` (default: “Hey there! I am using ChatApp.”), `createdAt`
- `src/models/message.js`
  - `sender` (ObjectId), `receiver` (ObjectId), `text` (String), `createdAt` (Date)

### REST Routes
- `src/routes/auth.js`
  - `POST /api/login` → find or create user by `google_id`; returns `{ user_id }`
  - `GET /api/users` → returns all users
- `src/routes/rou-message.js`
  - `POST /api/messages/send` → create and return a message `{ sender, receiver, text }`
  - `GET /api/messages/:user1/:user2` → chronological messages between two user IDs

### Socket.IO Events
- Namespace: root (`io.on('connection')` in `index.js`)
- Client emits:
  - `joinRoom` with `{ userId }` → server joins the socket to a user‑specific room
  - `sendMessage` with `{ sender, receiver, text }` → server persists and emits `receiveMessage` to both rooms
- Server emits:
  - `receiveMessage` with the persisted message payload

## Frontend

### Environment
While the current code uses hard‑coded values, you can move them to Vite env vars. Create `frontchat/.env`:
```env
VITE_API_BASE_URL=http://localhost:3001
VITE_SOCKET_URL=http://localhost:3001
VITE_GOOGLE_CLIENT_ID=YOUR_GOOGLE_OAUTH_CLIENT_ID
```

Then update the code to read from `import.meta.env` (optional improvement):
```js
// Example usage (not yet applied in code):
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL;
```

Current hard‑coded values to be aware of:
- Socket URL in `frontchat/src/chatPage.jsx`: `http://localhost:3001`
- Google Client ID in `frontchat/src/main.jsx`: embedded string

### Routing and Auth
- `App.jsx` defines routes. `ProtectedRoute.jsx` redirects to `/login` if `localStorage.googleToken` is missing.
- `login.jsx` performs Google Sign‑In and posts to `/api/login` to obtain a backend `user_id` stored in `localStorage`.

### Sockets and Data Flow
- `chatPage.jsx` connects via `socket.io-client`, joins the user room, listens for `receiveMessage`, and fetches message history when a conversation is selected.

## Local Setup (Windows/macOS/Linux)

### Prerequisites
- Node.js 18+ and npm
- MongoDB running locally or a cloud MongoDB connection string

### 1) Backend
```bash
cd backchat
npm install

# Create .env
echo PORT=3001 > .env
echo MONGODB_URI=mongodb://127.0.0.1:27017/chatapp >> .env

npm run dev
```

### 2) Frontend
```bash
cd frontchat
npm install

# Optional: create .env for cleaner config
# echo VITE_API_BASE_URL=http://localhost:3001 > .env
# echo VITE_SOCKET_URL=http://localhost:3001 >> .env
# echo VITE_GOOGLE_CLIENT_ID=YOUR_GOOGLE_OAUTH_CLIENT_ID >> .env

npm run dev
```

Open the printed Vite URL (typically `http://localhost:5173`).

## API Reference

### REST
- Base URL: `http://localhost:3001`

1) Login / Create User
```http
POST /api/login
Content-Type: application/json
{
  "full_name": "John Doe",
  "email": "john@example.com",
  "google_id": "google-sub-id",
  "profilePic": "https://.../avatar.png"
}
```
Response: `{ "user_id": "<ObjectId>" }`

2) List Users
```http
GET /api/users
```
Response: `[{ _id, googleId, name, email, profilePic, status, createdAt }, ...]`

3) Send Message
```http
POST /api/messages/send
Content-Type: application/json
{
  "sender": "<userId>",
  "receiver": "<userId>",
  "text": "Hello there!"
}
```
Response: the created message document

4) Fetch Conversation
```http
GET /api/messages/:user1/:user2
```
Response: array of messages sorted by `createdAt` ascending

### Socket.IO
- Connect to `VITE_SOCKET_URL` (or `http://localhost:3001`).

Client → Server:
```js
socket.emit('joinRoom', { userId: '<userId>' });
socket.emit('sendMessage', { sender: '<userId>', receiver: '<userId>', text: 'Hi' });
```

Server → Client:
```js
socket.on('receiveMessage', (message) => { /* update UI */ });
```

## Project Scripts

### Backend (`backchat/package.json`)
- `npm run dev` → start with nodemon on configured `PORT`

### Frontend (`frontchat/package.json`)
- `npm run dev` → start Vite dev server
- `npm run build` → production build
- `npm run preview` → preview production build
- `npm run lint` → ESLint

## Notes & Caveats
- The backend currently trusts the Google profile payload provided by the client when calling `/api/login`. For production, validate the Google ID token server‑side.
- CORS is configured with permissive `origin: '*'` for development; tighten for production.
- The chat UI styling in `components/chat.jsx` uses a simple check `msg.sender === 'me'` for message alignment; adapt to compare against the current user’s ID for accurate left/right alignment.
- Some listed backend packages (e.g., `cookie-parser`, `bcryptjs`, `cloudinary`, `jsonwebtoken`) are not currently used in the provided code; they may be leftovers or for future features.

---
This README documents the complete setup, architecture, and APIs of the project. Update environment values and hard‑coded URLs/IDs as needed for your environment.


