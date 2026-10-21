const { VisitorPostgresSQL, qualifyTableName, qualifyTable, quote } = require("..");
const { CompilerGrammar: CG } = require("../grammar/compileGrammar");
const { ST, isConstraint, isColumn, isRelationship } = require("../../../global-symbol-lockup/symbols");
const { DefinitionVisitorPostgresSQL } = require("./definitionVisitor");

class AlterVisitorPostgresSQL extends VisitorPostgresSQL {
  #definitions = new DefinitionVisitorPostgresSQL();

  /**
   * @param {import('../../../schema/concepts/constraint').Constraint} constraint
   * @param {{ table: import('../../../schema/elements/table').TableSchema, action?: string, cascade?: boolean, ifExists?: boolean }} context
   */
  [ST.constraint](constraint, context = {}) {
    if (!isConstraint(constraint)) throw new TypeError('constraint must be Constraint instance');
    const { table, action = CG.statements.add, cascade = false, ifExists = false } = context;
    if (!table) throw new Error('AlterVisitor requires target TableSchema in context.');

    const tableName = this.qualifyTable(table);
    const constraintName = constraint.name ? quote(constraint.name) : '';

    switch (action) {
      case CG.statements.add: {
        const definition = this.#definitions[ST.constraint](constraint);
        return [
          CG.statements.alter,
          CG.tableDDL.tableToken,
          tableName,
          CG.statements.add,
          definition
        ].join(' ') + CG.terminator;
      }

      case CG.statements.drop: {
        return [
          CG.statements.alter,
          CG.tableDDL.tableToken,
          tableName,
          CG.statements.drop,
          constraintName ? CG.constraintDDL.constraintToken : '',
          constraintName && ifExists ? CG.conditionals.ifExists : '',
          constraintName,
          cascade ? CG.constraintDDL.actions.cascade : ''
        ].filter(Boolean).join(' ') + CG.terminator;
      }

      default:
        throw new SyntaxError(`Unsupported action "${action}" for constraint in AlterVisitor.`);
    }
  }

  /**
   * @param {import('../../../schema/elements/column').Column} column
   * @param {{ table: import('../../../schema/elements/table').TableSchema, action?: string, cascade?: boolean, ifExists?: boolean }} context
   */
  [ST.column](column, context = {}) {
    if (!isColumn(column)) throw new TypeError('column must be a Column instance.');
    const { table, action = CG.statements.add, cascade = false, ifExists = false } = context;
    if (!table) throw new Error('AlterVisitor requires target TableSchema in context.');

    const tableName = this.qualifyTable(table);
    const colName = quote(column.name);

    switch (action) {
      case CG.statements.add: {
        const definition = this.#definitions[ST.column](column);
        return [
          CG.statements.alter,
          CG.tableDDL.tableToken,
          tableName,
          CG.statements.add,
          CG.columnDDL.columnToken,
          definition
        ].join(' ') + CG.terminator;
      }

      case CG.statements.drop: {
        return [
          CG.statements.alter,
          CG.tableDDL.tableToken,
          tableName,
          CG.statements.drop,
          CG.columnDDL.columnToken,
          ifExists ? CG.conditionals.ifExists : '',
          colName,
          cascade ? CG.constraintDDL.actions.cascade : ''
        ].filter(Boolean).join(' ') + CG.terminator;
      }

      default:
        throw new SyntaxError(`Unsupported action "${action}" for column in AlterVisitor.`);
    }
  }

  /**
   * @param {import('../../../schema/concepts/reference').Relationship} relationship
   * @param {{ action?: string, cascade?: boolean, ifExists?: boolean }} context
   */
  [ST.relationship](relationship, context = {}) {
    if (!isRelationship(relationship)) throw new TypeError('relationship must be Relationship instance');
    const { action = CG.statements.add, cascade = false, ifExists = false } = context;
    const statements = [];

    for (const ref of relationship.references) {
      const originTableName = qualifyTable(ref.originTable);
      const targetTableName = qualifyTable(ref.target);
      const originColumnNames = Object.keys(ref.references).map(quote).join(`${CG.tableDDL.columnSeparator} `);
      const targetColumnNames = Object.values(ref.references).map(quote).join(`${CG.tableDDL.columnSeparator} `);

      const refConstraint = ref.constraint;
      const rawName = refConstraint?.name || relationship.name;

      if (action === CG.statements.add) {
        const onDelete = refConstraint?.onDelete
          ? `${CG.constraintDDL.actions.onDelete} ${CG.actionsMapper[refConstraint.onDelete]}`
          : '';
        const onUpdate = refConstraint?.onUpdate
          ? `${CG.constraintDDL.actions.onUpdate} ${CG.actionsMapper[refConstraint.onUpdate]}`
          : '';

        const sql = [
          CG.statements.alter,
          CG.tableDDL.tableToken,
          originTableName,
          CG.statements.add,
          rawName ? `${CG.constraintDDL.constraintToken} ${quote(rawName)}` : '',
          CG.constraintDDL.tokens.foreign,
          `${CG.tableDDL.separators.left}${originColumnNames}${CG.tableDDL.separators.right}`,
          CG.constraintDDL.tokens.references,
          targetTableName,
          `${CG.tableDDL.separators.left}${targetColumnNames}${CG.tableDDL.separators.right}`,
          onDelete,
          onUpdate
        ].filter(Boolean).join(' ') + CG.terminator;

        statements.push(sql);
      } else if (action === CG.statements.drop) {
        if (!rawName) throw new Error('Relationship must have a name to be dropped.');
        const sql = [
          CG.statements.alter,
          CG.tableDDL.tableToken,
          originTableName,
          CG.statements.drop,
          CG.constraintDDL.constraintToken,
          ifExists ? CG.conditionals.ifExists : '',
          quote(rawName),
          cascade ? CG.constraintDDL.actions.cascade : ''
        ].filter(Boolean).join(' ') + CG.terminator;

        statements.push(sql);
      }
    }

    return statements;
  }

  [ST.type](type, column = null) {
    return this.#definitions[ST.type](type, column);
  }
}


module.exports = { AlterVisitorPostgresSQL };