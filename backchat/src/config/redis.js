const { createClient } = require("redis");


const redisUrl =
  process.env.REDIS_URL || `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`;

const pubClient = createClient({
  url: redisUrl,
});

const subClient = pubClient.duplicate();

const connectRedis = async () => {
  try {
    pubClient.on("error", (error) => {
      console.error("Redis Publisher Error:", error);
    });

    subClient.on("error", (error) => {
      console.error("Redis Subscriber Error:", error);
    });

    await Promise.all([
      pubClient.connect(),
      subClient.connect(),
    ]);

    console.log("Redis connected successfully");
  } catch (error) {
    console.error("Redis connection failed:", error.message);
    process.exit(1);
  }
};

module.exports = {
  pubClient,
  subClient,
  connectRedis,
};  