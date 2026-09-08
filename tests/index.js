const { Duck:qb } = require('../index');
const select = qb.select('a');
console.log(select.from('b').whereRaw('? > ?',1,2).toInstruction());