const { VisitorPostgresSQL } = require("..");
const { ST, isRelationship } = require("../../../global-symbol-lockup/symbols");
const { Relationship } = require("../../../schema/concepts/reference");
const { CompilerGrammar: CG } = require("../grammar/compileGrammar");
const { DefinitionVisitorPostgresSQL, quote, qualifyTableName, qualifyTable } = require("./definitionVisitor");

class CreatorVisitorPostgresSQL extends VisitorPostgresSQL {
  #definitions = new DefinitionVisitorPostgresSQL();
  #tables = [];
  #posterioriChanges = [];
  #indexes = [];

  /**
   * @param {import('../../../schema/elements/column').Column} column
   */
  [ST.column](column) {
    return this.#definitions[ST.column](column);
  }

  /**
   * @param {import('../../../schema/concepts/constraint').Constraint} constraint
   */
  [ST.constraint](constraint) {
    return this.#definitions[ST.constraint](constraint);
  }

  /**
   * @param {import('../../../schema/elements/table').TableSchema} table
   */
  [ST.table](table) {
    const header = `${CG.statements.create} ${CG.tableDDL.tableToken} ${this.qualifyTableName(table)} ${CG.conditionals.ifNotExists}`;
    const cols = typeof table.columns === 'function' ? table.columns() : table.columns;
    const intermediateColumnList = cols ? Array.from(cols.values()).map(column => this[ST.column](column)) : [];
    const constraints = typeof table.constraints === 'function' ? table.constraints() : table.constraints;
    const intermediateConstraintList = constraints ? Array.from(constraints.values()).map(constraint => this[ST.constraint](constraint)).filter(Boolean) : [];
  }

  /**
   * @param {import('../../../schema/typesDefinition/type').Type} type
   * @param {import('../../../schema/elements/column').Column} [column]
   */
  [ST.type](type, column = null) {
    return this.#definitions[ST.type](type, column);
  }
}



module.exports = { CreatorVisitorPostgresSQL };


