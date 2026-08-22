import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  connectSocket,
  disconnectSocket,
} from "../services/socket";

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("chat_token");

    if (!token) {
      return;
    }

    const socketInstance = connectSocket();

    socketInstance.on("connect", () => {
      console.log(
        "Socket connected:",
        socketInstance.id
      );
    });

    socketInstance.on("connect_error", (error) => {
      console.error(
        "Socket connection error:",
        error.message
      );
    });

    socketInstance.on("disconnect", (reason) => {
      console.log(
        "Socket disconnected:",
        reason
      );
    });

    setSocket(socketInstance);

    return () => {
      disconnectSocket();
    };
  }, []);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => {
  return useContext(SocketContext);
};