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
        if (message.channel.name !== 'bot-sorties' && message.channel.name !== 'setup-bots') {
            message.channel.send('Merci d\'utiliser la commande !event uniquement sur le channel #bot-sorties.');
            return;
        }
        Event.action(message);
    } else {
        if (message.author.username !== 'Motorga' && (message.channel.name === 'bot-sorties' || message.channel.name === 'setup-bots')) {
            message.delete();
            message.channel.send('Ce channel est réservé aux commandes du bot!');
            return;
        }
    }
})
