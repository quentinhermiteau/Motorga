const Members = require('../data/members');
const { MessageEmbed } = require('discord.js');

module.exports = class Member {
    static match(message) {
        return message.content.startsWith('!member');
    }

    static action(message) {
        const args = message.content.split(' ');

        args.shift(); //remove the member prefix of the command

        switch (args[0]) {
            case 'help':
                this.getHelp(message);
                break;
            case 'list':
                this.getList(message);
                break;
            case 'add':
                this.addMember(message);
                break;
            case 'edit':
                this.editMember(message);
                break;
            case 'increase':
                this.increaseOpenMember(message, args);
                break;
            case 'decrease':
                this.decreaseOpenMember(message, args);
                break;
            case 'reset':
                this.resetMembersOpens(message);
                break;
            default:
                message.channel.send('Désolé mais cette commande n\'existe pas.')
                break;
        }
    }

    static getHelp(message) {
        const embed = new MessageEmbed()
        .setColor('#0099ff')
        .setTitle('!member help commands');

        embed.setDescription('Détail des commandes du bot pour ajouter un membre dans l\'association.');

        embed.fields = [
            {
                name: '!member help',
                value: 'Affiche le détail des commandes du bot.'
            },
            {
                name: '!member list',
                value: 'Affiche la liste des membres de l\'association.'
            },
            {
                name: '!member add',
                value: 'Permet de s\'ajouter à la liste des membres.'
            },
            {
                name: '!member edit',
                value: 'Permet de modifier votre profil.'
            }
        ];

        return message.channel.send({embed: embed});
    }

    static getList(message) {
        const members = Members.getMembers();

        const embed = new MessageEmbed()
        .setColor('#0099ff')
        .setTitle('Liste des membres');

        let nameMax = 0;
        // | idid | name | promotion | opens |
        const nameColMaxLength = 75; // 95 max - 2 for promotion - 1 for opens - 4 for id - 13 for spaces and pipes
        const limit = 1024 - 95;

        let cols = [];

        members.forEach(member => {
            let col = `${member.lastname} ${member.firstname}`;
            let colLength = col.length;
            nameMax = colLength > nameMax ? colLength : nameMax;
            if (nameMax > nameColMaxLength) {
                col = col.slice(0, (nameColMaxLength - 1));
            }
            cols.push(col);
        });

        members.sort(this.sortMembers);

        let limits = [];

        let ligns = '```';

        for (let index = 0; index < members.length; index++) {
            const name = `${members[index].lastname} ${members[index].firstname}`;
            let lign = `| ${members[index].id} | ${name}`;
            const spaces = nameMax - name.length;
            for (let j = 0; j < spaces; j++) {
                lign += ` `;
            }

            if ((ligns.length + lign.length) > (limit*(limits.length+1))) {
                limits.push(ligns.length);
            }
            
            lign += ` | ${members[index].promotion} | ${members[index].opens} |`;
            ligns += lign + '\n';
        }

        ligns += '```';

        limits.forEach((value, index) => {
            const start = index == 0 ? 0 : limits[index-1];
            const text = (index != 0 ? '```' : '') + ligns.slice(start, value) + '```';
            const title = index == 0 ? '| id | Nom Prénom | classe | opens |' : `page ${index+1}`;
            embed.addField(title, text);

            if (ligns.length > limit && limits.length == 1) {          
                embed.addField('page 2', '```' + ligns.slice(value, ligns.length));
            }
        })

        message.channel.send({embed: embed})
    }

    static addMember(message) {
        let member = {id: message.author.discriminator, opens: 0};

        const foundMember = Members.getMember(member.id);

        if (foundMember) {
            message.reply("Tu es déjà inscrit.");
            return;
        }

        const options = {
            lastnameText: "```Bonjour et bienvenue dans l\'association moto!\nJe vais t\'aider à enregistrer tes informations personnels afin que les admins puissent compter tes points. 😉\nTout d'abord est ce que tu peux me donner ton nom? 👀```",
            firstnameText: "```Parfait, maintenant j'aurais besoin de ton prénom! 😁```",
            promoText: "```Dernière étape, En quelle année es tu? (1I, 1A, 2I, 2A, 3A, 4A, 5A) 😁```"
        }

        this.profiler(message, member, options, member => Members.addMember(member));
    }

    static editMember(message) {
        const id = message.author.discriminator;
        const member = Members.getMember(id);

        if (!member) {
            message.reply('Tu ne t\'es pas encore enregistré, tu devrais plutôt utiliser la commande `!member add`');
            return;
        }

        const options = {
            lastnameText: "```Bonjour! Il semblerait que tu aies fais une demande de modification de profil.\nSi tu as changé d'avis, ne réponds tout simplement pas et je te laisserais tranquille après mon timeout!\nAlors, quel est ton nouveau nom?```",
            firstnameText: "```Et ton nouveau prénom?```",
            promoText: "```Et pour finir, ta nouvelle promo? (1I, 1A, 2I, 2A, 3A, 4A, 5A)```"
        }

        this.profiler(message, member, options, member => Members.updateMember(id, member));
    }

    static increaseOpenMember(message, args) {
        if(!this.isAdmin(message)) {
            message.channel.send('Tu n\'es pas autorisé à utiliser cette commande!');
            return;
        }

        args.shift(); // remove 'increase'

        const memberId = args[0];
        const member = Members.getMember(memberId);

        if (!member) {
            message.channel.send('Ce membre n\'existe pas.');
            return;
        }

        let open = 1;
        if (args[1]) {
            open = args[1];
        }

        const result = parseInt(member.opens) + parseInt(open);
        if (result > 4 && !this.isAdmin(message)) {
            message.channel.send('Ce membre ne peut pas dépasser 4 points open, son nombre de points a été fixé à 4.');
            member.opens = 4;
        } else if(result > 8) {
            message.channel.send('Ce membre ne peut pas dépasser 8 points open, son nombre de points a été fixé à 8.');
            member.opens = 8;
        } else {
            message.channel.send(`Ajout de ${open} points open réussi.`);
            member.opens = result;
        }

        Members.updateMember(memberId, member);
        return;
    }

    static decreaseOpenMember(message, args) {
        if(!this.isAdmin(message)) {
            message.channel.send('Tu n\'es pas autorisé à utiliser cette commande!');
            return;
        }

        args.shift(); // remove 'decrease'

        const memberId = args[0];
        const member = Members.getMember(memberId);

        if (!member) {
            message.channel.send('Ce membre n\'existe pas.');
            return;
        }

        let open = 1;
        if (args[1]) {
            open = args[1];
        }

        const result = parseInt(member.opens) - parseInt(open);
        
        if (result < 0) {
            message.channel.send('Un membre ne peut pas avoir moins de 0 points open, son nombre de points à été fixé à 0.');
            member.opens = 0;
        } else {
            message.channel.send(`Retrait de ${open} points open réussi.`);
            member.opens = result;
        }
        
        Members.updateMember(memberId, member);
        return;
    }

    // WARNING: reset every members's opens
    static resetMembersOpens(message) {
        if (!this.isAdmin(message)) {
            message.channel.send('Tu n\'es pas autorisé à utiliser cette commande!');
            return;
        }

        const authorId = message.author.id;
        message.reply('Es tu sûr de vouloir remettre à 0 les points open de tous les membres? Cette action est irréversible!!!\nY=oui, N=non')
        .then(response => {
            response.channel.awaitMessages(response => response.content, {
                max: 1,
                time: 30000,
                errors: ['time'],
            }).then(collected => {
                const responseAuthorId = collected.first().author.id
                if(responseAuthorId == authorId) {
                    const response = collected.first().content;
                    if (response === 'Y') {
                        message.channel.send('Remise à 0 des points open de tous les membres.');
                        const members = Members.getMembers();

                        members.forEach(member => {
                            member.opens = 0;
                            Members.updateMember(member.id, member);
                        });
                    } else if (response === 'N') {
                        message.channel.send('Action annulée');
                    } else {
                        message.channel.send('Réponse invalide, action annulée.');
                    } 
                }

                return;
            }).catch(() => {
                message.reply('Vous avez mit trop de temps pour répondre, action annulée.');
            });
        })
    }

    static embedMemberConstructor(member) {
        const embed = new MessageEmbed()
            .setColor('#0099ff')
            .setTitle('Votre fiche membre')
            .addFields(
                {
                    name: 'Nom',
                    value: member.lastname
                },
                {
                    name: 'Prénom',
                    value: member.firstname
                },
                {
                    name: 'Promo',
                    value: member.promotion
                }
            );

        return embed;
    }

    static async profiler(message, member, options, callback) {
        const timeoutMessage = '```Désolé tu as mis trop de temps pour répondre. 😔\nMais tu peux recommencer en relançant la commande dans le channel prévu!```';

        message.author.send(options.lastnameText)
        .then(privateMessage => {
            privateMessage.channel.awaitMessages(response => response.content, {
                max: 1,
                time: 30000,
                errors: ['time'],
            }).then(collected => {
                member.lastname = this.capitalize(collected.first().content);

                message.author.send(options.firstnameText)
                .then(privateMessage => {
                    privateMessage.channel.awaitMessages(response => response.content, {
                        max: 1,
                        time: 30000,
                        errors: ['time'],
                    }).then(collected => {
                        member.firstname = this.capitalize(collected.first().content);

                        message.author.send(options.promoText)
                        .then(privateMessage => {
                            privateMessage.channel.awaitMessages(response => response.content, {
                                max: 1,
                                time: 30000,
                                errors: ['time'],
                            }).then(collected => {
                                member.promotion = collected.first().content.toUpperCase();

                                const embed = this.embedMemberConstructor(member);

                                privateMessage.channel.send({embed: embed});
                                callback(member);
                            })
                            .catch(() => {
                                message.author.send(timeoutMessage);
                            });
                        });
                    })
                    .catch(() => {
                        message.author.send(timeoutMessage);
                    });
                });
            })
            .catch(() => {
                message.author.send(timeoutMessage);
            });
        })
    }

    static capitalize(string) {
        const loweredCaseString = string.toLowerCase();
        return loweredCaseString.charAt(0).toUpperCase() + loweredCaseString.slice(1);
    }

    static isAdmin(message) {
        let adminRole = message?.guild?.roles?.cache.find(role => role.name === "Admin");
        return message?.member?.roles?.cache.has(adminRole.id)
    }

    static sortMembers(a, b) {
        if (a.opens > b.opens) {
            return -1;
        }

        if (a.opens < b.opens) {
            return 1;
        }

        return 0;
    }
}

