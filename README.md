# 🦆 DuckBuilder
### *The Scalable Query Builder for PostgreSQL*

**DuckBuilder** is a high-performance, scalable query builder specifically engineered for **PostgreSQL** drivers. It is designed to integrate seamlessly with standard industry drivers, most notably JavaScript's `pg` (node-postgres), providing a fluent and type-safe interface for database interactions.

---

## 🏗️ Supported Lexical & Clause Structures
The architecture of DuckBuilder mirrors the native logic of SQL, allowing for the construction of complex queries through a modular and readable syntax.

### Available Clauses:
* **Data Retrieval:** `SELECT`, `FROM`, `SUBQUERY`, `CTE`
* **Data Removal:** `DELETE`
* **Logic & Filtering:** `WHERE`, `HAVING`, `CASE`, `USING`
* **Joins:** `JOIN` (Multiple types supported)
* **Organization & Pagination:** `GROUP BY`, `ORDER BY`, `LIMIT`, `OFFSET`

---

## 🛠️ Development Roadmap
We are committed to making DuckBuilder the most comprehensive tool for PostgreSQL developers. The following features are currently being prioritized:

### 🔄 DML Operations (Under Development)
* `UPDATE`: Advanced record modification support.
* `INSERT`: Robust data insertion capabilities.

### 🧪 Advanced Utilities (Coming Soon)
* `RAW`: Support for raw SQL strings when direct control is required.
* `FUNCTIONS`: Native support for PostgreSQL-specific functions and procedures.

---

## 🦆 Usage Examples

DuckBuilder uses a fluent interface to build complex queries programmatically. All generated queries are automatically parameterized to ensure safety against SQL Injection.

Here is a complete script demonstrating three real-world scenarios: basic queries, advanced joins with relationships, and complex conditional logic.

```javascript
const { Duck } = require('./lib/index');

// =========================================================
// 1. Basic Queries (Select, Where, In, Order By)
// =========================================================
// Fetching active users who are administrators or moderators
const query1 = new Duck()
    .select('id', 'username', 'email')
    .from('users') 
    .where('status', '=', 'active')
    .whereIn('role', ['admin', 'moderator'])
    .orderBy(Duck.order('substituto', 'asc'));

console.log('=== User List ===');
console.log(query1.toInstruction());


// =========================================================
// 2. Relationships and Advanced Filters (Joins & Between)
// =========================================================
// Building reports by joining tables and resolving columns automatically
const query2 = new Duck()
    .select(
        Duck.column('o.id'),
        Duck.column('c.name', 'cliente_nome'),
        Duck.column('o.total')
    )
    .from('orders')
    .join(Duck.table('customers', 'c'), join => {
        join.on('o.customer_id', '=', Duck.column('c.id'))
            .on('c.is_banned', '=', false); 
    })
    .whereBetween('o.created_at', ['2025-01-01', '2025-12-31'])
    .where('o.total', '>', 500.00);

console.log('=== Sales Report ===');
console.log(query2.toInstruction());


// =========================================================
// 3. Complex Conditional Logic (Case When)
// =========================================================
// Building a rule engine using CASE WHEN to fetch dynamic data
const rankCase = Duck.case()
    .when(Duck.column('xp'), 10000, 'Gold')
    .when(Duck.column('xp'), 5000, 'Silver')
    .else('Bronze');

// Injecting the rule into the Query
const query3 = new Duck()
    .select('players') 
    .from('rank')
    .where('guild_id', '=', rankCase)
    .where('status', '=', 'active');

console.log('=== Rank Update ===');
console.log(query3.toInstruction());
```

=== User List ===
{
  template: 'SELECT "id", "username", "email" FROM "users" WHERE ("status" = $1 AND "role" IN ($2, $3)) ORDER BY "substituto" ASC',
  values: [ 'active', 'admin', 'moderator' ]
}
=== Sales Report ===
{
  template: 'SELECT "o"."id", "c"."name" AS "cliente_nome", "o"."total" FROM "orders" INNER JOIN "customers" ON ("o"."customer_id" = "c"."id" AND "c"."is_banned" = $1) WHERE ("o"."created_at" BETWEEN $2 AND $3 AND "o"."total" > $4)',
  values: [ false, '2025-01-01', '2025-12-31', 500 ]
}
=== Rank Update ===
{
  template: 'SELECT "players" FROM "rank" WHERE ("guild_id" = (CASE WHEN ("xp" = $1) THEN $2 WHEN ("xp" = $3) THEN $4 ELSE $5 END) AND "status" = $6)',
  values: [ 10000, 'Gold', 5000, 'Silver', 'Bronze', 'active' ]
}

---

## 💡 Why DuckBuilder?
Unlike generic query builders that attempt to abstract multiple database dialects, DuckBuilder is **PostgreSQL-first**. This focus ensures that specific driver optimizations and native PostgreSQL features are utilized without the overhead of unnecessary abstractions.

> **Note:** Optimized for the `pg` driver to ensure secure parameter binding and prevention of SQL injection.

---

*Documentation generated for the DuckBuilder Project.*
