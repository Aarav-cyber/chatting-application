import { useEffect, useState } from "react";

import {
  getConversations,
  getMessages,
  getUsers,
  createConversation,
  getPresence,
} from "../services/api";

import { useAuth } from "../context/AuthContext";

import { useSocket } from "../context/SocketContext";

import ChatLayout from "../components/chat/ChatLayout";

export default function Chat() {
  const { user, logout } = useAuth();

  const socket = useSocket();

  const [conversations, setConversations] = useState([]);

  const [selectedConversation, setSelectedConversation] = useState(null);

  const [messages, setMessages] = useState([]);

  const [searchResults, setSearchResults] = useState([]);

  const [typingUser, setTypingUser] = useState(null);

  const [onlineUsers, setOnlineUsers] = useState(new Set());

  // Load conversations and initial presence
  useEffect(() => {
    const loadConversations = async () => {
      try {
        const data = await getConversations();

        setConversations(data.conversations);

        const otherUserIds = data.conversations
          .flatMap((conversation) => conversation.participants)
          .filter((participant) => participant._id !== user._id)
          .map((participant) => participant._id);

        const uniqueUserIds = [...new Set(otherUserIds)];

        if (uniqueUserIds.length > 0) {
          const presenceData = await getPresence(uniqueUserIds);

          const onlineIds = Object.entries(presenceData.presence)
            .filter(([, online]) => online)
            .map(([userId]) => userId);

          setOnlineUsers(new Set(onlineIds));
        }
      } catch (error) {
        console.error("Failed to load conversations:", error);
      }
    };

    if (user?._id) {
      loadConversations();
    }
  }, [user]);

  // Socket listeners
  useEffect(() => {
    if (!socket) {
      return;
    }

    const receiveMessage = (message) => {
      setMessages((current) => {
        const exists = current.some((item) => item._id === message._id);

        if (exists) {
          return current;
        }

        return [...current, message];
      });

      setConversations((current) => {
        return current
          .map((conversation) => {
            if (conversation._id !== message.conversation) {
              return conversation;
            }

            const isCurrentConversation =
              selectedConversation?._id === conversation._id;

            const unread = conversation.unreadCounts?.[user._id] || 0;

            return {
              ...conversation,

              lastMessage: message,

              lastMessageAt: message.createdAt,

              unreadCounts: {
                ...conversation.unreadCounts,

                [user._id]: isCurrentConversation ? 0 : unread + 1,
              },
            };
          })
          .sort(
            (a, b) =>
              new Date(b.lastMessageAt || b.updatedAt) -
              new Date(a.lastMessageAt || a.updatedAt),
          );
      });
    };

    const messageSent = (message) => {
      setMessages((current) => {
        const exists = current.some((item) => item._id === message._id);

        if (exists) {
          return current;
        }

        return [...current, message];
      });
    };

    socket.on("receiveMessage", receiveMessage);

    socket.on("messageSent", messageSent);

    return () => {
      socket.off("receiveMessage", receiveMessage);

      socket.off("messageSent", messageSent);
    };
  }, [socket, selectedConversation, user]);

  // Typing listeners
  useEffect(() => {
    if (!socket) {
      return;
    }

    const handleTyping = ({ userId }) => {
      setTypingUser(userId);
    };

    const handleStoppedTyping = ({ userId }) => {
      setTypingUser((current) => {
        if (current === userId) {
          return null;
        }

        return current;
      });
    };

    socket.on("userTyping", handleTyping);

    socket.on("userStoppedTyping", handleStoppedTyping);

    return () => {
      socket.off("userTyping", handleTyping);

      socket.off("userStoppedTyping", handleStoppedTyping);
    };
  }, [socket]);

  // Online presence listeners
  useEffect(() => {
    if (!socket) {
      return;
    }

    const handleOnline = ({ userId }) => {
      setOnlineUsers((current) => {
        const next = new Set(current);

        next.add(userId);

        return next;
      });
    };

    const handleOffline = ({ userId }) => {
      setOnlineUsers((current) => {
        const next = new Set(current);

        next.delete(userId);

        return next;
      });
    };

    socket.on("userOnline", handleOnline);

    socket.on("userOffline", handleOffline);

    return () => {
      socket.off("userOnline", handleOnline);

      socket.off("userOffline", handleOffline);
    };
  }, [socket]);

  // Mark messages as read when conversation is opened
  useEffect(() => {
    if (!socket || !selectedConversation) {
      return;
    }

    socket.emit("markMessagesRead", {
      conversationId: selectedConversation._id,
    });
  }, [socket, selectedConversation]);

  // Delivery and read receipt listeners
  useEffect(() => {
    if (!socket) {
      return;
    }

    const handleDelivered = ({ messageId }) => {
      setMessages((current) =>
        current.map((message) =>
          message._id === messageId
            ? {
                ...message,
                status: "delivered",
              }
            : message,
        ),
      );
    };

    const handleRead = ({ messageId }) => {
      setMessages((current) =>
        current.map((message) =>
          message._id === messageId
            ? {
                ...message,
                status: "read",
              }
            : message,
        ),
      );
    };

    socket.on("messageDelivered", handleDelivered);

    socket.on("messageRead", handleRead);

    return () => {
      socket.off("messageDelivered", handleDelivered);

      socket.off("messageRead", handleRead);
    };
  }, [socket]);

  // Search users
  const handleSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const data = await getUsers(query);

      setSearchResults(data.users);
    } catch (error) {
      console.error("Search failed:", error);
    }
  };

  // Select existing conversation
  const handleSelectConversation = async (conversation) => {
    setSelectedConversation(conversation);

    try {
      const data = await getMessages(conversation._id);

      setMessages(data.messages);
    } catch (error) {
      console.error("Failed to load messages:", error);
    }
  };

  // Start conversation with user
  const handleSelectUser = async (otherUser) => {
    try {
      const data = await createConversation(otherUser._id);

      const conversation = data.conversation;

      setConversations((current) => {
        const exists = current.some((item) => item._id === conversation._id);

        if (exists) {
          return current;
        }

        return [conversation, ...current];
      });

      setSelectedConversation(conversation);

      setSearchResults([]);

      const messagesData = await getMessages(conversation._id);

      setMessages(messagesData.messages);
    } catch (error) {
      console.error("Failed to create conversation:", error);
    }
  };

  // Send message
  const handleSendMessage = (receiver, text) => {
    if (!socket) {
      console.error("Socket is not connected");

      return;
    }

    socket.emit(
      "sendMessage",
      {
        receiver,
        text,
      },
      (response) => {
        if (!response?.success) {
          console.error(response?.message);
        }
      },
    );
  };

  return (
    <ChatLayout
      conversations={conversations}
      selectedConversation={selectedConversation}
      onSelectConversation={handleSelectConversation}
      onSearch={handleSearch}
      searchResults={searchResults}
      onSelectUser={handleSelectUser}
      messages={messages}
      onSendMessage={handleSendMessage}
      user={user}
      onLogout={logout}
      typingUser={typingUser}
      onlineUsers={onlineUsers}
    />
  );
}
