function log(msg) {
  console.log(msg.message_id);
}

function getChatID(msg) {
  return msg.chat.id;
}

function getItemID(sourse) {
  return sourse.substr(2, sourse.length);
}

module.exports = {
  log,
  getChatID,
  getItemID,
};
