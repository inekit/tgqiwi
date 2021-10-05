const { algorithm, initVector, Securitykey } = require("../src/config");

const crypto = require("crypto");

function encrypt(message) {
  const cipher = crypto.createCipheriv(algorithm, Securitykey, initVector);

  let encryptedData = cipher.update(message, "utf-8", "hex");

  return (encryptedData += cipher.final("hex"));
}

function decrypt(encryptedData) {
  try {
    const decipher = crypto.createDecipheriv(
      algorithm,
      Securitykey,
      initVector
    );
    let decryptedData = decipher.update(encryptedData, "hex", "utf-8");

    return (decryptedData += decipher.final("utf8"));
  } catch {
    console.log;
  }
}

module.exports = { encrypt, decrypt };
