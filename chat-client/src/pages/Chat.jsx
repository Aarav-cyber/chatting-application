import { useEffect, useState } from "react";

import {
  getConversations,
  getMessages,
  getUsers,
  createConversation,
} from "../services/api";

import {
  useAuth,
} from "../context/AuthContext";

import {
  useSocket,
} from "../context/SocketContext";

import ChatLayout from "../components/chat/ChatLayout";

export default function Chat() {
  const { user, logout } =
    useAuth();

  const socket = useSocket();

  const [
    conversations,
    setConversations,
  ] = useState([]);

  const [
    selectedConversation,
    setSelectedConversation,
  ] = useState(null);

  const [
    messages,
    setMessages,
  ] = useState([]);

  const [
    searchResults,
    setSearchResults,
  ] = useState([]);

  // Load conversations
  useEffect(() => {
    const loadConversations =
      async () => {
        try {
          const data =
            await getConversations();

          setConversations(
            data.conversations
          );
        } catch (error) {
          console.error(
            "Failed to load conversations:",
            error
          );
        }
      };

    loadConversations();
  }, []);

  // Socket listeners
  useEffect(() => {
    if (!socket) {
      return;
    }

    const receiveMessage =
      (message) => {

        setMessages((current) => {

          const exists =
            current.some(
              (item) =>
                item._id ===
                message._id
            );

          if (exists) {
            return current;
          }

          return [
            ...current,
            message,
          ];
        });
      };

    const messageSent =
      (message) => {

        setMessages((current) => {

          const exists =
            current.some(
              (item) =>
                item._id ===
                message._id
            );

          if (exists) {
            return current;
          }

          return [
            ...current,
            message,
          ];
        });
      };

    socket.on(
      "receiveMessage",
      receiveMessage
    );

    socket.on(
      "messageSent",
      messageSent
    );

    return () => {
      socket.off(
        "receiveMessage",
        receiveMessage
      );

      socket.off(
        "messageSent",
        messageSent
      );
    };
  }, [socket]);

  // Search users
  const handleSearch = async (
    query
  ) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const data =
        await getUsers(query);

      setSearchResults(
        data.users
      );
    } catch (error) {
      console.error(
        "Search failed:",
        error
      );
    }
  };

  // Select existing conversation
  const handleSelectConversation =
    async (conversation) => {

      setSelectedConversation(
        conversation
      );

      try {
        const data =
          await getMessages(
            conversation._id
          );

        setMessages(
          data.messages
        );
      } catch (error) {
        console.error(
          "Failed to load messages:",
          error
        );
      }
    };

  // Start conversation with user
  const handleSelectUser =
    async (otherUser) => {

      try {
        const data =
          await createConversation(
            otherUser._id
          );

        const conversation =
          data.conversation;

        setConversations(
          (current) => {

            const exists =
              current.some(
                (item) =>
                  item._id ===
                  conversation._id
              );

            if (exists) {
              return current;
            }

            return [
              conversation,
              ...current,
            ];
          }
        );

        setSelectedConversation(
          conversation
        );

        setSearchResults([]);

        const messagesData =
          await getMessages(
            conversation._id
          );

        setMessages(
          messagesData.messages
        );

      } catch (error) {
        console.error(
          "Failed to create conversation:",
          error
        );
      }
    };

  // Send message
  const handleSendMessage = (
    receiver,
    text
  ) => {

    if (!socket) {
      console.error(
        "Socket is not connected"
      );

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
          console.error(
            response?.message
          );
        }
      }
    );
  };

  return (
    <ChatLayout
      conversations={
        conversations
      }
      selectedConversation={
        selectedConversation
      }
      onSelectConversation={
        handleSelectConversation
      }
      onSearch={
        handleSearch
      }
      searchResults={
        searchResults
      }
      onSelectUser={
        handleSelectUser
      }
      messages={messages}
      onSendMessage={
        handleSendMessage
      }
      user={user}
      onLogout={logout}
    />
  );
}