const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

const adapter = new FileSync('./data/db.json');
const db = low(adapter);

module.exports = class Members {
    static getMembers() {
        const members = db.get('members').value();

        return members;
    }

    static getMember(id) {
        const member = db.get('members').find({ id: id }).value();

        return member;
    }

    static addMember(member) {
        db.get('members').push(member).write();
    }

    static updateMember(id, member) {
        db.get('members').find({ id: parseInt(id) }).assign({...member}).write();
    }
}