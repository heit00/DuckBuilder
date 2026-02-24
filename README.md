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

## 💡 Why DuckBuilder?
Unlike generic query builders that attempt to abstract multiple database dialects, DuckBuilder is **PostgreSQL-first**. This focus ensures that specific driver optimizations and native PostgreSQL features are utilized without the overhead of unnecessary abstractions.

> **Note:** Optimized for the `pg` driver to ensure secure parameter binding and prevention of SQL injection.

---

*Documentation generated for the DuckBuilder Project.*
