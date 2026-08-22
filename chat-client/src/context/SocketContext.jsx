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

import { useAuth } from "./AuthContext";

const SocketContext =
  createContext(null);

export function SocketProvider({
  children,
}) {
  const { token } = useAuth();

  const [socket, setSocket] =
    useState(null);

  useEffect(() => {
    if (!token) {
      disconnectSocket();
      setSocket(null);
      return;
    }

    const socketInstance =
      connectSocket();

    socketInstance.on(
      "connect",
      () => {
        console.log(
          "Socket connected:",
          socketInstance.id
        );
      }
    );

    socketInstance.on(
      "connect_error",
      (error) => {
        console.error(
          "Socket connection error:",
          error.message
        );
      }
    );

    socketInstance.on(
      "disconnect",
      (reason) => {
        console.log(
          "Socket disconnected:",
          reason
        );
      }
    );

    setSocket(socketInstance);

    return () => {
      socketInstance.removeAllListeners();
      disconnectSocket();
    };
  }, [token]);

  return (
    <SocketContext.Provider
      value={socket}
    >
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () =>
  useContext(SocketContext);