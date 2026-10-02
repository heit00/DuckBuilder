const { VisitorPostgresSQL } = require("..");
const { isType, ST, isConstraint } = require("../../../global-symbol-lockup/symbols");
const { CompilerGrammar:CG } = require("../grammar/compileGrammar");

const quote = (id) => `${CG.quotes.identifier}${id}${CG.quotes.identifier}`;

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
   * @param {import('../../../schema/concepts/constraint').Constraint} constraint 
   */
  [ST.constraint](constraint) { 
    if (!isConstraint(constraint)) throw new TypeError('constraint must be Constrant instance');
    return constraintSubVisitor(constraint);
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
   * @param {import('../../../schema/typesDefinition/type').Type} type 
   */
  [ST.type](type) {
    if(!isType(type)) throw new TypeError('type must be a Type instance.');
    const mappedType = CG.typesMapper[type.baseType] || type.baseType;

    const argsList = type.args.length > 0 ? `${CG.columnDDL.typeLeftSeparator}${type.args.join(CG.columnDDL.argsSeparator)}${CG.columnDDL.typeRightSeparator}` : '';

    return mappedType + argsList;
  }
}

function constraintSubVisitor(constraint) {
  const mappedType = CG.constraintsMapper[constraint.type()];
  const name = constraint.name();
  const prefix = name ? `${CG.constraintDDL.constraintToken} ${quote(name)} ` : ''; 

  switch (mappedType) {
    case CG.constraintDDL.tokens.primary: 
    case CG.constraintDDL.tokens.unique: {                                                                                                                                        
          const cols = constraint.columns().map(quote).join(`${CG.tableDDL.columnSeparator} `);                                                                                       
          return `${prefix}${mappedType} ${CG.columnDDL.typeLeftSeparator}${cols}${CG.columnDDL.typeRightSeparator}`;                                                                                                                                  
    }
    case CG.constraintDDL.tokens.check:
      return `${prefix}${mappedType} ${CG.columnDDL.typeLeftSeparator}${constraint.expression()}${CG.columnDDL.typeRightSeparator}`
  }
  //...
}

module.exports = { CreatorVisitorPostgresSQL };




