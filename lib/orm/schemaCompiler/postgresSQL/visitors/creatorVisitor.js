const { VisitorPostgresSQL } = require("..");
const { isType, ST } = require("../../../global-symbol-lockup/symbols");
const { CompilerGrammar:CG } = require("../grammar/compileGrammar");

class CreatorVisitorPostgresSQL extends VisitorPostgresSQL{
  #tables = [];
  #foreingKeys = [];
  #indexes = [];
  
  /**
   * @param {import('../../../schema/elements/column').Column} column
   */
  [ST.column](column) { 
      const type = this[ST.type](column.type());
      return `${column.name()} ${type}`;
      
   }
  
  /**
   * 
   * @param {import('../../../schema/concepts/constraint').Constraint} constraint 
   */
  [ST.constraint](constraint) { 
    //constraint definitio 
  }

  /**
   * @param {import('../../../schema/elements/table').TableSchema} table 
   */
  [ST.table](table) { 
    const header = `${CG.statements.create} ${CG.tableDDL.tableToken} ${table.name()} ${CG.conditionals.ifNotExists}`;
    const intermediateColumnList = table.columns().values().map(column => this[ST.column](column));
    const intermediateConstraintList = table.constraints().values().map(constraint => this[ST.constraint](constraint));

  }
  [ST.relationship]() {  }

  /**
   * 
   * @param {import('../../../schema/typesDefinition/type').Type} type 
   */
  [ST.type](type) {
    if(!isType(type)) throw new TypeError('type must be a Type instance.');
    const mappedType = CG.typesMapper[type.baseType] || type.baseType;

    const argsList = type.args.length > 0 ? `${CG.columnDDL.typeLeftSeparator}${type.args.join(CG.columnDDL.argsSeparator)}${CG.columnDDL.typeRightSeparator}` : '';

    return mappedType + argsList;
  }
}





