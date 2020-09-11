const LowDb = require('../data/lowdb');
const Discord = require('discord.js');

module.exports = class Event {
    static match(message) {
        return message.content.startsWith('!event');
    }

    static action(message) {
        const args = message.content.split(' ');
        if (message.channel.name !== 'bot-sorties' && message.channel.name !== 'setup-bots') {
            message.channel.send('Merci d\'utiliser la commande !event uniquement sur le channel #bot-sorties.');
            return;
        }

        args.shift();

        switch (args[0]) {
            case 'help':
                this.getHelp(message);
                break;
            case 'list':
                this.getList(message);
                break;
            case 'create':
                this.createEvent(message, args);
                break;
            case 'delete':
                this.deleteEvent(message, args);
                break;
            case '':
                this.getHelp(message);
                break;
            default:
                if (args[1] == 'title') {
                    this.updateTitleEvent(message, args);
                } else if (args[1] == 'description') {
                    this.updateDescriptionEvent(message, args);
                } else {
                    this.getEvent(message, args[0]);
                }
                break;
        }
    }

    static getHelp(message) {
        const embed = new Discord.MessageEmbed()
        .setColor('#0099ff')
        .setTitle('Event Handler help commands');

        embed.setDescription('Détail des commandes du bot pour créer des sorties.');

        embed.fields = [
            {
                name: '!event help',
                value: 'Affiche le détail des commandes du bot.'
            },
            {
                name: '!event list',
                value: 'Liste les events actuellement en cours avec leurs id.'
            },
            {
                name: '!event 1',
                value: 'Affiche les infos d\'un event selon l\'id précisé (ici id 1) et permet aux personnes de participer.'
            },
            {
                name: '!event create mon-titre ma-description',
                value: 'Créé un event avec le titre et la description donnés (bien mettre les - entre chaque mots).'
            },
            {
                name: '!event delete 1',
                value: 'Supprime l\'event avec l\'id précisé.'
            },
            {
                name: 'S\'ajouter à la liste des participants:',
                value: 'Appuyer sur l\'emoji 👍.'
            },
            {
                name: 'Se retirer de la liste des participants:',
                value: 'Appuyer sur l\'emoji 👎.'
            }
        ]

        return message.channel.send({embed: embed});
    }

    static getList(message) {
        const events = LowDb.getEvents();
        return message.channel.send({embed: this.embedListConstructor(events)});
    }

    static getEvent(message, eventId) {
        const event = LowDb.getEvent(eventId);
        if (!event) {
            message.channel.send('Cet event n\'existe pas.');
            return;
        }

        message.channel.send({embed: this.embedConstructor(event)}).then(async embedMessage => {
            await embedMessage.react('👍');
            await embedMessage.react('👎');
            
            embedMessage.awaitReactions((reaction) =>
                ['👍', '👎'].includes(reaction.emoji.name),
                { max: 1, time: 60000 }
            ).then(collected => {
                const id = collected.first().users.cache.last().id
                const user = message.guild.members.cache.find((index, user) => index == id);

                if (collected.first().emoji.name == '👍') {
                    LowDb.addUserToEvent(user.nickname, eventId, message);
                    this.getEvent(message, eventId);
                }

                if (collected.first().emoji.name == '👎') {
                    LowDb.removeUserToEvent(user.nickname, eventId, message);
                    this.getEvent(message, eventId);
                }
            }).catch((error) => {
                console.log('erreur')
                console.log(error)
            });
        });
    }

    static createEvent(message, args) {
        args.shift();

        if (args[0]) {
            const event = LowDb.createEvent(args[0], args[1]);
            this.getEvent(message, event.id);
        } else {
            message.channel.send('Une erreur s\'est produite lors de la création de l\'event, le titre de l\'event est obligatoire.');
        }
    }

    static updateTitleEvent(message, args) {
        if (!args[2]) {
            message.channel.send('Le titre est incorrect.');
            return;
        }

        LowDb.updateTitleEvent(message, args[0], args[2]);
        message.channel.send('Titre de l\'event mis à jour.');
        this.getEvent(message, args[0]);
    }

    static updateDescriptionEvent(message, args) {
        if (!args[2]) {
            message.channel.send('La description est incorrect.');
            return;
        }

        const event = LowDb.updateDescriptionEvent(message, args[0], args[2]);
        message.channel.send('Description de l\'event mis à jour.');
        this.getEvent(message, args[0]);
    }

    static deleteEvent(message, args) {
        LowDb.deleteEvent(message, args[1]);
        message.channel.send('L\'event a bien été supprimé.');
        this.getList(message);
    }

    static embedListConstructor(events) {
        const embed = new Discord.MessageEmbed()
        .setColor('#0099ff')
        .setTitle('Liste des sorties');

        const fields = []

        events.forEach(event => {
            fields.push({name: event.title, value: `id: ${event.id}`})
        })

        embed.fields = fields;
        
        return embed;
    }

    static embedConstructor({id, title, description, participants}) {
        const embed = new Discord.MessageEmbed()
        .setColor('#0099ff')
        .setTitle(`${id}: ${title}`);

        if (description) {
            embed.setDescription(description);
        }

        embed.fields = [
            {
                name: (participants.length > 0) ? `Participants (${participants.length})` : "Participants",
                value: (participants.length > 0) ? participants.join('\n') : 'Aucun.'
            }
        ]
        
        return embed;
    }
}