---
name: update-docs
description: >-
  Gerencia e sincroniza a documentação Markdown (.md) do projeto DuckBuilder,
  incluindo .agents/CONTEXT.md (filosofias, diretrizes e convenções arquiteturais),
  .agents/WORKS.md (quadro de tarefas, status [x]/[/]/[ ] e débitos técnicos) e README.md.
  Ative esta skill sempre que o usuário alterar uma filosofia de projeto, concluir ou iniciar
  uma tarefa, relatar débitos técnicos ou modificar contratos públicos da API.
---

# 📝 Skill: Atualização e Sincronização de Documentação (.md)

Esta skill orienta o agente na manutenção contínua e rigorosa de toda a documentação em formato Markdown do repositório **DuckBuilder**, garantindo que as diretrizes arquiteturais, o quadro de tarefas e a documentação pública permaneçam sempre em perfeito alinhamento com o código-fonte.

---

## 🎯 1. Princípios Gerais

1. **Documentação Viva:** Qualquer evolução de código, mudança de filosofia ou resolução de tarefa deve ser refletida imediatamente nos arquivos `.md` correspondentes.
2. **Links Clicáveis Padronizados:** Todos os links para arquivos e símbolos de código devem utilizar o esquema `file:///` com barras normais (ex: `[TableSchema](file:///C:/Users/User/Documents/duck/lib/orm/schema/elements/table.js)`).
3. **Preservação de Contexto:** Nunca apague seções históricas ou diretrizes consolidadas sem solicitação explícita do usuário. Edições devem ser cirúrgicas e contextuais.
4. **Formatação GFM:** Utilize alertas GitHub Flavored Markdown (`> [!IMPORTANT]`, `> [!NOTE]`, `> [!TIP]`, `> [!WARNING]`) para destacar restrições críticas.

---

## 🧭 2. Atualização de Filosofias e Diretrizes (`.agents/CONTEXT.md`)

O arquivo [CONTEXT.md](file:///C:/Users/User/Documents/duck/.agents/CONTEXT.md) estabelece a identidade, a filosofia de engenharia e as regras de convivência do par de programação.

### Quando Atualizar:
- O usuário alterou ou refinou a filosofia central (ex: mudanças no lema *"Do, get knowledge, fix, or try to be scalable"*).
- Nova diretriz de atuação para o agente (ex: ajustes na autonomia, mudanças na política de refatoração, formato de respostas).
- Consolidação de novas convenções arquiteturais (ex: novos padrões de símbolos AST, novas classes de erros semânticos, estratégias de escape/parametrização PostgreSQL).

### Como Estruturar as Mudanças:
- **Seção 1 (Visão Geral):** Escopo técnico, dialeto alvo (PostgreSQL) e mantra/filosofia do desenvolvedor.
- **Seção 2 (Diretrizes de Atuação dos Agentes):** Regras mandatárias de postura (passiva/orientadora), limites de modificação de arquivos e política de autorização prévia.
- **Seção 3 (Gerenciamento do WORKS.md):** Regras de ciclo de vida das tarefas.
- **Seção 4 (Padrões Arquiteturais e Convenções de Código):**
  - Convenções ES6+ (campos privados `#`, classes puras, eliminação de manipulações obscuras de protótipo).
  - Tratamento Semântico de Erros nativos (`TypeError`, `RangeError`, `ReferenceError`, `QuerySyntaxError`).
  - Eliminação de "Magic Strings" através de gramáticas (`QueryGrammar`, `SchemaGrammar`).
  - Prevenção de SQL Injection (parametrização `$1, $2` via `TemplateCount` e quoting de identificadores com aspas duplas).

---

## 📋 3. Atualização de Tarefas e Roadmap (`.agents/WORKS.md`)

O arquivo [WORKS.md](file:///C:/Users/User/Documents/duck/.agents/WORKS.md) é a fonte canônica do progresso do DuckBuilder.

### Legenda de Status Obrigatória:
- `- [x]` **Concluído:** A funcionalidade ou correção foi totalmente implementada e validada por suíte de testes automatizados.
- `- [/]` **Em Progresso:** A tarefa está sendo ativamente desenvolvida no momento.
- `- [ ]` **Pendente:** Tarefa futura ou débito técnico identificado aguardando implementação.

### Procedimento Passo a Passo:
1. **Marcar Conclusão:**
   - Ao finalizar a implementação e confirmar a execução bem-sucedida dos testes (`npm test`), localize a linha exata no `WORKS.md` e altere `- [ ]` ou `- [/]` para `- [x]`.
2. **Registrar Novas Demandas / Débitos Técnicos:**
   - Se durante o desenvolvimento ou revisão for identificado um bug, anomalia de símbolo, erro de assinatura ou oportunidade de melhoria:
     - Adicione uma entrada em `## 🐛 Débitos Técnicos & Ajustes Identificados` sob a subseção adequada (`QueryBuilder`, `ORM`, `Testes`).
     - Descreva com precisão: o arquivo afetado, o sintoma/erro gerado e a solução planejada.
3. **Manter a Hierarquia:**
   - Novas tarefas devem respeitar os módulos:
     - `Camada ORM (lib/orm)`
     - `Camada QueryBuilder (lib/queryBuilder)`
     - `Testes & Qualidade`
     - `Débitos Técnicos & Ajustes Identificados`

---

## 📖 4. Atualização da Documentação Pública (`README.md`)

O arquivo [README.md](file:///C:/Users/User/Documents/duck/README.md) é a vitrine pública do projeto e documenta o uso das APIs.

### Quando Atualizar:
- Criação de novos métodos fluentes no `Duck` / `Query` (ex: novas funções de agregação, novos métodos de cláusula).
- Evolução de módulos ou alteração na árvore de diretórios do projeto.
- Novos exemplos de queries com a respectiva saída gerada por `.toInstruction()`:
  ```javascript
  // Exemplo de saída documentada:
  {
    template: 'SELECT "id", "name" FROM "users" WHERE ("status" = $1)',
    values: ['active']
  }
  ```
- Atualização das instruções de teste e dependências.

---

## ✅ 5. Checklist de Validação da Documentação
- [ ] Os links de arquivos utilizam caminhos válidos e clicáveis (`file:///`)?
- [ ] A formatação Markdown (tabelas, blocos de código, listas) está intacta?
- [ ] Nenhuma diretriz anterior foi acidentalmente sobrescrita ou truncada?
- [ ] Se uma tarefa foi marcada como `[x]`, o teste automatizado correspondente existe e foi executado com sucesso?
