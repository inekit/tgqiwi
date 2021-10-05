const kb = require("./keyboard-buttons");

module.exports = {
  home: [
    [kb.home.tokens],
    [kb.home.getBalance, kb.home.transactions],
    [kb.home.limits, kb.home.transact],
    [kb.home.onoffcron],
    [kb.home.card, kb.home.proxy],
  ],
  currentToken: [
    [kb.home.getBalance],
    [kb.home.transactions],
    [kb.home.tokens],
    [kb.home.transact],
    [kb.home.updateProxy],
    [kb.home.card],
  ],
  tokens: [[kb.tokens.addToken, kb.tokens.deleteToken], [kb.tokens.home]],
  card: [[kb.card.changeCard, kb.tokens.home]],
  proxy: [[kb.proxy.update, kb.proxy.delete], [kb.tokens.home]],
  inlineChoose: (tokenName, type) => [
    [
      {
        text: "Выбрать",

        callback_data: JSON.stringify({
          tokenName,
          type,
        }),
      },
    ],
  ],
  inlineOptions: (tokenName) => [
    [
      {
        text: "Баланс",
        callback_data: JSON.stringify({ tokenName, type: "balance" }),
      },
      {
        text: "История",
        callback_data: JSON.stringify({ tokenName, type: "transactions" }),
      },
      {
        text: "Вывести",
        callback_data: JSON.stringify({ tokenName, type: "transact" }),
      },
    ],
    [
      {
        text: "Лимиты",
        callback_data: JSON.stringify({ tokenName, type: "limits" }),
      },
      {
        text: "Прокси",
        callback_data: JSON.stringify({ tokenName, type: "proxy" }),
      },
      {
        text: "Удалить",
        callback_data: JSON.stringify({ tokenName, type: "delete" }),
      },
    ],
  ],
};
