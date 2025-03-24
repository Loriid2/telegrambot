const TelegramBot = require('node-telegram-bot-api');
const token ="7913277457:AAGzji0uMd2RE87ahBvtUK85xBpw6XddtO8";
const bot = new TelegramBot(token, {polling: true});
bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;
    if(text==="/start"){
        bot.sendMessage(chatId, "hello world bomboclat");
    }
    if(text.indexOf("sono ")!==1){
        const name = text.replace ("sono ", "");
        bot.sendMessage(chatId, "Ciao " + name + " come stai?");
    }
});