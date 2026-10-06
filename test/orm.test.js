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
const { isColumn, isTable, isType, ST } = require('../lib/orm/global-symbol-lockup/symbols');
const { SchemaGrammar } = require('../lib/orm/schema/grammar/schemaGrammar');
const { CreatorVisitorPostgresSQL } = require('../lib/orm/schemaCompiler/postgresSQL/visitors/creatorVisitor');
const { DefinitionVisitorPostgresSQL, qualifyTableName, qualifyTable } = require('../lib/orm/schemaCompiler/postgresSQL/visitors/definitionVisitor');
const { AlterVisitorPostgresSQL } = require('../lib/orm/schemaCompiler/postgresSQL/visitors/alterVisitor');
const { CompilerGrammar } = require('../lib/orm/schemaCompiler/postgresSQL/grammar/compileGrammar');

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
      assert.strictEqual(vc255.baseType, SchemaGrammar.BaseTypes.varchar);
      assert.strictEqual(vc255.radical, SchemaGrammar.BaseTypes.varchar);
      assert.deepStrictEqual(VarCharType.params, ['length']);
      assert.strictEqual(isType(vc255), true);

      const intInst = new IntType();
      assert.deepStrictEqual(intInst.args, []);
      assert.strictEqual(intInst.baseType, SchemaGrammar.BaseTypes.integer);
      assert.strictEqual(intInst.radical, SchemaGrammar.BaseTypes.integer);
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
            super('uuid', 'UUID_BASE_TYPE');
          }
        }

        defineType(CustomUUID);
        assert.strictEqual(getType('CustomUUID'), CustomUUID);
        const uuidInst = new CustomUUID();
        assert.strictEqual(uuidInst.baseType, 'UUID_BASE_TYPE');
        assert.strictEqual(uuidInst.radical, 'UUID_BASE_TYPE');
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

    it('deve validar os tipos padronizados de constraints unificados com SchemaGrammar', () => {
      assert.strictEqual(Constraint.TYPES.primaryKey, SchemaGrammar.constraints.types.primaryKey);
      assert.strictEqual(Constraint.TYPES.foreignKey, SchemaGrammar.constraints.types.foreignKey);
      assert.strictEqual(Constraint.TYPES.unique, SchemaGrammar.constraints.types.unique);
      assert.strictEqual(Constraint.TYPES.check, SchemaGrammar.constraints.types.check);
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

  describe('6. Compilação DDL de Tipos (CompilerGrammar & CreatorVisitorPostgresSQL)', () => {
    const visitor = new CreatorVisitorPostgresSQL();
    const IntClass = getType('Integer');
    const VarCharClass = getType('VarChar');
    const JsonClass = getType('JsonType');

    it('deve compilar Integer para INTEGER e SERIAL quando autoIncrement for true', () => {
      const colNormal = new Column('idade').type(new IntClass());
      const colAuto = Column.id('id').type(new IntClass());

      assert.strictEqual(visitor[ST.type](colNormal.type(), colNormal), 'INTEGER');
      assert.strictEqual(visitor[ST.type](colAuto.type(), colAuto), 'SERIAL');
    });

    it('deve compilar VarChar com length especificado ou valor padrão 255', () => {
      const vc100 = new VarCharClass(100);
      const vcDefault = new VarCharClass();

      assert.strictEqual(visitor[ST.type](vc100), 'VARCHAR(100)');
      assert.strictEqual(visitor[ST.type](vcDefault), 'VARCHAR(255)');
    });

    it('deve compilar JsonType para JSONB no dialeto PostgreSQL', () => {
      const json = new JsonClass();
      assert.strictEqual(visitor[ST.type](json), 'JSONB');
    });

    it('deve aplicar fallback com name em maiúsculo para tipos customizados sem mapper', () => {
      const customType = { name: 'uuid', radical: 'CUSTOM_UUID', args: [] };
      assert.strictEqual(visitor[ST.type](customType), 'UUID');
    });

    it('deve suportar definição de tipo na Column passando string do tipo com argumentos', () => {
      const col = new Column('nome').type('VarChar', 120);
      assert.ok(isType(col.type()));
      assert.strictEqual(visitor[ST.type](col.type(), col), 'VARCHAR(120)');
    });
  });

  describe('7. Compilação de Definições DDL (DefinitionVisitorPostgresSQL)', () => {
    const defVisitor = new DefinitionVisitorPostgresSQL();
    const IntClass = getType('Integer');

    it('deve compilar definição de coluna com tipo e default', () => {
      const col = new Column('idade').type(new IntClass()).default(18);
      assert.strictEqual(defVisitor[ST.column](col), '"idade" INTEGER DEFAULT 18');
    });

    it('deve compilar constraint de PRIMARY KEY com colunas formatadas', () => {
      const pk = new Constraint().name('usuarios_id', Constraint.PREFIX.primary).type(Constraint.TYPES.primaryKey).columns('id');
      assert.strictEqual(defVisitor[ST.constraint](pk), 'CONSTRAINT "pk_usuarios_id" PRIMARY KEY ("id")');
    });

    it('deve compilar constraint de UNIQUE e CHECK', () => {
      const un = new Constraint().name('usuarios_email', Constraint.PREFIX.unique).type(Constraint.TYPES.unique).columns('email');
      assert.strictEqual(defVisitor[ST.constraint](un), 'CONSTRAINT "un_usuarios_email" UNIQUE ("email")');

      const ch = new Constraint().name('check_idade', Constraint.PREFIX.check).type(Constraint.TYPES.check).expression('idade >= 18');
      assert.strictEqual(defVisitor[ST.constraint](ch), 'CONSTRAINT "ch_check_idade" CHECK (idade >= 18)');
    });

    it('deve lançar TypeError se argumentos não forem nós válidos de AST', () => {
      assert.throws(() => defVisitor[ST.column]({}), { name: 'TypeError' });
      assert.throws(() => defVisitor[ST.constraint]({}), { name: 'TypeError' });
      assert.throws(() => defVisitor[ST.type]('invalido'), { name: 'TypeError' });
    });
  });

  describe('8. Qualificação de Tabelas (qualifyTableName / qualifyTable)', () => {
    const creator = new CreatorVisitorPostgresSQL();

    it('deve qualificar strings simples com aspas', () => {
      assert.strictEqual(qualifyTableName('usuarios'), '"usuarios"');
      assert.strictEqual(creator.qualifyTable('usuarios'), '"usuarios"');
    });

    it('deve separar schema e tabela em strings com ponto e aplicar aspas duplas', () => {
      assert.strictEqual(qualifyTableName('public.usuarios'), '"public"."usuarios"');
      assert.strictEqual(creator.qualifyTableName('vendas.pedidos'), '"vendas"."pedidos"');
    });

    it('deve qualificar instâncias de TableSchema com schema padrão e customizado', () => {
      const publicTable = new TableSchema('produtos');
      assert.strictEqual(creator.qualifyTableName(publicTable), '"public"."produtos"');

      const customTable = new TableSchema('pedidos', 'vendas');
      assert.strictEqual(qualifyTableName(customTable), '"vendas"."pedidos"');
    });

    it('deve lançar TypeError para entradas nulas ou vazias', () => {
      assert.throws(() => qualifyTableName(null), { name: 'TypeError' });
      assert.throws(() => qualifyTableName(''), { name: 'TypeError' });
    });
  });

  describe('9. Compilação de Alterações DDL (AlterVisitorPostgresSQL) & Gramática de Separadores', () => {
    const alterVisitor = new AlterVisitorPostgresSQL();
    const table = new TableSchema('usuarios', 'public');
    const IntClass = getType('Integer');

    it('deve validar constantes de separadores e ponto e vírgula na gramática (CG)', () => {
      assert.strictEqual(CompilerGrammar.tableDDL.separators.left, '(');
      assert.strictEqual(CompilerGrammar.tableDDL.separators.right, ')');
      assert.strictEqual(CompilerGrammar.tableDLL.separators.left, '(');
      assert.strictEqual(CompilerGrammar.tableDLL.separators.right, ')');
      assert.strictEqual(CompilerGrammar.terminator, ';');
      assert.strictEqual(CompilerGrammar.punctuation.semicolon, ';');
    });

    it('deve gerar instrução ALTER TABLE ADD CONSTRAINT usando separadores e terminator', () => {
      const pk = new Constraint().name('usuarios_id', Constraint.PREFIX.primary).type(Constraint.TYPES.primaryKey).columns('id');
      const sql = alterVisitor[ST.constraint](pk, { table });
      assert.strictEqual(sql, 'ALTER TABLE "public"."usuarios" ADD CONSTRAINT "pk_usuarios_id" PRIMARY KEY ("id");');
    });

    it('deve gerar instrução ALTER TABLE DROP CONSTRAINT com CASCADE opcional', () => {
      const pk = new Constraint().name('usuarios_id', Constraint.PREFIX.primary).type(Constraint.TYPES.primaryKey).columns('id');
      const sql = alterVisitor[ST.constraint](pk, { table, action: CompilerGrammar.statements.drop, cascade: true });
      assert.strictEqual(sql, 'ALTER TABLE "public"."usuarios" DROP CONSTRAINT "pk_usuarios_id" CASCADE;');
    });

    it('deve gerar instrução ALTER TABLE ADD COLUMN e DROP COLUMN com terminator', () => {
      const col = new Column('idade').type(new IntClass()).default(18);
      const addSQL = alterVisitor[ST.column](col, { table });
      assert.strictEqual(addSQL, 'ALTER TABLE "public"."usuarios" ADD COLUMN "idade" INTEGER DEFAULT 18;');

      const dropSQL = alterVisitor[ST.column](col, { table, action: CompilerGrammar.statements.drop });
      assert.strictEqual(dropSQL, 'ALTER TABLE "public"."usuarios" DROP COLUMN "idade";');
    });
  });

});

