const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('./data/el-ganador.sqlite');

console.log('Accounts:');
console.log(db.prepare('SELECT id, email, display_name, role FROM business_accounts').all());

console.log('Participations:');
console.log(db.prepare('SELECT * FROM participations').all());
