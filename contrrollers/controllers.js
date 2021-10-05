const helper = require("../src/helper");
const keyboard = require("../src/keyboard");
const kb = require("../src/keyboard-buttons");
const regexps = require("../src/regexps");
const {
  transactMiddleware,
  transactAllIHave,
  DB,
  qiwi,
  bot,
} = require("./transact");
const {
  getPosition,
  setPosition,
  getFromRedis,
  setToRedis,
} = require("../datebase/redis");

function start(msg) {
  const chatId = helper.getChatID(msg);

  DB()
    .createUser(chatId)
    .then(() => {
      bot.sendMessage(chatId, "Добро пожалвать", {
        reply_markup: { keyboard: keyboard.home },
      });
    });
}

function forAllTokens(chatID, tokenName, cb) {
  DB()
    .getTokenByName(tokenName, chatID)
    .then(async (tokens) => {
      for (let token of tokens) {
        await cb(chatID, token);
        console.log(token);
      }
    })
    .catch(() => {
      bot.sendMessage(chatID, "Ошибка базы");
    });
}

function sendBalance(tokenName, chatID) {
  if (!chatID) return;

  forAllTokens(chatID, tokenName, (chatID, token) => {
    qiwi.getBalance(token).then((accounts) => {
      bot.sendMessage(
        chatID,
        `<b>Баланс</b> ${token.token_name}:` + "\n" + accounts + " RUB",
        { parse_mode: "HTML" }
      );
    });
  });
}

function sendLimits(tokenName, chatID) {
  if (!chatID) return;
  forAllTokens(chatID, tokenName, (chatID, token) => {
    qiwi.getLimits(token).then((limits) => {
      console.log(limits);
      if (limits === "Ошибка") bot.sendMessage(chatID, "Ошибка сервера qiwi");
      else if (typeof limits === "object" && limits.length !== 0) {
        console.log(limits.length === 0);
        limits.forEach((limit) =>
          bot.sendMessage(
            chatID,
            tokenName + ": " + limit.restrictionDescription
          )
        );
      } else
        bot.sendMessage(
          chatID,
          token.token_name + ": Нет ограничений на вывод"
        );
    });
  });
}

function sendTokens(type, chatId) {
  process.nextTick(async () => {
    let tokens = await DB().getTokens(chatId);
    if (!tokens.length) {
      bot.sendMessage(chatId, "Вы пока не добавили ни одного токена");
      return;
    }

    for (let token of tokens) {
      let html = `<b>${token.token_name}</b>: ${token.token}`;
      await bot.sendMessage(chatId, html, {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: keyboard.inlineChoose(token.token_name, type),
        },
      });
    }

    bot.sendMessage(chatId, "Для всех сразу", {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: keyboard.inlineChoose("allall", type),
      },
    });
  });
}

function sendOptions(tokenName, chatId) {
  bot.sendMessage(chatId, tokenName !== "allall" ? tokenName : "Все токены", {
    reply_markup: {
      remove_keyboard: true,
      inline_keyboard: keyboard.inlineOptions(tokenName),
    },
  });
}

function sendAddToken(tokenMes) {
  let tgID = tokenMes.chat.id;

  let token = tokenMes.text;
  console.log(token);
  setToRedis("token", token, tgID);
  setToRedis("position", "addTokenName", tgID);

  bot.sendMessage(tgID, "Назовите токен (до 30 символов)");
}

function sendWrongToken(msg) {
  if (msg.text === "Добавить токен" || msg.text.match(regexps.token)) return;
  const chatId = helper.getChatID(msg);
  bot.sendMessage(chatId, "Неправильный токен");
}

function sendWrongTokenName(msg) {
  const chatId = helper.getChatID(msg);
  bot.sendMessage(chatId, "Неправильный формат имени токена");
}

function sendAddTokenName(nameMes) {
  let tgID = nameMes.chat.id;
  process.nextTick(async () => {
    let token = await getFromRedis(tgID, "token");

    if (await testToken(token)) {
      let res = await DB().addToken(token, nameMes.text, tgID);
      res = res
        ? "Токен успешно добавлен"
        : "Токен уже существует, или ошибка базы";

      bot.sendMessage(tgID, res, {
        reply_markup: { keyboard: keyboard.home },
      });
    } else bot.sendMessage(tgID, "Нерабочи токен или ошибка соединения");
  });
  setToRedis("position", "tokens", tgID);
}

function sendProxy(tokenName, tgID) {
  process.nextTick(async () => {
    let token = await DB().getTokenByName(tokenName, tgID);
    if (!token) return;
    let proxyString = token[0].proxy_login;
    bot.sendMessage(tgID, proxyString ?? "Не задан", {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "Изменить",
              callback_data: JSON.stringify({ tokenName, type: "updateProxy" }),
            },
            {
              text: "Удалить",
              callback_data: JSON.stringify({ tokenName, type: "deleteProxy" }),
            },
          ],
        ],
      },
    });
  });
}

function recieveProxyString(tokenName, tgID) {
  bot.sendMessage(tgID, "Введите строку прокси");
  console.log(tokenName);
  setToRedis("tokenName", tokenName, tgID);
}

function recieveProxyString1(ip, port, login, password, tgID) {
  bot.sendMessage(tgID, "Выберите тип соединения", {
    reply_markup: { keyboard: [[{ text: "http" }, { text: "https" }]] },
  });

  setToRedis("proxy", `://${login}:${password}@${ip}:${port}`, tgID);
  setPosition("updateProxyType", tgID);
}

function recieveProxyType(tokenMes, typeArr) {
  let type = typeArr[0];
  let tgID = tokenMes.chat.id;
  process.nextTick(async function () {
    let proxyString = `${type}` + (await getFromRedis(tgID, "proxy"));
    let tokenName = await getFromRedis(tgID, "tokenName");
    console.log(proxyString);

    if (await testProxy(tokenName, proxyString, tgID)) {
      console.log(true);
      res = await DB().updateProxy(tgID, tokenName, proxyString);
      if (!res) return;
      res = res
        ? res[0].affectedRows > 0
          ? "Прокси успешно изменен"
          : "Не удалось изменить прокси"
        : "Ошибка базы";
      bot.sendMessage(tgID, res);
    }
  });
  bot.sendMessage(tgID, "Домашний экран", {
    reply_markup: { keyboard: keyboard.home },
  });
}

function deleteProxy(tokenName, tgID) {
  process.nextTick(async function () {
    res = await DB().updateProxy(tgID, tokenName);
    if (!res) return;
    res = res
      ? res[0].affectedRows > 0
        ? "Прокси успешно удален"
        : "Не удалось удалить токен"
      : "Ошибка базы";
    bot.sendMessage(tgID, res);
  });
}

async function testToken(token) {
  let isTruth =
    typeof (await qiwi.getBalance({
      token: token,
      proxy_login: "",
    })) !== "string";
  return isTruth;
}

async function testProxy(tokenName, proxyString, chatID) {
  let tokens = await DB().getTokenByName(tokenName, chatID);
  if (!tokens) return;
  let isTruth =
    typeof (await qiwi.getBalance({
      token: tokens[0].token,
      proxy_login: proxyString,
    })) !== "string";
  return isTruth;
}

function sendDeleteToken(tokenName, tgID) {
  bot.sendMessage(tgID, "Вы уверены? Подтвердите, нажав ДА", {
    reply_markup: { keyboard: [[{ text: "ДА" }, { text: "НЕТ" }]] },
  });
  setToRedis("tokenName", tokenName, tgID);
  setPosition("deleteTokenConfirm", tgID);
}

async function recieveDeleteToken(msg) {
  let tgID = msg.chat.id;

  process.nextTick(async function () {
    try {
      let tokenName = await getFromRedis(tgID, "tokenName");
      console.log(tokenName);

      let res = await DB().deleteToken(tokenName, tgID);
      if (!res) return;
      res = res
        ? res[0].affectedRows === 1
          ? "Токен успешно  удален"
          : "Не удалост удалить токен"
        : "Ошибка базы";

      bot.sendMessage(tgID, res);
    } catch {
      console.log;
    }
  });

  setPosition("home", tgID);
  bot.sendMessage(tgID, "Домашний экран", {
    reply_markup: { keyboard: keyboard.home },
  });
}

function sendHistory(tokenName, chatID) {
  console.log(1);
  forAllTokens(chatID, tokenName, async (chatID, token) => {
    let transactions = await qiwi.getHistory(token);

    console.log(transactions);
    if (typeof transactions == "string") {
      bot.sendMessage(chatID, "Не удается получить список транзакций", {
        parse_mode: "HTML",
      });
      return;
    }
    for (tr of transactions) {
      let html = [
        `<b>${tr.view.title}</b>`,
        `${tr.view.account}`,
        `<b>Статус:</b>${tr.status}`,
        `<b>Сумма:</b>${tr.sum.amount} RUB`,
      ].join("\n");
      bot.sendMessage(chatID, html, { parse_mode: "HTML" });
    }
  });
}

function sendTransactionResult(tokenName, chatID) {
  setToRedis("tokenName", tokenName, chatID);
  setPosition("transactConfirm", chatID);

  bot.sendMessage(chatID, "Вы уверены? Подтвердите, нажав ДА", {
    reply_markup: { keyboard: [[{ text: "ДА" }, { text: "НЕТ" }]] },
  });
}

function sendTransuctionConfirm(msg) {
  let tgID = msg.chat.id;
  process.nextTick(async function () {
    let tokenName = await getFromRedis(tgID, "tokenName");
    transactMiddleware(tokenName, tgID);
  });
  setPosition("home", tgID);
  bot.sendMessage(tgID, "Домашний экран", {
    reply_markup: { keyboard: keyboard.home },
  });
}

function sendCard(chatID) {
  DB()
    .getCard(chatID)
    .then((card) => {
      if (!card) return;
      let mes = card === null ? "Карта не привязана" : card;
      bot.sendMessage(chatID, mes, {
        reply_markup: { keyboard: keyboard.card },
      });
    });
}

function changeCard(chatID) {
  bot.sendMessage(chatID, "Введите номер карты (16 цифр, без пробелов)");
}

function recieveCard(cardMes) {
  let chatID = cardMes.chat.id;

  DB()
    .addCard(cardMes.text, chatID)
    .then((res) => {
      mes = res === false ? "Не удалось добавить карту" : "Карта изменена";
      bot.sendMessage(chatID, mes, {
        reply_markup: { keyboard: keyboard.home },
      });
    })
    .catch((err) => console.log(err));
}

function onofftransactAll(chatID) {
  process.nextTick(async function () {
    let [rows, fields] = await DB().onoffcron(chatID);
    let ans = rows.cron === "on" ? "Включен" : "Выключен";
    bot.sendMessage(chatID, ans);
  });
}

transactAllIHave();
setInterval(transactAllIHave, 1000 * 60 * 60 * 6);

module.exports = {
  sendBalance,
  sendHistory,
  sendTokens,
  start,
  sendAddToken,
  sendDeleteToken,
  sendTransactionResult,
  sendCard,
  changeCard,
  sendOptions,
  sendProxy,
  recieveProxyString,
  deleteProxy,
  sendLimits,
  onofftransactAll,
  sendWrongToken,
  recieveCard,
  recieveProxyString1,
  recieveProxyType,
  sendAddTokenName,
  sendWrongTokenName,
  recieveDeleteToken,
  sendTransuctionConfirm,
};
