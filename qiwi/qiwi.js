const callbackQiwi = require("./api");

function getContractID(token) {
  const wallet = new callbackQiwi(token.token, token.proxy_login);
  return wallet
    .getAccountInfo()
    .then((data) => {
      return [wallet, data.contractInfo.contractId];
    })
    .catch((err) => {
      console.log(err);
      return [null, "Нельзя получить идентификатор"];
      //throw new Error("Нельзя получить идентификатор" + err);
    });
}

function getCurrency(code) {
  switch (code) {
    case 643:
      return "RUB";
  }
}

async function getBalance(token) {
  if (!token.token) return;

  return await getContractID(token).then(async ([wallet, contractID]) => {
    if (!wallet) return contractID;
    console.log(contractID);
    return await wallet
      .getAccounts(contractID)
      .then((res) => {
        console.log(res);
        return res.accounts.find((x) => x.alias == "qw_wallet_rub")?.balance
          ?.amount;
      })
      .catch((err) => {
        console.log(err);
        return "Нельзя получить баланс в ";
      });
  });
}

async function getHistory(token) {
  return await getContractID(token)
    .then(async ([wallet, res]) => {
      if (!wallet) return res;
      return await wallet
        .getOperationHistory(res, {
          rows: 5,
          operation: "ALL",
        })
        .then((operations) => {
          //console.log(operations.data);

          return operations.data.reverse();
          //bot.sendMessage(chatId, "JSON.stringify(operations)");
        })
        .catch((err) => {
          return "Нельзя получить получить историю";
          //throw new Error("Нельзя получить историю");
        });
    })
    .catch((err) => console.log(err));
}

async function getLimits(token) {
  if (!token.token) return;

  const wallet = new callbackQiwi(token.token);

  return await getContractID(token).then(async ([wallet, contractID]) => {
    if (!wallet) return contractID;
    return wallet
      .getOutLimits(contractID)
      .then((log) => {
        console.log(log);
        return log;
      })
      .catch((err) => {
        console.log(err);
        return "Ошибка";
      });
  });
}

async function transact(token, account, sum) {
  if (!token.token) return;

  const wallet = new callbackQiwi(token.token);

  let comission = (await wallet.checkOnlineCommission(account, { amount: sum }))
    .qwCommission.amount;

  if (comission >= sum) {
    return new Error("Комиссия превышает остаток на счете");
  } else
    return await wallet
      .toCard({ amount: sum - comission, comment: "out", account })
      .then((log) => {
        console.log(log);
        return log;
      })
      .catch((err) => {
        console.log(err);
        return err;
      });
}

module.exports = { getHistory, getBalance, transact, getContractID, getLimits };
