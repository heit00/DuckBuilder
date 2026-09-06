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

### Gramática, Restrições e Relações
- [x] Criação do `SchemaGrammar` (`lib/orm/schema/grammar/schemaGrammar.js`) com centralização de termos DDL, ações (`CASCADE`, `RESTRICT`) e tipos de constraints.
- [x] Criação da classe `Constraint` (`lib/orm/schema/concepts/constraint.js`) com suporte a `PRIMARY KEY`, `FOREIGN KEY`, `UNIQUE`, `CHECK`, `NOT NULL`, prefixos padronizados e integridade referencial.
- [x] Modelagem de relações com `Relationship` e `Reference` (`lib/orm/schema/concepts/reference.js`), com suporte a cardinalidades (`1-1`, `1-N`, `N-1`, `N-N`) e referências compostas `{ colOrigem: colDestino }`.

### Definição de Schema & DDL
- [/] Evolução da classe `Column` (`lib/orm/schema/elements/column.js`) com especificação de atributos (tipo, tamanho, precisão, nulabilidade, defaults); pendente geração de DDL SQL (`toSQL()`).
- [/] Criação da classe `TableSchema` (`lib/orm/schema/elements/table.js`) com coleções estruturadas em `Map` (`columns`, `constraints`, `relations`), sincronização em `#updateMetaData` e métodos de relações (`manyToOneRelation`, `manyToManyRelation`).

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
