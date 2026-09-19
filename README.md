# 🦆 DuckBuilder
### *The Modular Query Builder & ORM for PostgreSQL*

**DuckBuilder** is a high-performance, modular query builder and emerging ORM engineered specifically for **PostgreSQL** in modern JavaScript (Node.js). It provides a fluent, parameterized, and secure interface for database operations with zero external dependencies.

---

## ✨ Key Features

* 🛡️ **PostgreSQL-First & Safe by Default:** Native `$1, $2, ...` parameter binding via `TemplateCount` to prevent SQL injection, with automatic identifier quoting (`"table"."column"`).
* 🌳 **AST & Symbol-Based Architecture:** Uses internal symbol-based typing (`Symbol.for`) and AST-like nodes for robust, composable queries.
* ⚡ **Full DML & DQL Support:** Comprehensive `SELECT`, `INSERT` (with Upsert / `ON CONFLICT`), `UPDATE` (with `FROM`), and `DELETE` (with `USING`) builders.
* 🧩 **Advanced SQL Constructs:** Native support for Common Table Expressions (`WITH`), Subqueries, `CASE ... WHEN`, `WHERE EXISTS`, `WHERE IN`, `BETWEEN`, Window/Aggregate functions, and Raw SQL fragments (`?` binding).
* 🧬 **Extensible ORM Layer:** Clean object-oriented schema definitions (`TableSchema`, `Column`), extensible type casting system (`Type`, `defineType`), structural relationship modeling (`Relationship`, `Reference`), and centralized table cataloging (`registerTable`).
* 🧪 **Native Test Suite:** Fully covered by automated unit tests using Node.js's native test runner (`node:test`).

---

## 🏗️ Architecture & Modules

```
DuckBuilder/
├── index.js                     # Facade entry point ({ Duck })
├── lib/
│   ├── index.js                 # Main Query (Duck) class & static factories
│   ├── queryBuilder/            # Core Query Builder engine
│   │   ├── statements/          # Select, Insert, Update, Delete
│   │   ├── clauseStructures/    # Where, Join, Case, With, OrderBy, OnConflict, etc.
│   │   ├── lexicalStructures/   # Column, Table, Bind, Raw, Expression, Functions
│   │   ├── grammar/             # QueryGrammar (SQL keywords & constants)
│   │   ├── symbol-lockup/       # Internal AST Symbols
│   │   └── util/                # TemplateCount, Types validator (T, Rule), Error
│   └── orm/                     # Emerging ORM Layer
│       └── schema/
│           ├── concepts/        # Constraint, Reference, Relationship
│           ├── elements/        # Column, TableSchema
│           ├── grammar/         # SchemaGrammar (DDL keywords & constants)
│           ├── internal/        # tablesRegister, manyToManyRelation (pivot tables)
│           ├── symbol-lockup/   # Schema AST Symbols (isTable, isColumn)
│           └── typesDefinition/ # Base Type, defineType, getType, Default types
├── test/                        # Automated unit test suites (node:test)
│   ├── queryBuilder.test.js     # Query builder statement & compilation tests
│   └── orm.test.js              # Schema, Types, and Table catalog tests
└── .agents/                     # Project guidelines (CONTEXT.md) and task tracker (WORKS.md)
```

---

## 🦆 Query Builder Examples

> [!NOTE]
> Queries are instantiated directly through the static factory methods on `Duck` (e.g., `Duck.select()`, `Duck.insert()`, `Duck.update()`, `Duck.delete()`).

### 1. SELECT with Joins, Aggregates and Filtering
```javascript
const { Duck } = require('./index');

const query = Duck
  .select(
    Duck.column('u.id'),
    Duck.column('u.username'),
    Duck.count('p.id', 'total_posts')
  )
  .from(Duck.table('users', 'u'))
  .leftJoin(Duck.table('posts', 'p'), join => {
    join.on('p.user_id', '=', Duck.column('u.id'))
        .on('p.is_deleted', '=', false);
  })
  .where('u.status', '=', 'active')
  .whereIn('u.role', ['admin', 'editor'])
  .groupBy(Duck.column('u.id'), Duck.column('u.username'))
  .having(Duck.count('p.id'), '>', 5)
  .orderBy(Duck.order('u.username', 'asc'));

console.log(query.toInstruction());
/*
{
  template: 'SELECT "u"."id", "u"."username", COUNT("p"."id") AS "total_posts" FROM "users" AS "u" LEFT JOIN "posts" AS "p" ON ("p"."user_id" = "u"."id" AND "p"."is_deleted" = $1) WHERE ("u"."status" = $2 AND "u"."role" IN ($3, $4)) GROUP BY "u"."id", "u"."username" HAVING (COUNT("p"."id") > $5) ORDER BY "u"."username" ASC',
  values: [ false, 'active', 'admin', 'editor', 5 ]
}
*/
```

---

### 2. INSERT with Upsert (`ON CONFLICT`) & RETURNING
```javascript
const query = Duck
  .insert('users')
  .values([
    { username: 'heit00', email: 'heit@example.com', role: 'admin' },
    { username: 'duck', email: 'duck@example.com', role: 'user' }
  ])
  .onConflict('email')
  .set('role', Duck.raw('EXCLUDED.role'))
  .returning('id', 'username', 'email');

console.log(query.toInstruction());
/*
{
  template: 'INSERT INTO "users" ("username", "email", "role") VALUES ($1, $2, $3), ($4, $5, $6) ON CONFLICT ("email") DO UPDATE SET "role" = EXCLUDED.role RETURNING "id", "username", "email"',
  values: [ 'heit00', 'heit@example.com', 'admin', 'duck', 'duck@example.com', 'user' ]
}
*/
```

---

### 3. UPDATE with FROM Table & Complex Conditions
```javascript
const query = Duck
  .update('products')
  .set('price', Duck.raw('"products"."price" * ?', 1.10))
  .from('categories')
  .where('products.category_id', '=', Duck.column('categories.id'))
  .where('categories.name', '=', 'Electronics')
  .returning('products.id', 'products.price');

console.log(query.toInstruction());
/*
{
  template: 'UPDATE "products" SET "price" = "products"."price" * $1 FROM "categories" WHERE ("products"."category_id" = "categories"."id" AND "categories"."name" = $2) RETURNING "products"."id", "products"."price"',
  values: [ 1.10, 'Electronics' ]
}
*/
```

---

### 4. DELETE with USING & RETURNING
```javascript
const query = Duck
  .delete()
  .from('users')
  .using('banned_users')
  .where('users.id', '=', Duck.column('banned_users.user_id'))
  .returning('*');

console.log(query.toInstruction());
/*
{
  template: 'DELETE FROM "users" USING "banned_users" WHERE ("users"."id" = "banned_users"."user_id") RETURNING *',
  values: []
}
*/
```

---

### 5. Common Table Expressions (WITH / CTE) & CASE Expressions
```javascript
// Conditional Case Expression
const roleRank = Duck.case('user_tier')
  .when(Duck.column('xp'), '>=', 10000, 'Master')
  .when(Duck.column('xp'), '>=', 5000, 'Pro')
  .else('Novice');

// CTE with parameterized Raw query
const topUsers = Duck.raw('(SELECT id FROM users WHERE reputation > ?)', 1000);

const mainQuery = Duck
  .select('username', roleRank)
  .from('top_users')
  .with(topUsers, 'top_users');

console.log(mainQuery.toInstruction());
```

---

## 🧬 ORM Layer (In Active Development)

DuckBuilder's ORM layer builds directly on top of the QueryBuilder to provide type-safe schemas and domain entities:

### Type System (`Type`, `defineType`, `getType`)
```javascript
const { Type, defineType, getType } = require('./lib/orm/schema/typesDefinition/type');

class CustomUuidType extends Type {
  constructor() {
    super('uuid', 'UUID');
  }
  to(val) { return String(val).toLowerCase(); }
  from(val) { return String(val); }
}

defineType(CustomUuidType);

const RetrievedType = getType('CustomUuidType');
const typeInstance = new RetrievedType();
console.log(typeInstance.to('ABC-123')); // 'abc-123'
```

### Schema, Constraints & Relationships
```javascript
const { TableSchema } = require('./lib/orm/schema/elements/table');
const { Column } = require('./lib/orm/schema/elements/column');
const { registerTable, getTables } = require('./lib/orm/schema/internal/tablesRegister');

// Define table schema with fluent columns and constraints
const users = new TableSchema('users');
users.defineColumns(
  Column.id('id').type('int'),
  new Column('username').type('varchar').unique(true),
  new Column('email').type('varchar').nullable(false)
);

// Register table schema in the centralized catalog
registerTable(users);

// Define dependent table with foreign key relationship
const posts = new TableSchema('posts');
posts.defineColumns(
  Column.id('id').type('int'),
  new Column('user_id').type('int').references(users, 'id'),
  new Column('title').type('varchar')
);
registerTable(posts);
```

* **Schema & Columns:** Fluent column definition via [`Column`](./lib/orm/schema/elements/column.js) and table schema management via [`TableSchema`](./lib/orm/schema/elements/table.js).
* **Constraints:** Structural constraints via [`Constraint`](./lib/orm/schema/concepts/constraint.js) (`PRIMARY KEY`, `FOREIGN KEY`, `UNIQUE`, `CHECK`, `NOT NULL`) with automatic naming conventions (`pk_`, `fk_`, `un_`, `nu_`) and automated metadata extraction.
* **Relationships:** Modeling domain relationships via [`Relationship`](./lib/orm/schema/concepts/reference.js) and foreign key references via [`Column.prototype.references`](./lib/orm/schema/elements/column.js).
* **Table Registry:** Centralized in-memory catalog via [`registerTable`](./lib/orm/schema/internal/tablesRegister.js) preventing duplicate table definitions per schema.

---

## 🧪 Test Suite

The project includes an automated unit test suite built with Node.js's native test runner (`node:test`):

```bash
npm test
```

Tests cover:
* Full SQL generation for `SELECT`, `INSERT`, `UPDATE`, and `DELETE`.
* Aggregates, expressions, conditionals (`CASE`), joins, and upserts.
* ORM type registration, serialization (`to`), and deserialization (`from`).
* Table schema metadata, constraints (`PRIMARY KEY`, `NOT NULL`, `UNIQUE`, `FOREIGN KEY`), and catalog registration.

---

## 📄 License

ISC © [heit00](https://github.com/heit00)
