# 🦆 DuckBuilder
### *The Modular Query Builder & ORM for PostgreSQL*

**DuckBuilder** is a high-performance, modular query builder and emerging ORM engineered specifically for **PostgreSQL** in modern JavaScript (Node.js). It integrates seamlessly with industry-standard drivers like `pg` (node-postgres), providing a fluent, parameterized, and secure interface for database operations.

---

## ✨ Key Features

* 🛡️ **PostgreSQL-First & Safe by Default:** Native `$1, $2, ...` parameter binding via `TemplateCount` to prevent SQL injection, with automatic identifier quoting (`"table"."column"`).
* 🌳 **AST & Symbol-Based Architecture:** Uses internal symbol-based typing (`Symbol.for`) and AST-like nodes for robust, composable queries.
* ⚡ **Full DML & DQL Support:** Comprehensive `SELECT`, `INSERT` (with Upsert / `ON CONFLICT`), `UPDATE` (with `FROM`), and `DELETE` (with `USING`) builders.
* 🧩 **Advanced SQL Constructs:** Native support for Common Table Expressions (`WITH`), Subqueries, `CASE ... WHEN`, `WHERE EXISTS`, `WHERE IN`, `BETWEEN`, Window/Aggregate functions, and Raw SQL fragments (`?` binding).
* 🧬 **Extensible ORM Layer:** Clean, object-oriented schema definitions, extensible type casting system (`Type`, `defineType`), and structural relationship modeling (`Relation`).

---

## 🏗️ Architecture & Modules

```
duck/
├── index.js                     # Facade entry point ({ Duck })
├── lib/
│   ├── index.js                 # Main Query class & static factories
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
│           └── typesDefinition/ # Base Type, defineType, Primitive/Default types
└── .agents/                     # Project guidelines (CONTEXT.md) and task tracker (WORKS.md)
```

---

## 🦆 Query Builder Examples

### 1. SELECT with Joins, Aggregates and Filtering
```javascript
const { Duck } = require('./index');

const query = new Duck()
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
const query = new Duck()
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
const query = new Duck()
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

### 4. Common Table Expressions (WITH / CTE) & CASE Expressions
```javascript
// Define a CTE subquery
const topUsers = new Duck()
  .select('id')
  .from('users')
  .where('reputation', '>', 1000);

// Conditional Case Expression
const roleRank = Duck.case('user_tier')
  .when(Duck.column('xp'), '>=', 10000, 'Master')
  .when(Duck.column('xp'), '>=', 5000, 'Pro')
  .else('Novice');

const mainQuery = new Duck()
  .with(topUsers, 'top_users')
  .select('username', roleRank)
  .from('top_users')
  .join('profiles', 'profiles.user_id', '=', Duck.column('top_users.id'));

console.log(mainQuery.toInstruction());
```

---

## 🧬 ORM Layer (In Active Development)

DuckBuilder's ORM layer builds directly on top of the QueryBuilder to provide type-safe schemas and domain entities:

### Type System (`Type` & `defineType`)
```javascript
const { Type, defineType } = require('./lib/orm/schema/typesDefinition/type');

class CustomUuidType extends Type {
  constructor() {
    super('uuid', 'UUID');
  }
  to(val) { return String(val).toLowerCase(); }
  from(val) { return String(val); }
}

defineType(CustomUuidType);
```

### Schema, Constraints & Relationships
* **Schema & Columns:** Fluent column definition via [`Column`](./lib/orm/schema/elements/column.js) and table schema management via [`TableSchema`](./lib/orm/schema/elements/table.js).
* **Constraints:** Structural constraints via [`Constraint`](./lib/orm/schema/concepts/constraint.js) (`PRIMARY KEY`, `FOREIGN KEY`, `UNIQUE`, `CHECK`, `NOT NULL`) with automated metadata extraction.
* **Relationships:** Modeling domain relationships via [`Relationship`](./lib/orm/schema/concepts/reference.js) (`1-1`, `1-N`, `N-1`, `N-N`) and [`Reference`](./lib/orm/schema/concepts/reference.js) with composite foreign key mappings (`{ origin_col: target_col }`).

---

## 📄 License

ISC © [heit00](https://github.com/heit00)
