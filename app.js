const TelegramBot = require("node-telegram-bot-api");

const keyboard = require("./src/keyboard");
const helper = require("./src/helper");
const replies = require("./src/replies");
const keyboardButtons = require("./src/keyboard-buttons");
const controllers = require("./contrrollers/controllers");
const regexps = require("./src/regexps");
const bot = require("./bot");
const { DB } = require("./datebase/db");
const { getPosition, setPosition } = require("./datebase/redis");

bot.onText(/\/start/, (msg) => {
  setPosition("home", msg.chat.id);
  controllers.start(msg);
});

function addTextListener(regexp, link, cb) {
  bot.onText(regexp, async (tokenMes, reg) => {
    if ((await getPosition(tokenMes.chat.id)) === link) cb(tokenMes, reg);
  });
}

addTextListener(regexps.notToken, "addToken", controllers.sendWrongToken);
addTextListener(regexps.token, "addToken", controllers.sendAddToken);
addTextListener(
  regexps.confirm,
  "deleteTokenConfirm",
  controllers.recieveDeleteToken
);

addTextListener(
  regexps.confirm,
  "transactConfirm",
  controllers.sendTransuctionConfirm
);

addTextListener(
  regexps.tokenName,
  "addTokenName",
  controllers.sendAddTokenName
);
addTextListener(
  regexps.notTokenName,
  "addTokenName",
  controllers.sendWrongTokenName
);

addTextListener(regexps.card, "changeCard", controllers.recieveCard);
bot.onText(
  regexps.pConString,
  async (conString, [source, ip, port, login, password]) => {
    if ((await getPosition(conString.chat.id)) === "updateProxy")
      controllers.recieveProxyString1(
        ip,
        port,
        login,
        password,
        conString.chat.id
      );
  }
);

addTextListener(
  regexps.pConType,
  "updateProxyType",
  controllers.recieveProxyType
);

bot.on("message", (msg) => {
  const chatId = helper.getChatID(msg);
  helper.log(msg);

  switch (msg.text) {
    case keyboardButtons.home.getBalance:
      controllers.sendTokens("balance", chatId);
      break;
    case keyboardButtons.home.transactions:
      controllers.sendTokens("transactions", chatId);
      break;
    case keyboardButtons.home.tokens:
      setPosition("tokens", chatId);
      bot.sendMessage(chatId, "Токены", {
        reply_markup: { keyboard: keyboard.tokens },
      });
      controllers.sendTokens("list", chatId);
      break;
    case keyboardButtons.home.transact:
      controllers.sendTokens("transact", chatId);
      break;
    case keyboardButtons.home.card:
      setPosition("card", chatId);
      controllers.sendCard(chatId);
      break;
    case keyboardButtons.card.changeCard:
      setPosition("changeCard", chatId);
      controllers.changeCard(chatId);
      break;
    case keyboardButtons.tokens.home:
      setPosition("home", chatId);
      bot.sendMessage(chatId, "Домашнее меню", {
        reply_markup: { keyboard: keyboard.home },
      });
      break;
    case "НЕТ":
      setPosition("home", chatId);
      bot.sendMessage(chatId, "Домашнее меню", {
        reply_markup: { keyboard: keyboard.home },
      });
      break;
    case keyboardButtons.tokens.addToken:
      setPosition("addToken", chatId);
      bot.sendMessage(chatId, "Введите токен");
      break;
    case keyboardButtons.tokens.deleteToken:
      setPosition("deleteToken", chatId);
      controllers.sendTokens("delete", chatId);
      break;
    case keyboardButtons.home.proxy:
      setPosition("proxy", chatId);
      controllers.sendTokens("proxy", chatId);
      break;
    case keyboardButtons.home.limits:
      controllers.sendTokens("limits", chatId);
      break;
    case keyboardButtons.home.onoffcron:
      controllers.onofftransactAll(chatId);
      break;
  }

  if (msg.location) bot.sendMessage(helper.getChatID(msg), msg.location);
});

bot.on("callback_query", (query) => {
  const chatId = helper.getChatID(query.message);
  let type;
  let data;

  try {
    data = JSON.parse(query.data);
    type = data.type;
    console.log(type);
    if (!type) return;
    const cbTypes = {
      balance: () => controllers.sendBalance(data.tokenName, chatId),
      transactions: () => controllers.sendHistory(data.tokenName, chatId),
      transact: () => controllers.sendTransactionResult(data.tokenName, chatId),
      delete: () => {
        setPosition("deleteToken", chatId);
        controllers.sendDeleteToken(data.tokenName, chatId);
      },
      proxy: () => {
        setPosition("proxy", chatId);
        controllers.sendProxy(data.tokenName, chatId);
      },
      deleteProxy: () => {
        setPosition("deleteProxy", chatId);
        controllers.deleteProxy(data.tokenName, chatId);
      },
      updateProxy: () => {
        setPosition("updateProxy", chatId);
        controllers.recieveProxyString(data.tokenName, chatId);
      },
      list: () => controllers.sendOptions(data.tokenName, chatId),
      limits: () => controllers.sendLimits(data.tokenName, chatId),
    };
    cbTypes[type]();
  } catch {
    (err) => {
      throw new Error("data is not an object");
    };
  }
});

bot.on("polling_error", (error) => {
  console.log(error); // => 'EFATAL'
});
