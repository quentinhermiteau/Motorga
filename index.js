const Discord = require('discord.js');
const Event = require('./commands/event');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

const adapter = new FileSync('./data/db.json');
const db = low(adapter);
db.defaults({ events: [] }).write();

const bot = new Discord.Client()
bot.login('NzUwNzAxNzk5MDE0NjYyMTg1.X0-XiA.2wT3d1t-EbQNObSLNX5B1NTzuc0');

bot.on('message', (message) => {
    if(Event.match(message)) {
        Event.action(message);
    }
})
