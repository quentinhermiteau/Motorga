const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

const adapter = new FileSync('./data/db.json');
const db = low(adapter);

module.exports = class Firestore {
    static getEvents() {
        const events = db.get('events').value();

        return events;
    }

    static getEvent(eventId) {
        const event = db.get('events').find({id: parseInt(eventId)}).value();
        return event;
    }

    static addUserToEvent(user, eventId, message) {
        const event = db.get('events').find({ id: parseInt(eventId) }).value();

        if (!event.participants.includes(user)) {
            const participants = [...event.participants, user];
            db.get('events').find({ id: parseInt(eventId) }).assign({participants: participants}).write();
            message.channel.send('Participant ajouté.');
        } else {
            message.channel.send('Vous participez déjà à cet event.');
        }
    }

    static removeUserToEvent(user, eventId, message) {
        const event = db.get('events').find({ id: parseInt(eventId) }).value();

        if (event.participants.includes(user)) {
            const participants = event.participants.filter(participant => participant != user);
            db.get('events').find({ id: parseInt(eventId) }).assign({participants: participants}).write();
            message.channel.send('Participant retiré.');
        } else {
            message.channel.send('Vous ne participez pas à cet event.');
        }
    }

    static createEvent(title, description = '') {
        const id = Math.floor(Math.random() * 100);

        if (db.get('events').find({ id: parseInt(id) }).value()) {
            this.createEvent(title, description);
        }

        title = title.replace(/-/g, ' ');
        description = description.replace(/-/g, ' ');

        const event = {id: id, title: title, description: description, participants: []};
        db.get('events').push(event).write();
        return event;
    }

    static deleteEvent(message, eventId) {
        if (db.get('events').find({ id: parseInt(eventId) }).value()) {
            db.get('events').remove({ id: parseInt(eventId) }).write();
        } else {
            message.channel.send('Cet event n\'existe pas.');
        }
    }

    static updateTitleEvent(message, eventId, title) {
        if (db.get('events').find({ id: parseInt(eventId) }).value()) {
            title = title.replace(/-/g, ' ');
            db.get('events').find({ id: parseInt(eventId) }).assign({title: title}).write();
        } else {
            message.channel.send('Cet event n\'existe pas.');
        }
    }

    static updateDescriptionEvent(message, eventId, description) {
        if (db.get('events').find({ id: parseInt(eventId) }).value()) {
            description = description.replace(/-/g, ' ');
            db.get('events').find({ id: parseInt(eventId) }).assign({description: description}).write();
        } else {
            message.channel.send('Cet event n\'existe pas.');
        }
    }
}