---
name: safe-refactoring
description: >-
  Guia refatorações de código estritamente seguras e incrementais no DuckBuilder,
  garantindo que o comportamento observável e a lógica de negócio permaneçam inalterados.
  Proíbe mudanças drásticas sem autorização expressa do usuário.
  Ative esta skill quando for solicitada refatoração, limpeza de código, encapsulamento
  com campos privados (#), eliminação de código duplicado (DRY) ou substituição de magic strings.
---

# 🛡️ Skill: Refatoração Segura & Não Disruptiva

Esta skill estabelece diretrizes rigorosas para refatoração de código no **DuckBuilder**. O objetivo primordial é melhorar a manutenibilidade, legibilidade e elegância do código sem introduzir regressões, mantendo rigorosamente a lógica original e sempre solicitando consentimento prévio para mudanças estruturais relevantes.

---

## 🛑 1. A Regra de Ouro: Preservação Estrita do Comportamento

> [!IMPORTANT]
> **Refatorar é alterar a estrutura interna do código SEM alterar o seu comportamento observável externo.**
> - Nenhuma refatoração pode alterar o SQL gerado (`template`), a ordem dos parâmetros (`values`), as assinaturas de métodos públicos ou o retorno de funções existentes.
> - **Mudanças de lógica ou alterações drásticas SEM permissão são expressamente proibidas.**

---

## 🔒 2. Protocolo Obrigatório de Consentimento

Conforme estipulado nas diretrizes do projeto ([CONTEXT.md](file:///C:/Users/User/Documents/duck/.agents/CONTEXT.md)), o agente atua como pair programmer consultivo e mentor, nunca alterando unilateralmente a arquitetura existente.

### Casos em que a Permissão Prévia é OBRIGATÓRIA:
- Criar classes base abstratas ou herança compartilhada (ex: classe base comum para `Select`, `Insert`, `Update`, `Delete`).
- Alterar assinaturas de métodos públicos ou factories estáticas de `Duck` / `Query`.
- Modificar o fluxo de controle de compilação de instruções SQL.
- Alterar manipulação de símbolos AST internos (`symbols.js`).
- Deletar arquivos ou renomear módulos existentes.

### Como Solicitar a Permissão:
Antes de aplicar qualquer modificação que se enquadre nos casos acima, apresente ao usuário:
1. **Motivação:** Qual ganho técnico justifica a alteração (ex: redução de 80 linhas duplicadas, conformidade com AST).
2. **Escopo:** Arquivos e linhas específicas a serem tocadas.
3. **Comparativo Antes vs Depois:** Trecho conciso ilustrando a mudança.
4. **Análise de Risco:** Confirmação de que a suíte de testes (`npm test`) continuará verde.
5. **Pedido Claro de Confirmação:** Aguardar a autorização explícita do usuário antes de tocar no arquivo.

---

## 🧹 3. Escopo de Refatorações Seguras Permitidas

Quando o usuário autorizar ou solicitar refatoração, priorize intervenções seguras e atômicas:

### A. Encapsulamento Moderno (ES6+)
- Migrar propriedades internas expostas acidentalmente para campos verdadeiramente privados com `#` (`#where`, `#fromTables`).
- Proteger coleções internas contra mutações externas indevidas.

### B. Eliminação de "Magic Strings"
- Substituir strings literais repetidas por constantes centralizadas em `QueryGrammar` ou `SchemaGrammar`:
  ```javascript
  // ❌ Antes:
  if (action === 'CASCADE') ...
  
  // ✅ Depois:
  if (action === SchemaGrammar.OnAction.cascade) ...
  ```

### C. Padronização de Erros Semânticos Nativos
- Substituir lançamentos genéricos de `Error` pelo erro semântico nativo adequado:
  - `TypeError`: Parâmetro com tipo inválido.
  - `RangeError`: Valor numérico ou índice fora da faixa permitida.
  - `ReferenceError`: Tipo, tabela ou coluna não encontrada no catálogo.

### D. Redução de Duplicação Local (DRY Seguro)
- Extrair métodos utilitários privados na própria classe para evitar repetição mecânica de blocos de validação.

---

## 🔄 4. Ciclo de Refatoração: Red-Green-Refactor-Verify

Toda refatoração deve seguir rigorosamente as quatro etapas abaixo:

```text
1. Linha de Base  ──▶  2. Refatoração Atômica  ──▶  3. Verificação  ──▶  4. Confirmação
   (npm test)             (1 arquivo / 1 método)        (npm test)           (WORKS.md)
```

1. **Linha de Base:** Execute `npm test` antes de qualquer alteração. Todos os testes existentes **devem** passar. Se houver testes falhando previamente, resolva a quebra antes de iniciar a refatoração.
2. **Alteração Atômica:** Faça alterações pequenas e focadas em uma única classe ou método por vez. Não misture refatoração de múltiplos módulos em uma única etapa.
3. **Verificação Imediata:** Execute `npm test` logo após a alteração. O resultado deve permanecer 100% verde e idêntico ao anterior.
4. **Reversão Rápida:** Se qualquer teste falhar ou o comportamento mudar sutilmente, reverta a alteração imediatamente em vez de aplicar correções cumulativas em cascata.

---

## 📋 5. Checklist de Conclusão da Refatoração
- [ ] Os testes automatizados (`npm test`) continuam passando integralmente?
- [ ] A saída das queries geradas (`template` e `values`) permaneceu exatamente a mesma?
- [ ] Nenhuma assinatura de método público foi alterada sem permissão?
- [ ] Comentários explicativos e docstrings relevantes foram preservados?
- [ ] O quadro de tarefas ([WORKS.md](file:///C:/Users/User/Documents/duck/.agents/WORKS.md)) foi atualizado se houver débitos resolvidos?
