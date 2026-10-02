const { VisitorPostgresSQL } = require("..");
const { isType, ST, isConstraint, isColumn } = require("../../../global-symbol-lockup/symbols");
const { SchemaGrammar } = require("../../../schema/grammar/schemaGrammar");
const { CompilerGrammar:CG } = require("../grammar/compileGrammar");

const quote = (id) => `${CG.quotes.identifier}${id}${CG.quotes.identifier}`;

class CreatorVisitorPostgresSQL extends VisitorPostgresSQL{
  #tables = [];
  #posterioriChanges = [];
  #indexes = [];
  
  /**
   * @param {import('../../../schema/elements/column').Column} column
   */
  [ST.column](column) { 
    if (!isColumn(column)) throw new TypeError('column must be a Column instance.');
    const type = this[ST.type](column.type(), column);
    let sql = `${quote(column.name())} ${type}`;
    if (column.default() !== null && column.default() !== undefined) {
      sql += ` ${CG.columnDDL.default} ${column.default()}`;
    }
    return sql;
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
    const intermediateConstraintList = table.constraints().values().map(constraint => this[ST.constraint](constraint)).filter(Boolean);

  }

  /**
   * @param {import('../../../schema/concepts/reference').Relationship} relationship 
   */
  [ST.relationship](relationship) { 
    //create relationshipCompiler
  }

  /**
   * @param {import('../../../schema/typesDefinition/type').Type} type 
   * @param {import('../../../schema/elements/column').Column} [column]
   */
  [ST.type](type, column = null) {
    if (!isType(type) && (!type || typeof type !== 'object' || !type.name)) {
      throw new TypeError('type must be a Type instance.');
    }

    if (column && typeof column.autoIncrement === 'function' && column.autoIncrement()) {
      const base = type.baseType || type.radical;
      if (base === SchemaGrammar.BaseTypes.integer || base === 'int') {
        return 'SERIAL';
      }
    }

    const base = type.baseType || type.radical;
    let mappedType = CG.typesMapper[base] || (type.name ? type.name.toUpperCase() : base);

    let args = type.args || [];
    if (base === SchemaGrammar.BaseTypes.varchar && args.length === 0) {
      args = [255];
    }

    const argsList = args.length > 0 
      ? `${CG.columnDDL.typeLeftSeparator}${args.join(CG.columnDDL.argsSeparator)}${CG.columnDDL.typeRightSeparator}` 
      : '';

    return mappedType + argsList;
  }
}

function compileDeferrable(constraint) {
    if (!constraint.deferrable()) return '';

    const isDeferred = constraint.initiallyDeferrable();
    return isDeferred
        ? ` ${CG.constraintDDL.defer.deferrable} ${CG.constraintDDL.defer.initially} ${CG.constraintDDL.defer.deferred}`
        : ` ${CG.constraintDDL.defer.deferrable} ${CG.constraintDDL.defer.initially} ${CG.constraintDDL.defer.immediate}`;
}

function constraintSubVisitor(constraint) {
  const mappedType = CG.constraintsMapper[constraint.type()];
  const name = constraint.name();
  const prefix = name ? `${CG.constraintDDL.constraintToken} ${quote(name)} ` : ''; 

  switch (mappedType) {
    case CG.constraintDDL.tokens.primary: 
    case CG.constraintDDL.tokens.unique: {                                                                                                                                     
      const cols = constraint.columns().map(quote).join(`${CG.tableDDL.columnSeparator} `);                                                                                       
      return `${prefix}${mappedType} ${CG.columnDDL.typeLeftSeparator}${cols}${CG.columnDDL.typeRightSeparator}${compileDeferrable(constraint)}`;
    }                                                                                                                                  
    case CG.constraintDDL.tokens.check:
      return `${prefix}${mappedType} ${CG.columnDDL.typeLeftSeparator}${constraint.expression()}${CG.columnDDL.typeRightSeparator}`;
    case CG.constraintDDL.tokens.notNull: 
      const checkToken = CG.constraintDDL.tokens.check;
      const notNullCols = constraint.columns();
      if (notNullCols.length === 0) throw new SyntaxError(`Constraint "${name || 'anonymous'}" must specify at least one column.`);
      const checkExpr = notNullCols.map(quote).map(c => `${c} ${CG.specialOperators.is} ${CG.constraintDDL.tokens.notNull}`).join(` ${CG.logicOperators.and} `);
      return `${prefix}${checkToken} (${checkExpr})`;
    case CG.constraintDDL.tokens.foreign: //implemented on relationship method
      return '';
    default:
      throw new Error(`${mappedType} is not defined as CONSTRAINT_TYPE`);
  }
  //...
}

module.exports = { CreatorVisitorPostgresSQL };




