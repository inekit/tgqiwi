function log() {}

function getChatID() {
  return msg.chat.id;
}

function getItemID() {
  return sourse.substr(2, sourse.length);
}

module.exports = {
  log,
  getChatID,
  getItemID,
};
