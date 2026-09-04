const { Duck:qb } = require('../index');
const qr = new qb();

console.log(qr.select('a').from('k').where('f','>',2).toInstruction());