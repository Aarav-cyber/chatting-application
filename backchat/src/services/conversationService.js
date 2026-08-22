const Conversation = require("../models/conversation");
const Message = require("../models/message");

const createParticipantKey = (userA, userB) => {
  return [userA.toString(), userB.toString()]
    .sort()
    .join(":");
};

const getOrCreateConversation = async (
  userA,
  userB
) => {
  if (userA.toString() === userB.toString()) {
    throw new Error(
      "Cannot create conversation with yourself"
    );
  }

  const participantKey = createParticipantKey(
    userA,
    userB
  );

  let conversation =
    await Conversation.findOne({
      participantKey,
    });

  if (!conversation) {
    conversation = await Conversation.create({
      participants: [userA, userB],
      participantKey,
    });
  }

  return conversation;
};

const getUserConversations = async (userId) => {
  return Conversation.find({
    participants: userId,
  })
    .populate(
      "participants",
      "name email profilePic status"
    )
    .populate(
      "lastMessage",
      "sender receiver text status createdAt"
    )
    .sort({
      updatedAt: -1,
    });
};

const getConversationMessages = async (
  conversationId,
  userId
) => {
  const conversation =
    await Conversation.findOne({
      _id: conversationId,
      participants: userId,
    });

  if (!conversation) {
    throw new Error(
      "Conversation not found"
    );
  }

  return Message.find({
    conversation: conversationId,
  })
    .populate(
      "sender",
      "name email profilePic"
    )
    .populate(
      "receiver",
      "name email profilePic"
    )
    .sort({
      createdAt: 1,
    });
};

module.exports = {
  createParticipantKey,
  getOrCreateConversation,
  getUserConversations,
  getConversationMessages,
};