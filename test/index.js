const { Duck:qb } = require('../index');
const qr = new qb();
//TEST
console.log(qr.insert('a').queryValues(new qb().select('a','a'), 'b','c').toInstruction());