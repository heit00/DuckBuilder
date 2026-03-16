const { Duck:qb } = require('../index');

const x = new qb();
x.select('a',qb.raw('?',['as']), qb.column('p.c', 'l')).from('i').joinRaw('INNER JOIN k on 1 = ?',['p']).whereRaw('p > ?', [2]).orderByRaw('? DESC', [2]);

/*
OUTPUT:{
  template: 'WITH "s" AS (SELECT AVG("2")) UPDATE "x" SET "k" = $1 FROM "x" WHERE ("x" = $2) RETURNING "a", "v"',
  values: [ 2, 9 ]
}
*/

//ADD COUNT ARGS TO MAIN CLASS (query)

console.log(x.toInstruction());


const u = new qb();
const teste1 = u.select('id', 'nome', 'email')
  .from('usuarios')
  .where('status', 'ativo')
  .whereRaw('idade >= ?', [18])
  .orderBy(qb.order('criado_em', 'DESC')); // Usando o seu helper!

console.log(teste1.toInstruction());

const finalBoss = new qb();
const teste4 = finalBoss.select(
    qb.column('o.id'),
    qb.column('c.nome'),
    qb.case()
      .when(q => q.whereRaw('o.total > ?', [1000]), 'VIP')
      .when(q => q.where('o.status', 'reembolsado'), 'Devolvido')
      .else('Normal')
      .as('categoria_cliente')
  )
  .from('pedidos as o')
  .joinRaw('LEFT JOIN clientes c ON c.id = o.cliente_id AND c.ativo = ?', [true])
  .where('o.data_compra', '>=', qb.raw('NOW() - interval ?', ['30 days']))
  .orderBy(qb.order('o.total', 'DESC')); // Usando o seu helper!

console.log(teste4.toInstruction());