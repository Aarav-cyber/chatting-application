import React from "react";

import Call from "../assets/call.png";
import Video from "../assets/video-call.png";
import Send from "../assets/send.png";
import "./user.css";

export default function Chats({
  image,
  chatName,
  status,
  messages = [],
  messageInput,
  setMessageInput,
  handleSendMessage,
}) {
  return (
    <>
      <div className="chat-container">
        <div className="chat-header">
          <img src={image} alt="Chat Avatar" className="chat-avatar" />
          <div className="chat-info">
            <h4 className="chat-name">{chatName}</h4>
            <p className="status">{status}</p>
          </div>
          <div className="chat-actions">
            <button className="btn">
              <img src={Call} alt="Call" />
            </button>
            <button className="btn">
              <img src={Video} alt="Video Call" />
            </button>
          </div>
        </div>
        <div className="chat-messages">
          {messages.map((msg, idx) => (
            <div className={`message ${msg.sender === 'me' ? 'message-sent' : 'message-received'}`} key={idx}>
              <div className="message-content">
                <img 
                  src={msg.sender === 'me' ? "https://img.daisyui.com/images/profile/demo/anakeen@192.webp" : image} 
                  alt="Avatar" 
                  className="message-avatar"
                />
                <div className="message-details">
                  <div className="message-header">
                    <span className="message-sender">{msg.sender === 'me' ? 'You' : chatName}</span>
                    <span className="message-time">
                      {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                  <p className="message-text">{msg.text}</p>
                  {msg.sender === 'me' && idx === messages.length - 1 && (
                    <div className="message-status">Delivered</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="chat-input">
          <input
            type="text"
            placeholder="Type a message..."
            className="input-field"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
          />
          <button className="send-button" onClick={handleSendMessage}>
            <img src={Send} alt="send button" />
          </button>
        </div>
      </div>
    </>
  );
}