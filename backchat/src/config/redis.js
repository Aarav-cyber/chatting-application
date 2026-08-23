const Redis = require("ioredis");

const redisUrl =
  process.env.REDIS_URL ||
  "redis://redis:6379";

const pubClient = new Redis(redisUrl);

const subClient = pubClient.duplicate();

const presenceClient = new Redis(redisUrl);

pubClient.on("connect", () => {
  console.log("Redis pub client connected");
});

subClient.on("connect", () => {
  console.log("Redis sub client connected");
});

presenceClient.on("connect", () => {
  console.log(
    "Redis presence client connected"
  );
});

pubClient.on("error", (error) => {
  console.error(
    "Redis pub client error:",
    error
  );
});

subClient.on("error", (error) => {
  console.error(
    "Redis sub client error:",
    error
  );
});

presenceClient.on("error", (error) => {
  console.error(
    "Redis presence client error:",
    error
  );
});

module.exports = {
  pubClient,
  subClient,
  presenceClient,
};