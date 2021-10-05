const { promisify } = require("util");
const redis = require("redis");
const redisClient = redis.createClient();
const getAsync = promisify(redisClient.hget).bind(redisClient);
redisClient.on("error", function (error) {
  console.error(error);
});

async function getFromRedis(tgID, tag) {
  try {
    return await getAsync(tgID, tag);
  } catch {
    console.log;
  }
}

async function getPosition(tgID) {
  return await getFromRedis(tgID, "position");
}

function setToRedis(tag, value, tgID) {
  redisClient.hmset(String(tgID), [tag, value]);
  redisClient.hget(tgID, tag, redis.print);
}

function setPosition(value, tgID) {
  setToRedis("position", value, tgID);
}

module.exports = { getPosition, setPosition, setToRedis, getFromRedis };
