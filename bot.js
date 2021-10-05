const { TOKEN } = require("./src/config");

const TelegramBot = require("node-telegram-bot-api");
module.exports = new TelegramBot(TOKEN, { polling: true });
