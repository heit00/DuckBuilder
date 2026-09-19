# 🦆 DuckBuilder — WORKS & Roadmap

Arquivo de controle de tarefas do projeto. Todas as novas funcionalidades, melhorias e refatorações devem ser registradas aqui.

---

## 📌 Legenda de Status
- `[x]` **Concluído**
- `[/]` **Em Progresso**
- `[ ]` **Pendente**

---

## 🛠️ Camada ORM (`lib/orm`)

### Sistema de Tipos (Types Definition)
- [x] Estrutura base de tipos para testes do ORM (`Type`, `defineType`, `TYPES` registry).
- [x] Implementação dos primeiros tipos padrão (`Integer`, `VarChar`, `JsonType` em `default.js`).
- [ ] Implementação de novos tipos primitivos (`Boolean`, `BigInt`, `Timestamp`, `Decimal`, `UUID`).
- [x] Implementação da função `getType(name)` para recuperação de tipos pelo Schema.

### Gramática, Restrições e Relações
- [x] Criação do `SchemaGrammar` (`lib/orm/schema/grammar/schemaGrammar.js`) com centralização de termos DDL, ações (`CASCADE`, `RESTRICT`) e tipos de constraints.
- [x] Criação da classe `Constraint` (`lib/orm/schema/concepts/constraint.js`) com suporte a `PRIMARY KEY`, `FOREIGN KEY`, `UNIQUE`, `CHECK`, `NOT NULL`, prefixos padronizados (`pk`, `fk`, `un`, `nu`, `ch`) e integridade referencial.
- [x] Modelagem de relações com `Relationship` e `Reference` (`lib/orm/schema/concepts/reference.js`), com suporte a cardinalidades (`1-1`, `1-N`, `N-1`, `N-N`), prefixo `fk` e mapeamento composto `{ colOrigem: colDestino }`.

### Definição de Schema & DDL
- [x] Identificação e verificação de nós de schema via símbolos (`lib/orm/schema/symbol-lockup/symbols.js`) com `ELEMENT_VALUE_TYPE`, `isTable` e `isColumn`.
- [x] Registro e catálogo de tabelas em memória (`lib/orm/schema/internal/tablesRegister.js`) com funções `registerTable` e `getTables`, validação de instâncias e prevenção de duplicatas (`schema.tabela`).
- [x] Estrutura da classe `TableSchema` (`lib/orm/schema/elements/table.js`) com coleções em `Map` (`columns`, `constraints`, `relations`), metadados automáticos em `#updateMetaData` com suporte a schema e métodos de relacionamento (`manyToOneRelation`, `manyToManyRelation`).
- [x] Função de relacionamento N-N (`lib/orm/schema/internal/manyToManyRelation.js`) gerando tabela intermediária/pivot automaticamente com inferência de tipos das colunas e amarração bidirecional N-1.
- [/] Evolução da classe `Column` (`lib/orm/schema/elements/column.js`) com especificação fluente de atributos (tipo, tamanho, precisão, nulabilidade, defaults); pendente integração completa e geração de DDL SQL (`toSQL()`).
- [ ] Compilação DDL: Geração de SQL DDL (`toSQL()` / `SchemaCompiler`) para `Column`, `Constraint` e `TableSchema` (`CREATE TABLE`, `ALTER TABLE`, etc.).

### Entidades e Hydration
- [ ] Criação da classe base `Model` / `Entity` (Active Record / Data Mapper básico).
- [ ] Mapeamento e hidratação de resultados do banco (`pg`) para instâncias de Model aplicando `Type.from()`.
- [ ] Mapeamento e persistência aplicando `Type.to()`.

---

## 🏗️ Camada QueryBuilder (`lib/queryBuilder`)

- [x] Estruturas Léxicas (`Column`, `Table`, `Bind`, `Raw`, `Expression`, `InExpression`, `Between`, `Exists`, `NASQLFunction`).
- [x] Estruturas de Cláusulas (`WhereClause`, `JoinClause`, `CaseClause`, `WithClause`, `SetStructure`, `InsertStructure`, `OrderBy`, `OnConflict`).
- [x] Statements principais (`Select`, `Insert`, `Update`, `Delete`).
- [x] Compilação parametrizada para PostgreSQL (`TemplateCount` $\rightarrow$ `$1, $2, ...`).
- [ ] **Refatoração:** Criar classe base / traits para os 4 Statements reduzindo repetição de código (`where`, `with`, `returning`, etc.).

---

## 🧪 Testes & Qualidade
- [x] Configuração de suite de testes unitários automatizados (ex: `node:test`).
- [x] Testes de compilação de SQL para o QueryBuilder (`test/queryBuilder.test.js`).
- [x] Testes de serialização/deserialização do sistema de tipos do ORM (`test/orm.test.js`).

---

## 🐛 Débitos Técnicos & Ajustes Identificados

### QueryBuilder
- [ ] **Símbolos e Subqueries (`symbols.js` / `Select` / `Query`):** `isQuery()` valida `[QUERY_VALUE_TYPE] === QT.query`, mas instâncias de `Select` possuem apenas `[QUERY_SPECIFIC_VALUE_TYPE] = QT.select`. Isso impede a passagem direta de instâncias de `Select` para `with()`, `whereExists()` e subqueries em `from()`. Necessário alinhar a tipagem por símbolo ou implementar a herança de uma classe base comum `Query`.
- [ ] **Assinatura de `Duck.coalesce` (`lib/index.js`):** A factory estática `coalesce(args, alias)` interpreta o segundo argumento como alias, quebrando chamadas convencionais de múltiplos argumentos como `Duck.coalesce('a', 'b')`. Ajustar para aceitar múltiplos argumentos variádicos (`...args`).

### ORM (Schema)
- [ ] **Correção em `TableSchema.prototype.manyToOneRelation` (`lib/orm/schema/elements/table.js`):**
  1. `Constraint.PREFIX.foreign` está indefinido na classe `Constraint` (o prefixo `fk` foi declarado apenas em `Relationship.PREFIX.foreign`).
  2. A checagem `if (this.constraints.has(cName))` ocorre *após* a inserção `this.constraints.set(cName, constraint)`, fazendo com que qualquer invocação lance `Error: constraint ... already registered`. Mover a checagem para antes da inserção.
- [ ] **Cascata em `TableSchema.prototype.manyToManyRelation` (`lib/orm/schema/internal/manyToManyRelation.js`):** Atualmente falha devido ao erro no `manyToOneRelation` da tabela pivot.
- [ ] **Assinatura de `TableSchema.prototype.defineColumns`:** Atualmente aceita apenas lista de instâncias ou array `(col1, col2)` / `([col1, col2])`. Avaliar suporte a dicionário chave-valor `{ colName: columnInstance }`.
