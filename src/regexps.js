module.exports = {
  token: /^[a-zA-Z0-9]{10,50}$/,
  notToken: /^([^A-Za-z0-9]*)?(^(.+){0,9}$)?(^(.+){51,1000}$)?$/,
  tokenName: /^[a-zA-Z0-9а-яА-Яё\/s]{1,30}$/,
  notTokenName: /[^a-zA-Z0-9а-яА-Яё\/s]/,
  confirm: /ДА/,
  undo: /НЕТ/,
  card: /[0-9]{16}/,
  pConType: /^(http(s)?)$/,
  pConString: /(.+){1}:([0-9]{1,13}){1}:(.+){1}:(.+){1}/,
};
