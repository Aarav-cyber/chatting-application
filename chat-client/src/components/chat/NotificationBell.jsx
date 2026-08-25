import { useState } from "react";

export default function NotificationBell({
  notifications,
  unreadCount,
  onNotificationClick,
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((value) => !value)}
        className="relative rounded-full p-2 hover:bg-slate-100"
      >
        🔔
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-red-500 px-1 text-center text-[10px] text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-80 rounded-2xl border border-slate-200 bg-white shadow-xl">
          <div className="border-b border-slate-200 p-4">
            <h3 className="font-semibold">Notifications</h3>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-400">
                No notifications
              </div>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification._id}
                  onClick={() => onNotificationClick(notification)}
                  className={`w-full border-b border-slate-100 p-4 text-left hover:bg-slate-50 ${
                    !notification.read ? "bg-slate-50" : ""
                  }`}
                >
                  <p className="font-medium">{notification.sender?.name}</p>

                  <p className="mt-1 text-sm text-slate-500">
                    {notification.message?.text}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
