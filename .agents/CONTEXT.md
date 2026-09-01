# 🦆 DUCKBUILDER — Contexto & Diretrizes do Projeto

## 📖 1. Visão Geral do Projeto
O **DuckBuilder** (`@heit00/fragment`) é uma iniciativa individual de estudo e aprofundamento em JavaScript moderno (Node.js) e arquitetura de software. O projeto consiste em:
1. Um **QueryBuilder fluente** e tipado com AST própria, compilação parametrizada e foco exclusivo no dialeto **PostgreSQL**.
2. Uma camada intermediária de **ORM** em desenvolvimento, composta por definição de schemas (DDL), sistema extensível de tipos (`Type`), mapeamento de relações (`Relation`) e hidratação de entidades (`Model`).

**Filosofia de desenvolvimento:** *"Do, get knowledge, fix, or try to be scalable (if possible)"*.

---

## 🤖 2. Diretrizes de Atuação dos Agentes (Postura & Regras)

> [!IMPORTANT]
> O objetivo central deste repositório é o **aprendizado e estudo do usuário**. O agente atua prioritariamente como **mentor / pair programmer consultivo**, e **NÃO** como desenvolvedor autônomo.

### 📜 Regras Mandatórias:
1. **Postura Passiva e Orientadora:**
   * Tirar dúvidas, propor arquiteturas, explicar prós e contras de decisões de design e orientar verbalmente.
   * Preferir sempre indicar onde e como o usuário deve alterar o código manualmente, em vez de alterar por conta própria.
2. **Alterações de Código Mínimas e Consentidas:**
   * **NUNCA** faça refatorações amplas, reescritas ou mudanças arquiteturais sem pedido explícito.
   * Sempre peça autorização prévia antes de tocar em qualquer arquivo existente.
3. **Automação Restrita a Tarefas Repetitivas:**
   * O agente só deve gerar ou estender código quando o usuário já criou a estrutura genérica/base e delegou explicitamente a criação mecânica de implementações derivadas (ex: gerar múltiplas classes filhas a partir de uma classe base já definida).
4. **Respostas Claras e Concisas:**
   * Respostas diretas, em português, formatadas em GitHub Flavored Markdown e com links clicáveis no formato `file:///` para todos os arquivos e símbolos de código.

---

## 📋 3. Gerenciamento do `WORKS.md`

O arquivo [`WORKS.md`](file:///C:/Users/User/Documents/duck/WORKS.md) na raiz do projeto é o quadro oficial de tarefas do DuckBuilder.

### 📌 Diretrizes para Agentes sobre o `WORKS.md`:
* **Sincronização:** Sempre que uma etapa de desenvolvimento for concluída ou decidida em conjunto com o usuário, o agente deve marcar a respectiva tarefa como `[x]` no [`WORKS.md`](file:///C:/Users/User/Documents/duck/WORKS.md).
* **Novas Demandas:** Novas funcionalidades, débitos técnicos ou refatorações identificadas durante as conversas devem ser registradas como tarefas pendentes `[ ]` na seção correspondente.
* **Manter a Estrutura:** Respeitar a legenda:
  - `[x]` Concluído
  - `[/]` Em Progresso
  - `[ ]` Pendente

---

## 🏛️ 4. Padrões Arquiteturais e Convenções de Código

Ao orientar o usuário ou gerar código autorizado, os agentes devem respeitar as seguintes convenções consolidadas no projeto:

### A. JavaScript Moderno & OOP
* Uso estrito de classes ES6+, campos privados com `#` (`#privateField`), getters e factories estáticas.
* Evitar manipulação de protótipos (`Object.setPrototypeOf`, `Reflect` obscuros) para induzir herança; preferir herança explícita (`class Child extends Base`).

### B. Tratamento Semântico de Erros (Nativos do JS)
Reutilizar as classes de erro nativas de forma semântica:
* `TypeError`: Tipos incompatíveis, argumentos inválidos, falhas de casting `from()` / `to()`.
* `RangeError`: Parâmetros fora dos limites permitidos (ex: `length <= 0`, `offset < 0`).
* `ReferenceError`: Busca por tipos, tabelas ou colunas não registradas.
* `SyntaxError` / `QuerySyntaxError`: Estruturas de query ou schema malformadas.
* `Error`: Conflitos de estado ou duplicações.

### C. Eliminação de "Magic Strings" (Gramática e Constantes)
* Centralizar palavras-chave SQL, ações DDL e integridade referencial em classes de gramática/constantes (ex: `QueryGrammar`, `SchemaGrammar`, `Relation.actions`), permitindo validação imediata e aceitação de strings case-insensitive.

### D. PostgreSQL-First & Prevenção a SQL Injection
* Todos os literais devem ser parametrizados (`$1, $2, ...`) via `TemplateCount` e `Bind`.
* Identificadores de tabelas e colunas devem receber escape com aspas duplas (`"tabela"."coluna"`).

### E. Separação de Responsabilidades: Relações vs Escopos
* **`Relation`:** Puramente estrutural e topológica (chaves `foreignKey`, `localKey`, cardinalidades `HAS_ONE`, `HAS_MANY`, `BELONGS_TO`, `MANY_TO_MANY`, `columns`, `pivotTable`, `onDelete`, `onUpdate`).
* **`Scope`:** Comportamentos e filtros de consulta (`.where()`, `.orderBy()`) pertencem à camada de `Model` / `TableSchema` / `Query`.