# BackChat — Scalable Real-Time Chat Platform

BackChat is a full-stack, real-time messaging platform built with **React, Node.js, Express, MongoDB, Socket.IO, Redis, and Docker**.

The system is designed around an **event-driven architecture** where REST APIs handle authentication, conversation discovery, user search, and message history, while **Socket.IO handles real-time communication** such as messaging, typing indicators, presence, delivery receipts, and read receipts.

The backend also uses the **Socket.IO Redis Adapter**, allowing multiple backend instances to communicate through Redis and making the real-time layer horizontally scalable.

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [System Architecture](#system-architecture)
- [Architecture Diagram](#architecture-diagram)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Authentication](#authentication)
- [Real-Time Messaging](#real-time-messaging)
- [Message Lifecycle](#message-lifecycle)
- [Typing Indicators](#typing-indicators)
- [Online Presence](#online-presence)
- [Message Delivery Receipts](#message-delivery-receipts)
- [Read Receipts](#read-receipts)
- [Unread Message Counts](#unread-message-counts)
- [Conversation Ordering](#conversation-ordering)
- [Redis and Horizontal Scaling](#redis-and-horizontal-scaling)
- [Database Design](#database-design)
- [Backend Architecture](#backend-architecture)
- [Frontend Architecture](#frontend-architecture)
- [REST API](#rest-api)
- [Socket.IO API](#socketio-api)
- [Environment Variables](#environment-variables)
- [Running the Project Locally](#running-the-project-locally)
- [Docker Deployment](#docker-deployment)
- [Production Architecture](#production-architecture)
- [Scalability](#scalability)
- [Reliability and Failure Handling](#reliability-and-failure-handling)
- [Security](#security)
- [Development Workflow](#development-workflow)
- [Future Improvements](#future-improvements)
- [Project Summary](#project-summary)

---

# Overview

BackChat is designed as a production-oriented real-time messaging system rather than a simple client-to-client chat application.

The application provides:

- Google-based authentication
- JWT-authenticated Socket.IO connections
- One-to-one conversations
- Persistent messages using MongoDB
- Real-time message delivery
- Typing indicators
- Online/offline presence
- Message delivery status
- Read receipts
- Conversation unread counts
- Real-time conversation list updates
- User search
- Redis-backed Socket.IO scaling
- Multiple concurrent connections per user
- Docker-based development and deployment

The system separates **request/response operations** from **real-time operations**.

REST APIs are used when the client needs persistent resources:

```text
Authentication
User search
Conversation history
Conversation creation
Initial application data

Socket.IO is used when the application needs low-latency real-time communication:

```text
New messages
Typing indicators
Online/offline events
Delivery receipts
Read receipts
```

This separation keeps the architecture clean and allows each part of the system to scale independently.

---

# Key Features

## Authentication

* Google authentication
* Backend JWT authentication
* JWT validation during Socket.IO handshake
* Authenticated user identity attached to the socket
* Server derives sender identity from the verified JWT

## Messaging

* One-to-one conversations
* Persistent message storage
* Real-time message delivery
* Duplicate message protection on the frontend
* Conversation creation when necessary

## Message Status

Messages move through states such as:

```text
sent
  ↓
delivered
  ↓
read
```

The system supports:

* Sent indicator: `✓`
* Delivered indicator: `✓✓`
* Read indicator: `✓✓`

## Presence

Users can be:

```text
Online
Offline
```

Multiple browser tabs/devices are supported by maintaining a socket connection count per user.

## Typing Indicators

When a user types:

```text
User A
   ↓
typing
   ↓
User B sees:
"Aarav is typing..."
```

Typing events are debounced so the client does not continuously generate unnecessary events.

## Read Receipts

When a conversation is opened:

```text
Conversation opened
        ↓
markMessagesRead
        ↓
Backend identifies unread messages
        ↓
Messages become read
        ↓
Unread count becomes 0
        ↓
Sender receives messageRead
```

## Unread Counts

Each conversation maintains unread counts for its participants.

Example:

```text
John                 3
Hey, are you free?
```

When the conversation is opened, the unread count is reset.

---

# System Architecture

The high-level architecture is:

```text
                         ┌──────────────────────┐
                         │       Browser        │
                         │                      │
                         │ React + Vite         │
                         │ Socket.IO Client     │
                         └──────────┬───────────┘
                                    │
                         HTTP / WebSocket
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │    Load Balancer     │
                         └──────────┬───────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
             ┌────────────┐ ┌────────────┐ ┌────────────┐
             │ Backend #1  │ │ Backend #2 │ │ Backend #3 │
             │ Node/       │ │ Node/      │ │ Node/      │
             │ Express     │ │ Express    │ │ Express    │
             │ Socket.IO   │ │ Socket.IO  │ │ Socket.IO  │
             └──────┬─────┘ └──────┬─────┘ └──────┬─────┘
                    │              │              │
                    └──────────────┼──────────────┘
                                   │
                                   ▼
                         ┌──────────────────────┐
                         │        Redis         │
                         │                      │
                         │ Socket.IO Adapter    │
                         │ Pub/Sub              │
                         └──────────┬───────────┘
                                    │
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │       MongoDB        │
                         │                      │
                         │ Users                │
                         │ Conversations        │
                         │ Messages             │
                         └──────────────────────┘
```

The important architectural principle is that **Socket.IO connections do not have to terminate on the same backend instance**.

Redis allows Socket.IO servers to exchange events.

For example:

```text
User A
  │
  │ WebSocket
  ▼
Backend #1
  │
  │ Redis Adapter
  ▼
Redis
  │
  ▼
Backend #2
  │
  │ WebSocket
  ▼
User B
```

Therefore, User A and User B can be connected to completely different backend instances.

---

# Architecture Diagram

A complete message flow looks like this:

```text
                    USER A
                      │
                      │ sendMessage
                      ▼
             ┌─────────────────┐
             │ Socket.IO Server│
             └────────┬────────┘
                      │
                      │ JWT identity
                      ▼
             ┌─────────────────┐
             │ Validate Request│
             └────────┬────────┘
                      │
                      ▼
             ┌─────────────────┐
             │ Conversation    │
             │ Service         │
             └────────┬────────┘
                      │
                      ▼
             ┌─────────────────┐
             │ MongoDB         │
             │ Create Message  │
             └────────┬────────┘
                      │
             ┌────────┴────────┐
             │                 │
             ▼                 ▼
       Receiver Online?     Conversation
             │              Update
             ▼
      fetchSockets()
             │
        ┌────┴────┐
        │         │
       YES        NO
        │         │
        ▼         ▼
   delivered      sent
        │
        └────────┬─────────┐
                 │         │
                 ▼         ▼
             Redis      Socket.IO
                 │         │
                 └────┬────┘
                      │
                      ▼
                    USER B
```

---

# Technology Stack

## Frontend

| Technology       | Purpose                            |
| ---------------- | ---------------------------------- |
| React            | UI                                 |
| Vite             | Frontend development/build tooling |
| React Router     | Application routing                |
| Socket.IO Client | Real-time communication            |
| Tailwind CSS     | UI styling                         |

## Backend

| Technology | Purpose                   |
| ---------- | ------------------------- |
| Node.js    | Runtime                   |
| Express.js | REST API                  |
| Socket.IO  | Real-time communication   |
| JWT        | Socket authentication     |
| Mongoose   | MongoDB ODM               |
| dotenv     | Environment configuration |

## Infrastructure

| Technology     | Purpose                                          |
| -------------- | ------------------------------------------------ |
| MongoDB        | Persistent data storage                          |
| Redis          | Socket.IO adapter / cross-instance communication |
| Docker         | Containerization                                 |
| Docker Compose | Local multi-container development                |

---

# Project Structure

The project is organized as a frontend/backend monorepo.

```text
backchat/
│
├── index.js
├── package.json
├── Dockerfile
├── .env
│
└── src/
    │
    ├── config/
    │   └── redis.js
    │
    ├── controllers/
    │
    ├── middleware/
    │
    ├── models/
    │   ├── user.js
    │   ├── message.js
    │   └── conversation.js
    │
    ├── routes/
    │
    ├── services/
    │   └── conversationService.js
    │
    └── socket/
        └── index.js
```

Frontend:

```text
chat-client/
│
├── package.json
├── vite.config.js
├── Dockerfile
│
└── src/
    │
    ├── components/
    │   └── chat/
    │       ├── ChatLayout.jsx
    │       ├── ChatWindow.jsx
    │       └── MessageBubble.jsx
    │
    ├── context/
    │   ├── AuthContext.jsx
    │   └── SocketContext.jsx
    │
    ├── pages/
    │   └── Chat.jsx
    │
    └── services/
        └── api.js
```

---

# Authentication

Authentication has two separate responsibilities.

## HTTP Authentication

The frontend authenticates the user and obtains the application's authentication information.

The authenticated user is then used for REST API requests.

## Socket Authentication

When establishing the Socket.IO connection, the frontend sends the JWT:

```javascript
const socket = io(SOCKET_URL, {
  auth: {
    token,
  },
});
```

The backend validates the token:

```javascript
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error("Authentication required"));
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    socket.userId = decoded.userId;

    next();
  } catch (error) {
    next(new Error("Invalid or expired token"));
  }
});
```

The important security principle is:

```text
Client says:
"I am user B"

        ❌

Server trusts:
JWT says:
"user B"

        ✅
```

The sender ID is never trusted from the client when sending a message.

Instead:

```javascript
sender: socket.userId
```

This prevents a client from simply pretending to be another user.

---

# Real-Time Messaging

Each authenticated user joins a private Socket.IO room.

```javascript
socket.join(socket.userId);
```

For example:

```text
User A → room "A"
User B → room "B"
User C → room "C"
```

When A sends a message to B:

```javascript
io.to(receiver).emit(
  "receiveMessage",
  message
);
```

Because B is inside room `B`, the message is delivered to B's connected sockets.

The sender also receives a confirmation:

```javascript
io.to(socket.userId).emit(
  "messageSent",
  message
);
```

This allows the sender UI to display its own persisted message.

---

# Message Lifecycle

A complete message lifecycle is:

```text
User types message
       ↓
Frontend emits sendMessage
       ↓
Socket.IO server receives event
       ↓
JWT identifies sender
       ↓
Conversation created/found
       ↓
Message stored in MongoDB
       ↓
Check receiver sockets
       ↓
┌──────────────────────────┐
│ Receiver currently online│
└────────────┬─────────────┘
             │
        ┌────┴────┐
        │         │
       YES        NO
        │         │
        ▼         ▼
   delivered     sent
        │
        ▼
receiveMessage
        │
        ▼
Receiver UI
```

The message is always persisted before it is considered successfully processed.

---

# Typing Indicators

Typing indicators are implemented using Socket.IO events.

The frontend emits:

```javascript
socket.emit("typing", {
  receiver: otherUser._id,
});
```

The backend forwards it:

```javascript
io.to(receiver).emit(
  "userTyping",
  {
    userId: socket.userId,
  }
);
```

When typing stops:

```javascript
socket.emit("stopTyping", {
  receiver: otherUser._id,
});
```

The backend sends:

```javascript
io.to(receiver).emit(
  "userStoppedTyping",
  {
    userId: socket.userId,
  }
);
```

## Debouncing

Typing is debounced on the client.

The flow is:

```text
User types
   ↓
typing event
   ↓
Timer reset
   ↓
User types again
   ↓
Timer reset
   ↓
User stops typing
   ↓
1 second
   ↓
stopTyping
```

This prevents a continuous stream of unnecessary events.

---

# Online Presence

Each authenticated user joins their own room.

The server also tracks active sockets:

```javascript
const onlineUsers = new Map();
```

The value represents the number of active connections for a user.

For example:

```text
User A
 ├── Chrome
 ├── Firefox
 └── Mobile

onlineUsers[A] = 3
```

When the first connection is established:

```javascript
io.emit("userOnline", {
  userId: socket.userId,
});
```

When one connection closes, the user remains online if other connections still exist.

Only when the final connection closes:

```javascript
io.emit("userOffline", {
  userId: socket.userId,
});
```

This prevents incorrect offline states when a user has multiple tabs or devices.

---

# Message Delivery Receipts

After creating a message, the backend checks whether the receiver currently has any active sockets:

```javascript
const receiverSockets =
  await io.in(receiver).fetchSockets();

const isReceiverOnline =
  receiverSockets.length > 0;
```

If the receiver is online:

```javascript
message.status = "delivered";

await message.save();
```

The sender is then notified:

```javascript
io.to(socket.userId).emit(
  "messageDelivered",
  {
    messageId: message._id,
  }
);
```

The lifecycle is:

```text
Message created
      ↓
Receiver has socket?
      ↓
   ┌──┴──┐
   │     │
  YES    NO
   │     │
   ▼     ▼
delivered sent
   │
   ▼
messageDelivered
```

---

# Read Receipts

When the user opens a conversation, the frontend emits:

```javascript
socket.emit(
  "markMessagesRead",
  {
    conversationId:
      selectedConversation._id,
  }
);
```

The backend validates that the authenticated user belongs to the conversation.

It then finds messages where:

```text
conversation = selected conversation
receiver = current user
status != read
```

Those messages are updated:

```javascript
{
  status: "read",
  readAt: new Date()
}
```

The sender receives:

```javascript
io.to(
  message.sender.toString()
).emit(
  "messageRead",
  {
    messageId: message._id,
    conversationId,
    readAt,
  }
);
```

The sender's UI then updates the message:

```text
✓       sent

✓✓      delivered

✓✓      read
```

---

# Unread Message Counts

Each conversation maintains unread counts per participant.

Conceptually:

```javascript
unreadCounts: {
  userA: 0,
  userB: 3
}
```

When User A sends a message to User B:

```text
B unread count
3 → 4
```

When B opens the conversation:

```text
4 → 0
```

The frontend displays the count:

```text
John                         3
Hey, are you free?
```

The unread count is only increased when the conversation is not currently open.

---

# Conversation Ordering

Whenever a new message arrives, the conversation list is updated.

The conversation receives:

```javascript
lastMessage = message;
lastMessageAt = message.createdAt;
```

The conversation list is then sorted by:

```text
lastMessageAt
```

descending.

Therefore:

```text
Before:

Alice
Bob
Charlie

Bob sends message

After:

Bob
Alice
Charlie
```

This provides the expected behavior of modern messaging applications.

---

# Redis and Horizontal Scaling

A major part of the architecture is the Socket.IO Redis Adapter.

Without Redis, each Node.js instance would maintain its own Socket.IO world.

For example:

```text
                    Load Balancer
                         │
             ┌───────────┴───────────┐
             ▼                       ▼
        Backend #1              Backend #2
             │                       │
         User A                  User B
```

If A is connected to Backend #1 and B is connected to Backend #2, Backend #1 would not automatically know about B's socket.

Redis solves this.

```text
                    Load Balancer
                         │
             ┌───────────┴───────────┐
             ▼                       ▼
        Backend #1              Backend #2
             │                       │
             └───────────┬───────────┘
                         │
                         ▼
                       Redis
```

The Socket.IO adapter is initialized using:

```javascript
io.adapter(
  createAdapter(
    pubClient,
    subClient
  )
);
```

This allows events to propagate between Socket.IO instances.

---

# Why Redis Is Important

Suppose:

```text
User A → Backend #1

User B → Backend #2
```

A sends:

```javascript
io.to("B").emit(
  "receiveMessage",
  message
);
```

The Redis adapter communicates across the Socket.IO cluster.

Conceptually:

```text
Backend #1
    │
    │ publish event
    ▼
 Redis
    │
    │ propagate event
    ▼
Backend #2
    │
    ▼
User B
```

This allows the backend to scale horizontally.

---

# Horizontal Scaling

The architecture can scale from:

```text
1 backend
```

to:

```text
Backend #1
Backend #2
Backend #3
Backend #4
...
```

behind a load balancer.

Example:

```text
                         Load Balancer
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
          ▼                   ▼                   ▼
     Node.js #1          Node.js #2          Node.js #3
          │                   │                   │
          └───────────────────┼───────────────────┘
                              │
                              ▼
                            Redis
                              │
                              ▼
                           MongoDB
```

The real-time layer therefore does not depend on a single Node.js process.

---

# Database Design

MongoDB stores the persistent application state.

## User

Conceptually:

```text
User
├── _id
├── googleId
├── name
├── email
├── profilePic
├── status
└── createdAt
```

## Conversation

Conceptually:

```text
Conversation
├── _id
├── participants[]
├── lastMessage
├── lastMessageAt
├── unreadCounts
└── timestamps
```

## Message

Conceptually:

```text
Message
├── _id
├── conversation
├── sender
├── receiver
├── text
├── status
├── readAt
└── createdAt
```

The relationship is:

```text
User
 │
 ├──────────────┐
 │              │
 ▼              ▼
Conversation   Message
 │              │
 └──────────────┘
```

Messages reference conversations rather than duplicating the entire conversation structure.

---

# Backend Architecture

The backend follows a layered structure.

```text
Socket / REST Route
       ↓
Controller
       ↓
Service
       ↓
Model
       ↓
MongoDB
```

For example:

```text
sendMessage
     ↓
Socket.IO event
     ↓
conversationService
     ↓
Conversation
     ↓
Message
     ↓
MongoDB
```

The conversation logic is isolated in:

```text
src/services/conversationService.js
```

This prevents business logic from becoming tightly coupled to Socket.IO handlers.

---

# Frontend Architecture

The frontend is divided into:

```text
Pages
  ↓
Components
  ↓
Contexts
  ↓
Services
```

## Chat Page

`Chat.jsx` acts as the main application state coordinator.

It manages:

```text
conversations
selectedConversation
messages
searchResults
typingUser
onlineUsers
```

It also manages Socket.IO listeners for:

```text
receiveMessage
messageSent
userTyping
userStoppedTyping
userOnline
userOffline
messageDelivered
messageRead
```

## Chat Layout

`ChatLayout.jsx` manages the main UI structure:

```text
┌──────────────────────────────────────────┐
│                  BackChat                 │
├───────────────┬──────────────────────────┤
│ Conversations │                          │
│               │       Chat Window        │
│ User A        │                          │
│ User B        │       Messages           │
│ User C        │                          │
│               │       Input              │
└───────────────┴──────────────────────────┘
```

## Chat Window

`ChatWindow.jsx` manages:

* Message display
* Input
* Sending messages
* Typing events
* Online/offline state
* Conversation header

## Message Bubble

`MessageBubble.jsx` is responsible for displaying:

* Message text
* Timestamp
* Sent status
* Delivered status
* Read status

---

# REST API

REST APIs are used for operations that do not require persistent WebSocket connections.

Typical operations include:

```text
Authentication
User search
Conversation retrieval
Message history
Conversation creation
```

The REST base URL is configured using:

```env
VITE_API_BASE_URL
```

---

# Socket.IO API

## Client → Server

### `typing`

```javascript
socket.emit("typing", {
  receiver: receiverId,
});
```

### `stopTyping`

```javascript
socket.emit("stopTyping", {
  receiver: receiverId,
});
```

### `sendMessage`

```javascript
socket.emit(
  "sendMessage",
  {
    receiver,
    text,
  },
  callback
);
```

### `markMessagesRead`

```javascript
socket.emit(
  "markMessagesRead",
  {
    conversationId,
  }
);
```

---

# Server → Client

## `receiveMessage`

Sent when a receiver gets a new message.

```javascript
socket.on(
  "receiveMessage",
  (message) => {
    // update messages
  }
);
```

## `messageSent`

Confirms the sender's message.

```javascript
socket.on(
  "messageSent",
  (message) => {
    // update sender UI
  }
);
```

## `messageDelivered`

Notifies the sender that the receiver is online and the message has been delivered.

```javascript
socket.on(
  "messageDelivered",
  ({ messageId }) => {
    // update status
  }
);
```

## `messageRead`

Notifies the sender that the receiver read the message.

```javascript
socket.on(
  "messageRead",
  ({
    messageId,
    conversationId,
    readAt,
  }) => {
    // update status
  }
);
```

## `userTyping`

```javascript
socket.on(
  "userTyping",
  ({ userId }) => {
    // show typing indicator
  }
);
```

## `userStoppedTyping`

```javascript
socket.on(
  "userStoppedTyping",
  ({ userId }) => {
    // hide typing indicator
  }
);
```

## `userOnline`

```javascript
socket.on(
  "userOnline",
  ({ userId }) => {
    // update presence
  }
);
```

## `userOffline`

```javascript
socket.on(
  "userOffline",
  ({ userId }) => {
    // update presence
  }
);
```

---

# Environment Variables

## Backend

Create:

```text
backchat/.env
```

Example:

```env
PORT=3001

MONGODB_URI=mongodb://127.0.0.1:27017/backchat

JWT_SECRET=your_secure_jwt_secret

CLIENT_URL=http://localhost:5173

REDIS_URL=redis://localhost:6379

INSTANCE_ID=backend-1
```

The exact Redis configuration depends on the implementation in:

```text
src/config/redis.js
```

---

# Frontend

Create:

```text
chat-client/.env
```

Example:

```env
VITE_API_BASE_URL=http://localhost:3001

VITE_SOCKET_URL=http://localhost:3001
```

Do not commit `.env` files containing secrets.

---

# Running the Project Locally

## Prerequisites

Install:

* Node.js
* npm
* MongoDB
* Redis
* Git

Docker can also be used instead of installing MongoDB and Redis directly.

---

## 1. Clone the repository

```bash
git clone <YOUR_REPOSITORY_URL>

cd <PROJECT_DIRECTORY>
```

---

## 2. Start MongoDB

Make sure MongoDB is running.

Example:

```text
mongodb://127.0.0.1:27017/backchat
```

---

## 3. Start Redis

Make sure Redis is running:

```text
redis://localhost:6379
```

---

## 4. Start Backend

```bash
cd backchat

npm install

npm run dev
```

The backend should start on:

```text
http://localhost:3001
```

---

## 5. Start Frontend

Open another terminal:

```bash
cd chat-client

npm install

npm run dev
```

The frontend should be available at:

```text
http://localhost:5173
```

---

# Docker Deployment

The project can be containerized so that the complete local environment can run using Docker.

Conceptually:

```text
Docker Compose
│
├── frontend
│
├── backend
│
├── redis
│
└── mongodb
```

Example:

```bash
docker compose up --build
```

To stop:

```bash
docker compose down
```

To rebuild:

```bash
docker compose up --build
```

---

# Production Architecture

A production deployment can be structured as:

```text
                         Internet
                            │
                            ▼
                    ┌───────────────┐
                    │ Load Balancer │
                    └───────┬───────┘
                            │
              ┌─────────────┼─────────────┐
              │             │             │
              ▼             ▼             ▼
          Backend 1     Backend 2     Backend 3
              │             │             │
              └─────────────┼─────────────┘
                            │
                            ▼
                         Redis
                            │
                            ▼
                         MongoDB
```

The frontend can be hosted separately using a static hosting platform or CDN.

```text
CDN / Static Hosting
        │
        ▼
React Application
        │
        ├──────────────► Load Balancer
        │
        └──────────────► Socket.IO
```

---

# Scalability

The system is designed to scale horizontally.

## Backend Scaling

Node.js instances are stateless with respect to Socket.IO event propagation.

Multiple instances can run:

```text
Backend #1
Backend #2
Backend #3
Backend #N
```

The Redis adapter coordinates Socket.IO communication between them.

## Redis

Redis provides the cross-instance communication layer.

It prevents the architecture from depending on a single Socket.IO server.

## MongoDB

MongoDB provides persistent storage.

As the dataset grows, database performance can be improved through:

* Proper indexes
* Query optimization
* Pagination
* Connection pooling
* Replica sets
* Read scaling where appropriate
* Sharding for very large workloads

## Load Balancing

A load balancer distributes HTTP and WebSocket connections across backend instances.

The Socket.IO Redis Adapter ensures that events can reach users connected to another instance.

---

# Reliability and Failure Handling

The system separates persistent state from transient real-time state.

MongoDB contains the durable state:

```text
Users
Conversations
Messages
Message status
Unread counts
```

Socket.IO provides the transient communication channel:

```text
Typing
Presence
Real-time delivery
Read receipt notifications
```

If a WebSocket connection is lost, the message remains persisted in MongoDB.

When the user reconnects, the application can retrieve conversation history through the REST API.

This means:

```text
WebSocket failure
      ↓
Message data is still safe
      ↓
MongoDB
      ↓
Client reconnects
      ↓
Fetch history
```

---

# Security

The application follows several important security principles.

## JWT Socket Authentication

Sockets cannot connect without a valid authentication token.

```text
Client
  ↓
JWT
  ↓
Socket.IO middleware
  ↓
jwt.verify()
  ↓
Authenticated socket
```

## Server-Controlled Sender Identity

The client does not determine the sender.

Instead:

```javascript
sender: socket.userId
```

This prevents basic sender impersonation.

## Conversation Authorization

Read-receipt operations verify that the authenticated user belongs to the conversation:

```javascript
Conversation.findOne({
  _id: conversationId,
  participants: socket.userId,
});
```

## Environment Secrets

Secrets should be stored in environment variables rather than committed to Git.

Examples:

```text
JWT_SECRET
MONGODB_URI
REDIS credentials
OAuth credentials
```

## Production CORS

Development:

```text
localhost
```

Production should restrict CORS to the actual frontend origin.

---

# Important Design Decisions

## Why REST + Socket.IO?

REST is well suited for:

```text
Fetch users
Fetch conversations
Fetch message history
Create resources
```

Socket.IO is well suited for:

```text
Real-time messages
Typing
Presence
Delivery
Read receipts
```

Using both gives the application a clean separation between persistent APIs and real-time events.

---

## Why MongoDB?

Chat data naturally consists of related documents:

```text
Users
Conversations
Messages
```

MongoDB provides flexible document storage and works naturally with Mongoose references.

---

## Why Redis?

Redis is used primarily for coordinating Socket.IO servers.

Without Redis:

```text
Backend #1 ≠ Backend #2
```

With the Redis adapter:

```text
Backend #1
     ↕
   Redis
     ↕
Backend #2
```

This enables horizontal scaling.

---

# Development Workflow

A typical development flow is:

```text
1. Start MongoDB
       ↓
2. Start Redis
       ↓
3. Start backend
       ↓
4. Start frontend
       ↓
5. Login
       ↓
6. Open conversation
       ↓
7. Socket connection established
       ↓
8. Exchange messages
       ↓
9. Test typing
       ↓
10. Test presence
       ↓
11. Test delivery receipts
       ↓
12. Test read receipts
```

---

# Testing the Real-Time System

The easiest way to test the application is using two browser sessions.

For example:

```text
Browser A
User A

Browser B
User B
```

Then test:

### Messaging

```text
A → B
```

B should immediately receive the message.

### Typing

```text
A starts typing
```

B should see:

```text
A is typing...
```

### Presence

Close Browser B.

A should see:

```text
Offline
```

Reconnect B.

A should see:

```text
Online
```

### Delivery

Send a message while B is online:

```text
✓✓
```

### Read

B opens the conversation:

```text
✓✓
```

with the message status updated to `read`.

### Unread Counts

Send messages while B is viewing another conversation:

```text
Conversation A    3
Conversation B
```

Open Conversation A:

```text
Conversation A
Conversation B
```

The unread count becomes zero.

---

# Future Improvements

The current architecture provides a strong foundation for additional messaging features.

Potential improvements include:

## Message Pagination

Instead of loading every message:

```text
GET /messages
```

support:

```text
GET /messages?cursor=...
```

This allows conversations with millions of messages to remain efficient.

## Message Search

Add full-text or search-engine-backed message search.

## Group Conversations

Extend:

```text
participants[]
```

to support multiple users.

## Attachments

Support:

```text
Images
Videos
Documents
Audio
```

using object storage such as S3.

## Push Notifications

Add notifications for users who are offline.

```text
Message
   ↓
Receiver offline
   ↓
Push notification
```

## Redis Presence

The current in-memory:

```javascript
const onlineUsers = new Map();
```

is local to an individual Node.js instance.

For a fully distributed production presence system, presence state should be moved to Redis.

This would make online status consistent across all backend instances.

## Message Retry / Delivery Queue

A message queue can be introduced for asynchronous operations such as:

```text
Push notifications
Email notifications
Media processing
Analytics
```

## Rate Limiting

Add rate limits to:

```text
Authentication
User search
Message sending
Socket events
```

to prevent abuse.

---

# Production Scaling Roadmap

The system can evolve progressively.

## Stage 1 — Local Development

```text
React
   │
Node.js
   │
MongoDB
   │
Redis
```

## Stage 2 — Single Production Server

```text
Frontend
   │
Backend
   │
Redis
   │
MongoDB
```

## Stage 3 — Horizontal Backend Scaling

```text
             Load Balancer
                   │
       ┌───────────┼───────────┐
       ▼           ▼           ▼
    Backend     Backend     Backend
       │           │           │
       └───────────┼───────────┘
                   ▼
                 Redis
                   │
                   ▼
                MongoDB
```

## Stage 4 — Large-Scale Production

```text
                         CDN
                          │
                          ▼
                       React
                          │
                          ▼
                    Load Balancer
                          │
             ┌────────────┼────────────┐
             ▼            ▼            ▼
          API/WS        API/WS       API/WS
             │            │            │
             └────────────┼────────────┘
                          │
                    Redis Cluster
                          │
             ┌────────────┼────────────┐
             ▼            ▼            ▼
        MongoDB       Queue/Worker   Storage
        Cluster
```

At this stage, asynchronous processing can be separated into dedicated workers.

---

# Project Scripts

## Backend

```bash
npm run dev
```

Starts the backend in development mode.

Production:

```bash
npm start
```

if configured in `package.json`.

## Frontend

```bash
npm run dev
```

Starts the Vite development server.

Build:

```bash
npm run build
```

Preview:

```bash
npm run preview
```

Lint:

```bash
npm run lint
```

---

# Troubleshooting

## Socket does not connect

Check:

```text
VITE_SOCKET_URL
CLIENT_URL
JWT_SECRET
```

Also verify that the backend is running.

## Messages are not appearing

Check:

```text
MongoDB connection
Socket.IO connection
JWT authentication
receiver room
```

The browser console and backend logs should be checked first.

## Online status is incorrect

Remember that the current in-memory presence map:

```javascript
onlineUsers
```

is local to a Node.js instance.

When running multiple backend instances, use Redis-backed presence for globally consistent presence.

## Messages disappear after refresh

Messages are persistent in MongoDB, but the frontend needs to fetch conversation history again after reconnecting or refreshing.

---

# Engineering Principles

BackChat follows several important backend engineering principles:

### Persistent State vs Transient State

Persistent:

```text
MongoDB
```

Transient:

```text
Socket.IO
```

### Authentication vs Authorization

Authentication determines:

```text
Who is this user?
```

Authorization determines:

```text
Is this user allowed to perform this operation?
```

### Synchronous vs Real-Time Communication

REST:

```text
Request → Response
```

Socket.IO:

```text
Event → Event
```

### Horizontal Scalability

Multiple Node.js instances communicate through:

```text
Redis Adapter
```

rather than depending on one server process.

---

# Project Summary

BackChat is a scalable real-time messaging platform that combines:

```text
React
   +
Node.js
   +
Express
   +
Socket.IO
   +
MongoDB
   +
Redis
   +
Docker
```

The core architecture separates persistent application data from real-time communication.

MongoDB stores the durable state of the system, while Socket.IO provides low-latency communication between clients. Redis connects multiple Socket.IO instances, allowing the backend to scale horizontally behind a load balancer.

The message lifecycle supports:

```text
Sent
  ↓
Delivered
  ↓
Read
```

while the real-time layer also provides:

```text
Typing Indicators
Online Presence
Unread Counts
Conversation Ordering
Delivery Receipts
Read Receipts
```

The architecture is intentionally designed so that additional infrastructure can be introduced without rewriting the core messaging system.

The system can therefore evolve from a local development application into a horizontally scalable production chat platform.

---

# License

This project is intended for educational, portfolio, and development purposes.

Add your preferred license here if the repository is being distributed publicly.

```
```
