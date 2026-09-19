---
name: update-tests
description: >-
  Orienta e padroniza a criação e atualização de testes automatizados utilizando
  o test runner nativo do Node.js (node:test e node:assert/strict).
  Ative esta skill sempre que novas funcionalidades, métodos de query, cláusulas SQL,
  estruturas léxicas ou elementos do ORM (schemas, tipos, constraints e relações)
  forem adicionados ou modificados no DuckBuilder.
---

# 🧪 Skill: Atualização Contínua de Testes Automatizados

Esta skill define os padrões e procedimentos para criar, atualizar e manter a suíte de testes automatizados do **DuckBuilder**, garantindo que cada nova funcionalidade, correção ou evolução estrutural seja acompanhada por testes rigorosos e confiáveis.

---

## ⚙️ 1. Stack & Padrões Tecnológicos

- **Test Runner Nativo:** Utilizar exclusivamente o módulo embutido do Node.js: `node:test` (`describe`, `it`, `test`, `beforeEach`, `afterEach`).
- **Asserções Estritas:** Utilizar exclusivamente `node:assert/strict` (`assert.strictEqual`, `assert.deepStrictEqual`, `assert.throws`, `assert.ok`).
- **Zero Dependências:** Não adicionar Jest, Mocha, Chai, Vitest ou qualquer pacote externo de testes.
- **Comando de Execução:** `npm test` (configurado como `node --test` no [package.json](file:///C:/Users/User/Documents/duck/package.json)).

---

## 📁 2. Organização da Suíte de Testes

Os testes residem obrigatoriamente no diretório `test/`, espelhando a arquitetura de `lib/`:

```text
test/
├── queryBuilder.test.js    # Testes das instruções DML/DQL, cláusulas e compilação SQL
└── orm.test.js             # Testes do sistema de tipos, schemas, constraints e catálogo
```

### `test/queryBuilder.test.js`:
- Statements: `Select`, `Insert`, `Update`, `Delete`.
- Cláusulas: `WhereClause`, `JoinClause`, `OrderBy`, `CaseClause`, `WithClause`, `OnConflict`, `SetStructure`.
- Estruturas léxicas: `Column`, `Table`, `Raw`, `Bind`, `NASQLFunction` (`Count`, `Sum`, `Avg`, `Min`, `Max`, `Coalesce`).
- Compilação parametrizada para PostgreSQL: Verificação exata da saída de `.toInstruction()`:
  - `template`: SQL com identificadores citados (`"tabela"."coluna"`) e placeholders (`$1, $2, ...`).
  - `values`: Array exato de valores vinculados na ordem dos índices.

### `test/orm.test.js`:
- Tipos (`Type`, `defineType`, `getType`):
  - Conversões bidirecionais: `.to()` (JS $\rightarrow$ DB) e `.from()` (DB $\rightarrow$ JS).
  - Tipos padrão (`Integer`, `VarChar`, `JsonType`).
  - Lançamento de erros em valores incompatíveis.
- Elementos de Schema:
  - `Column`: Criação fluente, flags (`primary`, `autoIncrement`, `nullable`, `unique`, `length`), factory `Column.id()`.
  - `TableSchema`: Registro de colunas, autogeração de constraints primárias e relacionamentos.
  - `Constraint` & `Relationship`: Prefixos (`pk_`, `fk_`, `un_`, `nu_`, `ch_`), integridade referencial.
  - `tablesRegister`: Registro único em memória, prevenção de duplicatas e catálogo global.

---

## 📐 3. Estrutura de um Caso de Teste (Exemplo Canônico)

```javascript
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const { Duck } = require('../index');
const { Column } = require('../lib/queryBuilder/lexicalStructures/column');

describe('QueryBuilder: Update Statement', () => {
  it('deve gerar instrução UPDATE parametrizada com WHERE', () => {
    const query = Duck.update('users')
      .set('status', 'inactive')
      .where('last_login', '<', '2026-01-01');

    const instruction = query.toInstruction();

    assert.deepStrictEqual(instruction, {
      template: 'UPDATE "users" SET "status" = $1 WHERE ("last_login" < $2)',
      values: ['inactive', '2026-01-01']
    });
  });

  it('deve lançar TypeError quando a tabela fornecida for inválida', () => {
    assert.throws(
      () => Duck.update(12345),
      {
        name: 'QuerySyntaxError' // ou o erro semântico correspondente
      }
    );
  });
});
```

---

## 🔍 4. Cobertura Obrigatória para Novas Funcionalidades

Sempre que uma nova funcionalidade for desenvolvida, adicione testes cobrindo os seguintes cenários:

1. **Happy Path (Caminho Feliz):**
   - Execução com parâmetros ideais e validação minuciosa do retorno.
2. **Erros Semânticos e Validações:**
   - Validar que o código lança exceções nativas semânticas corretas:
     - `TypeError` para argumentos de tipo incompatível.
     - `RangeError` para valores numéricos fora dos limites.
     - `ReferenceError` para chaves, colunas ou tipos inexistentes.
   - Usar `assert.throws(fn, { name: 'TypeError' })`.
3. **Casos de Borda (Edge Cases):**
   - Passagem de `null`, `undefined` e strings vazias `''`.
   - Múltiplos parâmetros variádicos.
   - Ordem correta de índices na parametrização `$1, $2, ...` em queries complexas com subconsultas.
4. **Imutabilidade e Não-Poluição de Estado:**
   - Garantir que a execução de um teste não afete instâncias em outros testes (especialmente coleções de registro como `tablesRegister`).

---

## 🔄 5. Fluxo de Trabalho Integrado

1. **Identificar Alterações:** Analisar quais arquivos e métodos em `lib/` foram criados ou alterados.
2. **Escrever os Testes:** Adicionar novos blocos `describe()` / `it()` no arquivo de teste adequado (`test/*.test.js`).
3. **Executar a Suíte:** Rodar `npm test` no terminal para verificar se os novos testes (e os existentes) passam com sucesso:
   ```bash
   node --test
   ```
4. **Sincronizar Tarefa:** Atualizar o [WORKS.md](file:///C:/Users/User/Documents/duck/.agents/WORKS.md), marcando a tarefa correspondente como `[x]`.
