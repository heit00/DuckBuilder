const { Frag:qb } = require('../index');

const test = new qb().insert('a').queryValues(new qb().select('a','b').from('c')).columns('l','u');
new Promise((rel, err) => rel(2)).then(x => console.log(test.toInstruction()));
