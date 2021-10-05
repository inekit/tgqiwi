const { DB } = require("../datebase/db");
const bot = require("../bot");
const qiwi = require("../qiwi/qiwi");

function transactAllIHave() {
  let usersStream = DB().getAllUsersPipe();

  usersStream.on("result", async function (user) {
    let tokens = await DB().getTokens(user.tg_id);
    tokens.forEach((tokenRow) => {
      bot.sendMessage(user.tg_id, "Автовывод:");
      transactMiddleware(tokenRow.token_name, user.tg_id);
    });
  });
}

async function transactMiddleware(tokenName, chatID) {
  let tokens = await DB().getTokenByName(tokenName, chatID);
  console.log(tokens);
  if (!tokens) return;
  let card = await DB().getCard(chatID);
  if (!card) return;
  for (let token of tokens) {
    console.log(card, token);
    let balance = await qiwi.getBalance(token);
    console.log(balance);
    if (balance < 5) {
      bot.sendMessage(
        chatID,
        `<b>Вывод с токена</b> ${token.token_name}  не удался, нулевой баланс`,
        { parse_mode: "HTML" }
      );
      continue;
    }
    qiwi
      .transact(token, card, balance)
      .then((status) => {
        if (!status.message)
          status.message = `<b>Вывод с токена </b> ${token.token_name}<pre>\n\n</pre><b>На карту </b>${status.fields.account}<pre>\n\n</pre><b>id транзакции: </b>${status.id}<pre>\n\n</pre><b>Сумма вывода: </b>${status.sum.amount}<pre>\n\n</pre>`;

        bot.sendMessage(chatID, status.message, { parse_mode: "HTML" });
      })
      .catch((err) => {
        console.log(err);
        bot.sendMessage(chatID, "Ошибка");
      });
  }
}

module.exports = { transactAllIHave, transactMiddleware, DB, bot, qiwi };
