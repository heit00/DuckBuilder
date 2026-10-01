const { VisitorPostgresSQL } = require("../..");
const { CompilerGrammar: CG } = require("../../grammar/compileGrammar");
const { ST, isType } = require('../../../../global-symbol-lockup/symbols');

//CREATE ERROS FOR NON TYPES COLUMNS

class CreatorVisitorPostgresSQL extends VisitorPostgresSQL{
  #tables = [];
  #foreignKeys = [];
  #indexes = [];
  
  /**
   * 
   * @param {import('../../../../schema/elements/column').Column
   * } column 
   */
  [ST.column](column) { 
    const formatedColumn = `${CG.quotes.identifier}${column.name()}${CG.quotes.identifier} ${this[ST.type](column.type(), column)}`;
   }
  [ST.constraint]() {  }

  /**
   * @param {import('../../../../schema/elements/table').TableSchema} table 
   */
  [ST.table](table) { 
    const header = `${CG.statements.create} ${CG.tableDDL.tableToken} ${CG.quotes.identifier}${table.name}${CG.quotes.identifier} ${CG.conditionals.ifNotExists}`;
    const columnsIntermediateArray = Array.from(table.columns.values()).map(column => this[ST.column](column));
    const constraintIntermediateArray = Array.from(table.constraints.values()).map(constraint => this[ST.constraint](constraint));
  }

  [ST.type](type, column) {
    if (!isType(type)) throw new TypeError('type must be a Type instance');
    const mapper = CG.typeMap[type.radical];
    if (typeof mapper === 'function') {
      return mapper(type, column);
    }
    if (typeof mapper === 'string') {
      return mapper;
    }
    const args = type.args && type.args.length > 0 ? `${CG.columnDDL.typeLeftSeparator}${type.args.join(CG.columnDDL.argsSeparator)}${CG.columnDDL.typeRightSeparator}` : '';
    return `${type.name ? type.name.toUpperCase() : ''}${args}`;
  }
}

module.exports = { CreatorVisitorPostgresSQL };
