const qb = require('./lib/index');
const x = new qb().select('x','y','z').from('a','b').where('T','>', qb.bind(2)).distinct().limit(2).offset(1).join('P',(join) => join.on('x','y.A').onOr('c', 'l').onGroup((x)=> x.add('z','=','p')));
console.log(x.toInstruction());

