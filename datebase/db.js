const mysql = require("mysql2");
const { getChatID } = require("../src/helper");
const {encrypt,decrypt} =require("./crypto")
const {mysqlParams} = require("../src/config")

let pool=mysql.createPool(
  mysqlParams,
  (err) => console.log(err)
);
pool.on('uncaughtException', function (err) {
  console.log('uncaughtException', err);
})

pool.on('error', function(err) {
  console.log("I'm dead",err);
})
function DB() {
  let con = pool
  con.createUser = createUser;
  con.addCard = addCard;
  con.getTokens = getTokens;
  con.addToken = addToken;
  con.deleteToken = deleteToken;
  con.updateProxy = updateProxy;
  con.getTokenByName=getTokenByName;
  con.getCard=getCard;
  con.getAllUsersPipe=getAllUsersPipe;
  con.defaultQuery=defaultQuery
  con.onoffcron=onoffcron
  return con;
}



function defaultQuery(query,arguments){
    return this.promise()
    .query(query, arguments)
    .catch((err) => {
      console.log(err);
      return;
    })
    .then((res) => {
      return res;
    })
}

async function getTokenByName(tokenName,tgId) {
let substr=tokenName!=="allall" ? "and token_name=?":""
try{
  let query="select token,token_name,proxy_login from tgqiwi.user_tokens where  user_id=? "+substr;
    
  let arguments=[tgId, tokenName];
  let [tokens,fields]=await this.defaultQuery(query,arguments)
  return(tokens.map((token=>{
    return Object.assign(token,{token:decrypt(token.token)})
  })))
}catch{}
  
}

function getAllUsersPipe(){
  let query="select u.tg_id from tgqiwi.users u where u.cron='on'";
  return DB().query(query).stream();
}

async function createUser(tgId) {
    let query="insert into tgqiwi.users (tg_id) values (?)";
    let arguments=[tgId];
    return await this.defaultQuery(query,arguments);
}

async function addCard(cardNumber,tgID) {
    let query="update tgqiwi.users set card_number=? where tg_id=?";
    let arguments=[cardNumber,tgID];
    return await this.defaultQuery(query,arguments);
}

async function getTokens(tgID) {
  try{
    let query="select * from tgqiwi.user_tokens where user_id=?";
    let arguments=[tgID];
    return((await this.defaultQuery(query,arguments))[0].map(row=>{
      return Object.assign(row,{token:decrypt(row.token)})
    }));
  }catch{}
    
}

async function onoffcron(tgID) {

  let arguments=[tgID,tgID];
  let query=`update tgqiwi.users set cron=(CASE WHEN cron ="off" THEN "on" ELSE "off" END)  where tg_id=?; `;
  let res=await this.defaultQuery(query,arguments);
  if (res[0].affectedRows!=1) throw new Error("DB err")


  query="select u.cron from tgqiwi.users u where tg_id=?";
  return( (await this.defaultQuery(query,arguments))[0]);

  
}


async function addToken(token,tokenName,tgID) {
    let query="insert into tgqiwi.user_tokens (user_id,token,token_name) values (?,?,?)";
    let arguments=[tgID,encrypt(token),tokenName];
    return await this.defaultQuery(query,arguments);
}


async function deleteToken(tokenName,tgID) {
    let substr=tokenName!=="allall" ? "and token_name=?":""

    let query="delete from tgqiwi.user_tokens where user_id=? "+substr;
    let arguments=[tgID,tokenName];
    return await this.defaultQuery(query,arguments);
}

async function updateProxy(tgID,tokenName,login) {
  let substr=tokenName!=="allall" ? "and token_name=?":""

    let query="update tgqiwi.user_tokens set proxy_login=? where user_id=? "+substr;
    let arguments=[login,tgID,tokenName];
    return await this.defaultQuery(query,arguments);
}

async function getCard(tgID) {
    let query="select card_number from tgqiwi.users where tg_id=? limit 1";
    let arguments=[tgID];
    let res=await this.defaultQuery(query,arguments);
    if (!res) return;
    return res[0][0].card_number;
}


module.exports = { DB };
