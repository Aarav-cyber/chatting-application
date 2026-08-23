const {
  presenceClient,
} = require("../config/redis");

const getSocketKey = (userId) =>
  `user:${userId}:sockets`;

const addSocket = async (
  userId,
  socketId
) => {
  const key = getSocketKey(userId);

  await presenceClient.sadd(
    key,
    socketId
  );

  return presenceClient.scard(key);
};

const removeSocket = async (
  userId,
  socketId
) => {
  const key = getSocketKey(userId);

  await presenceClient.srem(
    key,
    socketId
  );

  const count =
    await presenceClient.scard(key);

  if (count === 0) {
    await presenceClient.del(key);
  }

  return count;
};

const isUserOnline = async (
  userId
) => {
  const count =
    await presenceClient.scard(
      getSocketKey(userId)
    );

  return count > 0;
};

const getOnlineUsers = async (
  userIds
) => {
  const results = {};

  for (const userId of userIds) {
    results[userId] =
      await isUserOnline(userId);
  }

  return results;
};

module.exports = {
  addSocket,
  removeSocket,
  isUserOnline,
  getOnlineUsers,
};