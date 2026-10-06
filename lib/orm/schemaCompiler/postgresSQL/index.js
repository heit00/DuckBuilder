const { ST } = require('../../global-symbol-lockup/symbols');
const { CompilerGrammar: CG } = require('./grammar/compileGrammar');

const quote = (id) => {
  if (typeof id !== 'string') return id;
  const q = CG.quotes.identifier;
  if (id.startsWith(q) && id.endsWith(q)) return id;
  return `${q}${id}${q}`;
};

/**
 * Qualifica o nome da tabela separando schema e nome, aplicando aspas duplas ("schema"."tabela")
 * @param {string|import('../../schema/elements/table').TableSchema} target
 * @returns {string}
 */
function qualifyTableName(target) {
  if (!target) throw new TypeError('Target table must be provided.');

  if (typeof target === 'string') {
    const parts = target.split('.').map(p => p.trim()).filter(Boolean);
    if (parts.length === 0) throw new TypeError('Invalid table name.');
    return parts.map(quote).join('.');
  }

  const rawName = typeof target.name === 'function' ? target.name() : target.name;
  const rawSchema = typeof target.schemaName === 'function' ? target.schemaName() : target.schemaName;

  if (typeof rawName !== 'string' || !rawName.trim()) {
    throw new TypeError('Invalid table name.');
  }

  if (rawName.includes('.')) {
    const parts = rawName.split('.').map(p => p.trim()).filter(Boolean);
    return parts.map(quote).join('.');
  }

  if (rawSchema && typeof rawSchema === 'string' && rawSchema.trim()) {
    return `${quote(rawSchema.trim())}.${quote(rawName.trim())}`;
  }

  return quote(rawName.trim());
}

const qualifyTable = qualifyTableName;

class VisitorPostgresSQL {
  [ST.column]() { throw new Error(`method ${ST.column}() not implemented.`); }
  [ST.constraint]() { throw new Error(`method ${ST.constraint}() not implemented.`); }
  [ST.table]() { throw new Error(`method ${ST.table}() not implemented.`); }
  [ST.relationship]() { throw new Error(`method ${ST.relationship}() not implemented.`); }
  [ST.type]() { throw new Error(`method ${ST.type}() not implemented.`); }

  /**
   * Qualifica o identificador da tabela ("schema"."tabela")
   * @param {string|import('../../schema/elements/table').TableSchema} table
   */
  qualifyTableName(table) {
    return qualifyTableName(table);
  }

  /**
   * Alias para qualifyTableName
   * @param {string|import('../../schema/elements/table').TableSchema} table
   */
  qualifyTable(table) {
    return qualifyTableName(table);
  }
}

module.exports = { VisitorPostgresSQL, qualifyTableName, qualifyTable, quote };