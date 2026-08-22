import { useEffect, useRef, useState } from "react";
import { useSocket } from "../../context/SocketContext";

export default function ChatWindow({
  conversation,
  messages,
  onSendMessage,
  currentUser,
  typingUser,
  onlineUsers,
}) {
  const socket = useSocket();
  const typingTimeoutRef = useRef(null);

  const [text, setText] = useState("");

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  // Cleanup typing timer
  useEffect(() => {
    return () => {
      clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  if (!conversation) {
    return (
      <div className="h-full flex items-center justify-center text-slate-400">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Welcome to BackChat</h2>

          <p className="mt-2">Select a conversation to start chatting.</p>
        </div>
      </div>
    );
  }

  const otherUser = conversation.participants.find(
    (participant) => participant._id !== currentUser._id,
  );

  const isOnline = otherUser && onlineUsers?.has(otherUser._id);

  const handleTyping = (value) => {
    setText(value);

    if (!socket || !otherUser) {
      return;
    }

    if (!value.trim()) {
      clearTimeout(typingTimeoutRef.current);

      socket.emit("stopTyping", {
        receiver: otherUser._id,
      });

      return;
    }

    socket.emit("typing", {
      receiver: otherUser._id,
    });

    clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stopTyping", {
        receiver: otherUser._id,
      });
    }, 1000);
  };

  const send = () => {
    if (!text.trim()) {
      return;
    }

    if (socket && otherUser) {
      socket.emit("stopTyping", {
        receiver: otherUser._id,
      });
    }

    clearTimeout(typingTimeoutRef.current);

    onSendMessage(otherUser._id, text);

    setText("");
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <header className="h-20 bg-white border-b border-slate-200 flex items-center px-6">
        <img src={otherUser?.profilePic} className="h-11 w-11 rounded-full" />

        <div className="ml-3">
          <h2 className="font-semibold">{otherUser?.name}</h2>

          <p className="text-xs text-slate-500">
            {isOnline ? "Online" : "Offline"}
          </p>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-3">
        {messages.map((message) => {
          const isMine = message.sender?._id === currentUser._id;

          return (
            <div
              key={message._id}
              className={`flex ${isMine ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-md rounded-2xl px-4 py-3 ${
                  isMine
                    ? "bg-slate-900 text-white"
                    : "bg-white border border-slate-200"
                }`}
              >
                <p>{message.text}</p>

                <p
                  className={`mt-1 text-[10px] ${
                    isMine ? "text-slate-400" : "text-slate-400"
                  }`}
                >
                  {new Date(message.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* Typing Indicator */}
      {typingUser && (
        <div className="px-6 pb-2 text-sm text-slate-400">
          {otherUser?.name} is typing...
        </div>
      )}

      {/* Input */}
      <div className="bg-white border-t border-slate-200 p-4">
        <div className="flex gap-3">
          <input
            value={text}
            onChange={(e) => handleTyping(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Type a message..."
            className="flex-1 rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-400"
          />
          <button
            onClick={send}
            className="rounded-xl bg-slate-900 px-6 text-white hover:bg-slate-800"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
