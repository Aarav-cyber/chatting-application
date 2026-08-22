import { useEffect, useRef, useState } from "react";

export default function ChatWindow({
  conversation,
  messages,
  onSendMessage,
  currentUser,
}) {
  const [text, setText] =
    useState("");

  const messagesEndRef =
    useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  if (!conversation) {
    return (
      <div className="h-full flex items-center justify-center text-slate-400">
        <div className="text-center">
          <h2 className="text-xl font-semibold">
            Welcome to BackChat
          </h2>

          <p className="mt-2">
            Select a conversation to start chatting.
          </p>
        </div>
      </div>
    );
  }

  const otherUser =
    conversation.participants.find(
      (participant) =>
        participant._id !==
        currentUser._id
    );

  const send = () => {
    if (!text.trim()) {
      return;
    }

    onSendMessage(
      otherUser._id,
      text
    );

    setText("");
  };

  return (
    <div className="h-full flex flex-col">

      {/* Header */}
      <header className="h-20 bg-white border-b border-slate-200 flex items-center px-6">

        <img
          src={otherUser?.profilePic}
          className="h-11 w-11 rounded-full"
        />

        <div className="ml-3">
          <h2 className="font-semibold">
            {otherUser?.name}
          </h2>

          <p className="text-xs text-slate-500">
            {otherUser?.email}
          </p>
        </div>

      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-3">

        {messages.map((message) => {

          const isMine =
            message.sender?._id ===
            currentUser._id;

          return (
            <div
              key={message._id}
              className={`flex ${
                isMine
                  ? "justify-end"
                  : "justify-start"
              }`}
            >
              <div
                className={`max-w-md rounded-2xl px-4 py-3 ${
                  isMine
                    ? "bg-slate-900 text-white"
                    : "bg-white border border-slate-200"
                }`}
              >
                <p>
                  {message.text}
                </p>

                <p
                  className={`mt-1 text-[10px] ${
                    isMine
                      ? "text-slate-400"
                      : "text-slate-400"
                  }`}
                >
                  {new Date(
                    message.createdAt
                  ).toLocaleTimeString([], {
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

      {/* Input */}
      <div className="bg-white border-t border-slate-200 p-4">

        <div className="flex gap-3">

          <input
            value={text}
            onChange={(e) =>
              setText(e.target.value)
            }
            onKeyDown={(e) => {
              if (
                e.key === "Enter" &&
                !e.shiftKey
              ) {
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