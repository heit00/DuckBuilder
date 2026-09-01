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
- [ ] Implementação da função `getType(name)` para recuperação de tipos pelo Schema.

### Gramática e Relações
- [ ] Criação do `SchemaGrammar` (centralização de termos DDL, tipos de integridade referencial `CASCADE`, `RESTRICT`, etc.).
- [ ] Criação da classe `Relation` (metadados estruturais, chaves estrangeiras, cardinalidades `HAS_ONE`, `HAS_MANY`, `BELONGS_TO`, `MANY_TO_MANY`, `columns` e integridade referencial).

### Definição de Schema & DDL
- [ ] Evolução da classe `Column` (`lib/orm/schema/elements/column.js`) com geração de DDL SQL (`toSQL()`).
- [ ] Criação da classe `TableSchema` / `Table` (definição de tabela, coleção de colunas, chaves primárias, constraints e índices).

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
- [ ] Configuração de suite de testes unitários automatizados (ex: `node:test`).
- [ ] Testes de compilação de SQL para o QueryBuilder.
- [ ] Testes de serialização/deserialização do sistema de tipos do ORM.
