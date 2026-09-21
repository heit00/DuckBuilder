const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

// Importações da camada ORM
const { Type, defineType, getType } = require('../lib/orm/schema/typesDefinition/type');
require('../lib/orm/schema/typesDefinition/default'); // Registra Integer, VarChar, JsonType
const { Column } = require('../lib/orm/schema/elements/column');
const { TableSchema } = require('../lib/orm/schema/elements/table');
const { Constraint } = require('../lib/orm/schema/concepts/constraint');
const { Relationship } = require('../lib/orm/schema/concepts/reference');
const { registerTable, getTables } = require('../lib/orm/schema/internal/tablesRegister');
const { isColumn, isTable, isType } = require('../lib/orm/global-symbol-lockup/symbols');
const { SchemaGrammar } = require('../lib/orm/schema/grammar/schemaGrammar');

describe('🦆 DuckBuilder — Suíte de Testes do ORM (node:test)', () => {

  describe('1. Sistema de Tipos (Types Definition)', () => {
    it('deve recuperar os tipos padrão registrados via getType()', () => {
      const IntType = getType('Integer');
      const VarCharType = getType('VarChar');
      const Json = getType('JsonType');

      assert.ok(IntType, 'Integer deve estar registrado');
      assert.ok(VarCharType, 'VarChar deve estar registrado');
      assert.ok(Json, 'JsonType deve estar registrado');
    });

    it('deve armazenar args na instância, suportar static params e ser identificado por isType()', () => {
      const VarCharType = getType('VarChar');
      const IntType = getType('Integer');

      const vc255 = new VarCharType(255);
      assert.deepStrictEqual(vc255.args, [255]);
      assert.strictEqual(vc255.length, 255);
      assert.deepStrictEqual(VarCharType.params, ['length']);
      assert.strictEqual(isType(vc255), true);

      const intInst = new IntType();
      assert.deepStrictEqual(intInst.args, []);
      assert.deepStrictEqual(IntType.params, []);
      assert.strictEqual(isType(intInst), true);
      assert.strictEqual(isType({}), false);
    });

    it('deve lançar ReferenceError ao buscar um tipo inexistente', () => {
      assert.throws(
        () => getType('TipoInexistente'),
        {
          name: 'ReferenceError',
          message: 'Type "TipoInexistente" not found.'
        }
      );
    });

    describe('Integer Type', () => {
      const IntClass = getType('Integer');
      const intInstance = new IntClass();

      it('to(): deve converter números e strings numéricas para inteiros', () => {
        assert.strictEqual(intInstance.to(42), 42);
        assert.strictEqual(intInstance.to('100'), 100);
      });

      it('to(): deve retornar null para null e undefined', () => {
        assert.strictEqual(intInstance.to(null), null);
        assert.strictEqual(intInstance.to(undefined), null);
      });

      it('to(): deve lançar TypeError para valores não inteiros ou inválidos', () => {
        assert.throws(() => intInstance.to(3.14), { name: 'TypeError' });
        assert.throws(() => intInstance.to('abc'), { name: 'TypeError' });
        assert.throws(() => intInstance.to(NaN), { name: 'TypeError' });
      });

      it('from(): deve converter dados do banco para inteiros', () => {
        assert.strictEqual(intInstance.from('99'), 99);
        assert.strictEqual(intInstance.from(null), null);
        assert.strictEqual(intInstance.from(undefined), null);
      });

      it('from(): deve lançar TypeError se o valor não puder ser parseado', () => {
        assert.throws(() => intInstance.from('invalido'), { name: 'TypeError' });
      });
    });

    describe('VarChar Type', () => {
      const VarCharClass = getType('VarChar');
      const varchar = new VarCharClass(255);

      it('deve armazenar o comprimento da coluna', () => {
        assert.strictEqual(varchar.length, 255);
      });

      it('to() e from(): deve processar strings e valores nulos', () => {
        assert.strictEqual(varchar.to('DuckBuilder'), 'DuckBuilder');
        assert.strictEqual(varchar.to(null), null);
        assert.strictEqual(varchar.to(undefined), null);
        assert.strictEqual(varchar.from('DuckBuilder'), 'DuckBuilder');
      });
    });

    describe('JsonType', () => {
      const JsonClass = getType('JsonType');
      const json = new JsonClass();

      it('to(): deve serializar objetos em strings JSON', () => {
        const payload = { role: 'admin', active: true };
        assert.strictEqual(json.to(payload), JSON.stringify(payload));
        assert.strictEqual(json.to('{"ja":"string"}'), '{"ja":"string"}');
        assert.strictEqual(json.to(null), null);
      });

      it('from(): deve desserializar string JSON de volta para objeto', () => {
        const jsonString = '{"user":"heit00","score":10}';
        assert.deepStrictEqual(json.from(jsonString), { user: 'heit00', score: 10 });
        assert.strictEqual(json.from(null), null);
      });
    });

    describe('Extensibilidade de Tipos (defineType)', () => {
      it('deve permitir registrar um novo tipo derivado de Type', () => {
        class CustomUUID extends Type {
          constructor() {
            super('uuid', 'UUID_RADICAL');
          }
        }

        defineType(CustomUUID);
        assert.strictEqual(getType('CustomUUID'), CustomUUID);
      });

      it('deve rejeitar classes que não estendam Type', () => {
        class NaoEhType {}
        assert.throws(() => defineType(NaoEhType), {
          message: 'a extended-Type class must be send.'
        });
      });

      it('deve rejeitar tipos duplicados com o mesmo nome de classe', () => {
        const IntClass = getType('Integer');
        assert.throws(() => defineType(IntClass), {
          message: 'type already registered.'
        });
      });
    });
  });

  describe('2. Definição de Colunas (Column) & Identificação AST', () => {
    it('deve criar uma coluna com encadeamento fluente de atributos', () => {
      const IntClass = getType('Integer');
      const col = new Column('idade')
        .type(new IntClass())
        .nullable(false)
        .default(18);

      assert.strictEqual(col.name(), 'idade');
      assert.ok(col.type() instanceof IntClass);
      assert.strictEqual(col.nullable(), false);
      assert.strictEqual(col.default(), 18);
    });

    it('deve criar chave primária através da factory Column.id()', () => {
      const idCol = Column.id('user_id');
      assert.strictEqual(idCol.name(), 'user_id');
      assert.strictEqual(idCol.primary(), true);
      assert.strictEqual(idCol.autoIncrement(), true);
    });

    it('deve ser reconhecido corretamente por isColumn() via Símbolos AST', () => {
      const col = new Column('email');
      assert.strictEqual(isColumn(col), true);
      assert.strictEqual(isColumn({}), false);
      assert.strictEqual(isColumn(null), false);
      assert.strictEqual(isColumn('coluna'), false);
    });
  });

  describe('3. Restrições e Relações (Constraint & Relationship)', () => {
    it('deve validar os prefixos padronizados de constraints', () => {
      assert.strictEqual(Constraint.PREFIX.primary, 'pk');
      assert.strictEqual(Constraint.PREFIX.unique, 'un');
      assert.strictEqual(Constraint.PREFIX.nullable, 'nu');
      assert.strictEqual(Constraint.PREFIX.check, 'ch');
    });

    it('deve validar os tipos padronizados de constraints', () => {
      assert.strictEqual(Constraint.TYPES.primaryKey, 'PRIMARY KEY');
      assert.strictEqual(Constraint.TYPES.foreignKey, 'FOREIGN KEY');
      assert.strictEqual(Constraint.TYPES.unique, 'UNIQUE');
      assert.strictEqual(Constraint.TYPES.check, 'CHECK');
    });

    it('deve construir uma Constraint com nome prefixado e colunas', () => {
      const c = new Constraint()
        .name('users_email', Constraint.PREFIX.unique)
        .type(Constraint.TYPES.unique)
        .columns('email');

      assert.strictEqual(c.name(), 'un_users_email');
      assert.strictEqual(c.type(), Constraint.TYPES.unique);
      assert.deepStrictEqual(c.columns(), ['email']);
    });

    it('deve validar cardinalidades de Relationship', () => {
      assert.strictEqual(Relationship.TYPES.oneToOne, '1-1');
      assert.strictEqual(Relationship.TYPES.oneToMany, '1-N');
      assert.strictEqual(Relationship.TYPES.manyToOne, 'N-1');
      assert.strictEqual(Relationship.TYPES.manyToMany, 'N-N');
      assert.strictEqual(Relationship.PREFIX.foreign, 'fk');
    });
  });

  describe('4. Estrutura de Schema de Tabelas (TableSchema)', () => {
    it('deve instanciar TableSchema com schema padrão public', () => {
      const table = new TableSchema('produtos');
      assert.strictEqual(table.name, 'produtos');
      assert.strictEqual(table.schemaName, 'public');
      assert.strictEqual(isTable(table), true);
    });

    it('deve instanciar TableSchema com schema personalizado', () => {
      const table = new TableSchema('pedidos', 'vendas');
      assert.strictEqual(table.name, 'pedidos');
      assert.strictEqual(table.schemaName, 'vendas');
      assert.strictEqual(isTable(table), true);
    });

    it('deve definir colunas e registrar chave primária automaticamente nas constraints', () => {
      const users = new TableSchema('usuarios');
      const idCol = Column.id('id');
      const nameCol = new Column('nome');

      users.defineColumns(idCol, nameCol);

      assert.strictEqual(users.columns.size, 2);
      assert.ok(users.columns.has('id'));
      assert.ok(users.columns.has('nome'));
      assert.deepStrictEqual(users.primaryKeys, ['id']);

      // Deve ter criado constraint de PK: public_usuarios_id com prefixo pk_
      const expectedConstraintName = `pk_public_usuarios_id`;
      assert.ok(users.constraints.has(expectedConstraintName), `Constraint ${expectedConstraintName} deve existir`);
    });

    it('deve lançar TypeError se defineColumns receber argumento que não seja Column', () => {
      const table = new TableSchema('teste');
      assert.throws(
        () => table.defineColumns({ notAColumn: true }),
        { name: 'TypeError', message: 'columns must be a column' }
      );
    });

    it('deve criar relacionamento N-N (manyToManyRelation) gerando tabela pivot automaticamente', () => {
      const IntClass = getType('Integer');
      const autores = new TableSchema('autores');
      autores.defineColumns(Column.id('id').type(new IntClass()));

      const livros = new TableSchema('livros');
      livros.defineColumns(Column.id('id').type(new IntClass()));

      autores.manyToManyRelation('autores_livros', livros, { autor_id: 'id' }, { livro_id: 'id' });

      assert.ok(autores.relations.has('autores_livros'), 'autores deve possuir a relação N-N');
      assert.ok(livros.relations.has('autores_livros'), 'livros deve possuir a relação N-N');
      assert.strictEqual(livros.pivots.length, 1, 'livros deve ter 1 tabela pivot agendada');
      assert.strictEqual(livros.pivots[0].name, 'public.autores_relationIntermediate_public.livros');
    });
  });

  describe('5. Catálogo Global em Memória (tablesRegister)', () => {
    it('deve registrar tabelas e recuperá-las via getTables()', () => {
      const postsTable = new TableSchema('posts');
      registerTable(postsTable);

      const registered = getTables();
      assert.ok(registered.some(t => t.name === 'posts'));
    });

    it('deve rejeitar objetos que não sejam instâncias de TableSchema', () => {
      assert.throws(
        () => registerTable({ fakeTable: true }),
        { name: 'TypeError', message: 'all elements values of items[] must be a table instance.' }
      );
    });

    it('deve impedir o registro duplicado da mesma tabela no mesmo schema', () => {
      const duplicatePosts = new TableSchema('posts');
      assert.throws(
        () => registerTable(duplicatePosts),
        { message: 'table posts already registered.' }
      );
    });
  });

});
