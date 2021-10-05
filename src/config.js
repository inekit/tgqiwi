const dotenv = require("dotenv").config();

module.exports = {
  TOKEN: process.env.BOT_TOKEN,
  algorithm: process.env.BOT_CIPHER_ALG,
  initVector: process.env.BOT_CIPHER_VECTOR,
  Securitykey: process.env.BOT_CIPHER_KEY,
  mysqlParams: {
    host: "localhost",
    port: 3306,
    user: "bot",
    database: "tgqiwi",
    password: process.env.BOT_DB_PASSWORD,
    waitForConnections: true,
    connectionLimit: 20,
    queueLimit: 10,
  },
};
