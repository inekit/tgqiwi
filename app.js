const TelegramBot = require("node-telegram-bot-api");

const { TOKEN } = require("./src/config");
const keyboard = require("./src/keyboard");
const helper = require("./src/helper");
const replies = require("./src/replies");
const keyboardButtons = require("./src/keyboard-buttons");

const bot = new TelegramBot(TOKEN, { polling: true });

bot.on("message", (msg) => {
  helper.log(msg);

  switch (msg.text) {
    case keyboardButtons.home.contacts:
      bot.sendMessage(helper.getChatID(), replies.contacts, {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "cdscs",
                callback_data: JSON.stringify({
                  type: "ccc",
                  longitude: "ffv",
                }),
              },
              { text: "cdscs", callback_data: "efw" },
            ],
            [{ text: "url", url: "efw" }],
          ],
        },
      });
      break;
    case keyboardButtons.home.about:
      bot.sendMessage(helper.getChatID(), "cnt", {
        reply_markup: { inline_keyboard: keyboard.home },
      });
      break;
  }

  if (msg.location) bot.sendMessage(helper.getChatID(), msg.location);

  bot.sendMessage(chatId, "Received your message");
});

bot.on("callback_query", (query) => {
  let data;
  try {
    console.log(JSON.parse(query.data));
  } catch {
    (err) => {
      throw new Error("data is not an object");
    };
  }

  const { type } = data;

  switch (type) {
    case type1:
      break;
  }
});

bot.onText(/\/echo (.+)/, (msg, [sourse, match]) => {
  const chatId = msg.chat.id;
  const key = helper.getItemID(sourse);
  const resp = match[1];

  bot.sendMessage(chatId, resp);
});

bot.onText(/\/start/, (msg) => {
  const chatId = helper.getChatID();

  bot.sendMessage(chatId, resp, {
    reply_to_message_id: msg.message_id,
    reply_markup: { keyboard: keyboard.home },
  });
});

function getNearest(chatID, location) {
  const html = cinemas
    .find({})
    .map((c, i) => {
      return `<b>222</b><strong>222</strong>`;
    })
    .join("/n");

  sendHTML(html);
}
