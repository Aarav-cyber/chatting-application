export default function MessageBubble({
  message,
  isMine,
}) {
  const getStatus = () => {
    if (!isMine) {
      return null;
    }

    if (
      message.status === "read" ||
      message.status === "delivered"
    ) {
      return "✓✓";
    }

    return "✓";
  };

  return (
    <div
      className={`max-w-md rounded-2xl px-4 py-3 ${
        isMine
          ? "bg-slate-900 text-white"
          : "bg-white border border-slate-200"
      }`}
    >
      <p>{message.text}</p>

      <div className="mt-1 flex items-center justify-end gap-1">
        <span className="text-[10px] text-slate-400">
          {new Date(
            message.createdAt
          ).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>

        {isMine && (
          <span className="text-[10px] text-slate-400">
            {getStatus()}
          </span>
        )}
      </div>
    </div>
  );
}