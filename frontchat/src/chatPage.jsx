import React, { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import "./index.css";

import User from "./components/user.jsx";
import Chats from "./components/chat.jsx";

import Profile from "./assets/IMAGE.png";
import Archive from "./assets/archrive.png";
import Setting from "./assets/setting.png";


const SOCKET_URL = "http://localhost:3001";

export default function ChatApp() {
  const [users, setUsers] = useState([]);
  const [activeChatUser, setActiveChatUser] = useState(null);
  useEffect(() => {
    // console.log("Active chat user:", activeChatUser);
  }, [activeChatUser]);

  const [userName] = useState(localStorage.getItem("name") || "Name");
  const [userPic] = useState(localStorage.getItem("profilePic") || Profile);

  //this is for the socket connection
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const socketRef = useRef();
  const myId = localStorage.getItem("user_id");

  useEffect(() => {
    socketRef.current = io(SOCKET_URL);

    socketRef.current.emit("joinRoom", { userId: myId });

    socketRef.current.on("receiveMessage", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, [myId]);

  useEffect(() => {
    if (activeChatUser) {
      fetch(`http://localhost:3001/api/messages/${myId}/${activeChatUser._id}`)
        .then((res) => res.json())
        .then((data) => setMessages(data));
    }
  }, [activeChatUser, myId]);

  //function to handle send message
  const handleSendMessage = () => {
    if (messageInput && activeChatUser) {
      socketRef.current.emit("sendMessage", {
        sender: myId,
        receiver: activeChatUser._id,
        text: messageInput,
      });
      setMessageInput("");
    }
  };

  //till here
  useEffect(() => {
    fetch("http://localhost:3001/api/users")
      .then((res) => {
        if (!res.ok) {
          throw new Error("Network response was not ok");
        }
        return res.json();
      })
      .then((data) => {
        setUsers(data);
        console.log("Users fetched:", data);
      })
      .catch((err) => console.error("Error fetching users:", err));
  }, []);

  return (
    <>
      <div className="main-content">
        {/* Sidebar */}

        <div className="sidebar">
          <div className="user-prof">
            <div className="profile">
              <img src={userPic} alt="Profile" className="icon" />
              <p>{userName}</p>
            </div>
            <div className="icons">
              <img src={Archive} alt="Archive" className="icon" />
              <img src={Setting} alt="Settings" className="icon" />
            </div>
          </div>

          <div className="search-bar-container">
            <form className="form">
              <input
                type="text"
                placeholder="Search..."
                className="search-bar"
              />
            </form>
          </div>

          <div className="user-list">
            {users.map((user) => (
              <User
                key={user._id}
                name={user.name}
                image={user.profilePic}
                LastMessage={user.status}
                onClick={() => setActiveChatUser(user)}
              />
            ))}
          </div>
        </div>

        {/* Chat */}
        {/* <Chats
          image={Profile}
          chatName="MY boi"
          status="Online"
          messages={messages}
        /> */}
        {activeChatUser && (
          <Chats
            image={activeChatUser.profilePic}
            chatName={activeChatUser.name}
            status={activeChatUser.status}
            userId={activeChatUser._id}
            messages={messages}
            messageInput={messageInput}
            setMessageInput={setMessageInput}
            handleSendMessage={handleSendMessage}
          />
        )}
      </div>
    </>
  );
}
