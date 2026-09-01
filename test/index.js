const { Duck:qb } = require('../index');
const qr = new qb();
//TEST
console.log(qr.delete().from('l').toInstruction());