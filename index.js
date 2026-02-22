const {CaseClause:cc, Query:qb, CaseClause, Column} = require('./lib/index');
module.exports = qb;

const y = qb.case();
y.when('x','=','y', 2).when('u','z',4)
const x = new qb().select('2').whereIn('2', ['1','2']).orWhereIn('k', ['1' ,'2' , qb.column('a.b')]).where(2,3).join('z','k', '=', y).from('k');

console.log(x.toInstruction());

/*
 OUTPUT: 
 {
  template: 'DELETE FROM "a" WHERE ("x" = "z" AND ("x" = $1 OR "x" = "r"))',
  values: [ 2 ]
}
*/



