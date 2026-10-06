const { VisitorPostgresSQL, qualifyTableName, qualifyTable, quote } = require("..");
const { CompilerGrammar: CG } = require("../grammar/compileGrammar");
const { ST, isConstraint, isColumn, isRelationship } = require("../../../global-symbol-lockup/symbols");
const { DefinitionVisitorPostgresSQL } = require("./definitionVisitor");

class AlterVisitorPostgresSQL extends VisitorPostgresSQL {
  #definitions = new DefinitionVisitorPostgresSQL();

  /**
   * @param {import('../../../schema/concepts/constraint').Constraint} constraint
   * @param {{ table: import('../../../schema/elements/table').TableSchema, action?: string, cascade?: boolean }} context
   */
  [ST.constraint](constraint, context = {}) {
    if (!isConstraint(constraint)) throw new TypeError('constraint must be Constraint instance');
    const { table, action = CG.statements.add, cascade = false } = context;
    if (!table) throw new Error('AlterVisitor requires target TableSchema in context.');

    const tableName = this.qualifyTable(table);
    const constraintName = constraint.name() ? quote(constraint.name()) : '';

    switch (action) {
      case CG.statements.add: {
        const definition = this.#definitions[ST.constraint](constraint);
        return `${CG.statements.alter} ${CG.tableDDL.tableToken} ${tableName} ${CG.statements.add} ${definition}${CG.terminator}`;
      }

      case CG.statements.drop: {
        const cascadeToken = cascade ? ' CASCADE' : '';
        const nameToken = constraintName ? ` ${CG.constraintDDL.constraintToken} ${constraintName}` : '';
        return `${CG.statements.alter} ${CG.tableDDL.tableToken} ${tableName} ${CG.statements.drop}${nameToken}${cascadeToken}${CG.terminator}`;
      }

      default:
        throw new SyntaxError(`Unsupported action "${action}" for constraint in AlterVisitor.`);
    }
  }

  /**
   * @param {import('../../../schema/elements/column').Column} column
   * @param {{ table: import('../../../schema/elements/table').TableSchema, action?: string }} context
   */
  [ST.column](column, context = {}) {
    if (!isColumn(column)) throw new TypeError('column must be a Column instance.');
    const { table, action = CG.statements.add } = context;
    if (!table) throw new Error('AlterVisitor requires target TableSchema in context.');

    const tableName = this.qualifyTable(table);
    const colName = quote(column.name());

    switch (action) {
      case CG.statements.add: {
        const definition = this.#definitions[ST.column](column);
        return `${CG.statements.alter} ${CG.tableDDL.tableToken} ${tableName} ${CG.statements.add} ${CG.columnDDL.columnToken} ${definition}${CG.terminator}`;
      }

      case CG.statements.drop: {
        return `${CG.statements.alter} ${CG.tableDDL.tableToken} ${tableName} ${CG.statements.drop} ${CG.columnDDL.columnToken} ${colName}${CG.terminator}`;
      }

      default:
        throw new SyntaxError(`Unsupported action "${action}" for column in AlterVisitor.`);
    }
  }

  /**
   * @param {import('../../../schema/concepts/reference').Relationship} relationship
   * @param {{ action?: string }} context
   */
  [ST.relationship](relationship, context = {}) {
    if (!isRelationship(relationship)) throw new TypeError('relationship must be Relationship instance');
    const { action = CG.statements.add } = context;
    const statements = [];

    for (const ref of relationship.references) {
      const originTable = this.qualifyTable(ref.originTable);
      const targetTable = this.qualifyTable(ref.target);
      const originCols = Object.keys(ref.references).map(quote).join(`${CG.tableDDL.columnSeparator} `);
      const targetCols = Object.values(ref.references).map(quote).join(`${CG.tableDDL.columnSeparator} `);

      if (action === CG.statements.add) {
        const cName = relationship.name ? `${CG.constraintDDL.constraintToken} ${quote(relationship.name)} ` : '';
        const sql = `${CG.statements.alter} ${CG.tableDDL.tableToken} ${originTable} ${CG.statements.add} ${cName}${CG.constraintDDL.tokens.foreign} ${CG.tableDDL.separators.left}${originCols}${CG.tableDDL.separators.right} ${CG.constraintDDL.tokens.references} ${targetTable} ${CG.tableDDL.separators.left}${targetCols}${CG.tableDDL.separators.right}${CG.terminator}`;
        statements.push(sql);
      } else if (action === CG.statements.drop) {
        if (!relationship.name) throw new Error('Relationship must have a name to be dropped.');
        statements.push(`${CG.statements.alter} ${CG.tableDDL.tableToken} ${originTable} ${CG.statements.drop} ${CG.constraintDDL.constraintToken} ${quote(relationship.name)}${CG.terminator}`);
      }
    }

    return statements;
  }

  [ST.type](type, column = null) {
    return this.#definitions[ST.type](type, column);
  }
}

module.exports = { AlterVisitorPostgresSQL };