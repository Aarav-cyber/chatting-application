const {
  getOrCreateConversation,
  getUserConversations,
  getConversationMessages,
} = require("../services/conversationService");

exports.getConversations = async (
  req,
  res
) => {
  try {
    const conversations =
      await getUserConversations(
        req.userId
      );

    res.json({
      success: true,
      conversations,
    });
  } catch (error) {
    console.error(
      "Get conversations error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to load conversations",
    });
  }
};

exports.createConversation = async (
  req,
  res
) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const conversation =
      await getOrCreateConversation(
        req.userId,
        userId
      );

    await conversation.populate(
      "participants",
      "name email profilePic status"
    );

    res.status(200).json({
      success: true,
      conversation,
    });
  } catch (error) {
    console.error(
      "Create conversation error:",
      error
    );

    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getMessages = async (
  req,
  res
) => {
  try {
    const { conversationId } =
      req.params;

    const messages =
      await getConversationMessages(
        conversationId,
        req.userId
      );

    res.json({
      success: true,
      messages,
    });
  } catch (error) {
    console.error(
      "Get messages error:",
      error
    );

    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};