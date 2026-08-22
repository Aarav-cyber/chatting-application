import ChatWindow from "./ChatWindow";

export default function ChatLayout({
  conversations,
  selectedConversation,
  onSelectConversation,
  onSearch,
  searchResults,
  onSelectUser,
  messages,
  onSendMessage,
  user,
  onLogout,
}) {
  return (
    <div className="h-screen bg-slate-100 flex">

      {/* Sidebar */}
      <aside className="w-80 bg-white border-r border-slate-200 flex flex-col">

        <div className="p-5 border-b border-slate-200">
          <div className="flex items-center justify-between">

            <div>
              <h1 className="text-xl font-bold">
                BackChat
              </h1>

              <p className="text-sm text-slate-500">
                {user?.name}
              </p>
            </div>

            <button
              onClick={onLogout}
              className="text-sm text-slate-500 hover:text-red-500"
            >
              Logout
            </button>

          </div>

          <input
            onChange={(e) =>
              onSearch(e.target.value)
            }
            placeholder="Search users..."
            className="mt-4 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-400"
          />
        </div>

        {/* Search results */}
        {searchResults.length > 0 && (
          <div className="border-b border-slate-200">

            {searchResults.map((user) => (
              <button
                key={user._id}
                onClick={() =>
                  onSelectUser(user)
                }
                className="w-full flex items-center gap-3 p-4 hover:bg-slate-50 text-left"
              >
                <img
                  src={
                    user.profilePic
                  }
                  className="h-10 w-10 rounded-full"
                />

                <div>
                  <p className="font-medium">
                    {user.name}
                  </p>

                  <p className="text-xs text-slate-500">
                    {user.email}
                  </p>
                </div>
              </button>
            ))}

          </div>
        )}

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto">

          {conversations.map(
            (conversation) => {

              const otherUser =
                conversation.participants.find(
                  (participant) =>
                    participant._id !==
                    user._id
                );

              return (
                <button
                  key={conversation._id}
                  onClick={() =>
                    onSelectConversation(
                      conversation
                    )
                  }
                  className={`w-full p-4 flex items-center gap-3 text-left hover:bg-slate-50 ${
                    selectedConversation?._id ===
                    conversation._id
                      ? "bg-slate-100"
                      : ""
                  }`}
                >

                  <img
                    src={
                      otherUser?.profilePic
                    }
                    className="h-12 w-12 rounded-full"
                  />

                  <div className="min-w-0">

                    <p className="font-medium">
                      {otherUser?.name}
                    </p>

                    <p className="text-sm text-slate-500 truncate">
                      {conversation.lastMessage?.text ||
                        "No messages yet"}
                    </p>

                  </div>

                </button>
              );
            }
          )}

        </div>
      </aside>

      {/* Chat */}
      <main className="flex-1">
        <ChatWindow
          conversation={
            selectedConversation
          }
          messages={messages}
          onSendMessage={
            onSendMessage
          }
          currentUser={user}
        />
      </main>

    </div>
  );
}