const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

// Importações funcionais do QueryBuilder
const { Column } = require('../lib/queryBuilder/lexicalStructures/column');
const { Table } = require('../lib/queryBuilder/lexicalStructures/table');
const { Raw } = require('../lib/queryBuilder/lexicalStructures/raw');
const { WhereClause } = require('../lib/queryBuilder/clauseStructures/where');
const { OrderBy } = require('../lib/queryBuilder/clauseStructures/orderBy');
const { Update } = require('../lib/queryBuilder/statements/update');
const { TemplateCount } = require('../lib/queryBuilder/util/template');
const { QueryGrammar } = require('../lib/queryBuilder/grammar/grammar');

describe('🦆 DuckBuilder — Suíte de Testes do QueryBuilder (node:test)', () => {

  describe('1. Estruturas Léxicas (Lexical Structures)', () => {
    it('Column: deve formatar identificadores com aspas e suportar alias', () => {
      const col = new Column('users.username', 'u_name');
      assert.strictEqual(col.toInstruction(), '"users"."username" AS "u_name"');
    });

    it('Table: deve formatar nome de tabela e alias com aspas', () => {
      const table = new Table('orders', 'o');
      assert.strictEqual(table.toInstruction(), '"orders" AS "o"');
    });

    it('Raw: deve interpolar fragmentos SQL crus e preservar bindings', () => {
      const rawFragment = new Raw('NOW() + INTERVAL ? DAY', 7);
      const tc = new TemplateCount();
      const compiled = rawFragment.toInstruction(tc);

      assert.strictEqual(compiled, 'NOW() + INTERVAL $1 DAY');
      assert.deepStrictEqual(tc.getLiterals(), [7]);
    });
  });

  describe('2. Estruturas de Cláusulas (Clause Structures)', () => {
    it('OrderBy: deve gerar ordenação ASC e DESC corretamente', () => {
      const ascOrder = new OrderBy('created_at', 'ASC');
      const descOrder = new OrderBy('id', 'DESC');

      assert.strictEqual(ascOrder.toInstruction(), '"created_at" ASC');
      assert.strictEqual(descOrder.toInstruction(), '"id" DESC');
    });

    it('WhereClause: deve acumular condições parametrizadas com operador AND', () => {
      const where = new WhereClause();
      where.where('status', '=', 'active');
      where.where('age', '>=', 18);

      const tc = new TemplateCount();
      const instruction = where.toInstruction(true, tc);

      assert.strictEqual(instruction, '("status" = $1 AND "age" >= $2)');
      assert.deepStrictEqual(tc.getLiterals(), ['active', 18]);
    });
  });

  describe('3. Statement: UPDATE', () => {
    it('deve gerar query UPDATE parametrizada com SET e WHERE', () => {
      const updateQuery = new Update('users');
      updateQuery
        .set('status', 'verified')
        .set('login_count', 5)
        .where('id', '=', 42);

      const instruction = updateQuery.toInstruction();
      assert.deepStrictEqual(instruction, {
        template: 'UPDATE "users" SET "status" = $1, "login_count" = $2 WHERE ("id" = $3)',
        values: ['verified', 5, 42]
      });
    });

    it('deve lançar QuerySyntaxError para tabela inválida', () => {
      assert.throws(
        () => new Update(null),
        { name: 'QuerySyntaxError' }
      );
    });
  });

  describe('4. Statements: SELECT, INSERT, DELETE e CTE', () => {
    const { Duck } = require('../index');

    it('SELECT: deve gerar query parametrizada com WHERE e ORDER BY', () => {
      const q = Duck.select('id', 'name')
        .from('users')
        .where('status', '=', 'active')
        .limit(10);

      assert.deepStrictEqual(q.toInstruction(), {
        template: 'SELECT "id", "name" FROM "users" WHERE ("status" = $1) LIMIT 10',
        values: ['active']
      });
    });

    it('INSERT: deve gerar instrução INSERT INTO com VALUES parametrizados', () => {
      const q = Duck.insert('users').values([{ name: 'heit', role: 'admin' }]);

      assert.deepStrictEqual(q.toInstruction(), {
        template: 'INSERT INTO "users" ("name", "role") VALUES ($1, $2)',
        values: ['heit', 'admin']
      });
    });

    it('DELETE: deve gerar query DELETE FROM com WHERE parametrizado', () => {
      const q = Duck.delete().from('users').where('id', '=', 5);

      assert.deepStrictEqual(q.toInstruction(), {
        template: 'DELETE FROM "users" WHERE ("id" = $1)',
        values: [5]
      });
    });

    it('CTE (WITH): deve renderizar subquery como CTE e acumular parâmetros na query raiz', () => {
      const cte = Duck.select('id').from('admins').where('role', '=', 'superadmin');
      const main = Duck.select('*')
        .with(cte, 'adm')
        .from('adm')
        .where('status', '=', 'active');

      assert.deepStrictEqual(main.toInstruction(), {
        template: 'WITH "adm" AS (SELECT "id" FROM "admins" WHERE ("role" = $1)) SELECT * FROM "adm" WHERE ("status" = $2)',
        values: ['superadmin', 'active']
      });
    });
  });

});

