const { SchemaGrammar: Grammar} = require('../grammar/schemaGrammar');
const { Relationship } = require('../concepts/reference');
const { Constraint } = require('../concepts/constraint');

class TableSchema{
  name;
  schemaName;

  columns = new Map([]);
  constraints = new Map([]);
  indexes = [];

  foreignKeys = [];
  primaryKeys = [];

  onDelete = Grammar.OnAction.restrict;
  onUpdate = Grammar.OnAction.cascade;

  unloogged = false;
  temporary = false;

  relations = [];

  constructor(name, schemaName = Grammar.defaultArgs.publicSchema){
    this.name = name;
    this.schemaName = schemaName;
  }

  #updateMetaData(column){ 
    if(column.primary) this.primaryKeys.push(column.name);
    if(column.references) {
      /**
       * IF USER set column.referece the ORM know it will be N-1, if the objective is N-N, so it cannot be setted
       */
      this.foreignKeys.push(column.name);
      // colocar a criação de nome padrao direto em RELATIONSHIP e o mesmo para CONSTRAINT
      const relation = new Relationship(`fk_${this.name}_${column.name}_ref_${column.references.table.name}_${column.references.columnName}`, Relationship.TYPES.manyToOne);
      relation.createReference({originTable: this, originTableColumnName: column.name, target: column.references.table, targetColumnName: column.references.columnName });
      this.relations.push(relation);
    }
    if(column.index) this.indexes.push(column.name);
    if(column.unique){
      const contraint = new Constraint();
      contraint.unique(column.name).name();
    }
    if(!column.nullable){
      const contraint = new Constraint();
    }
    return;
  }

  defineColumns(columns = {}){
    if(!columns || typeof columns !== 'object') throw new TypeError('columns must be a object.');
    for(key in columns){
      const column = columns[key];
      this.columns.set(key, column);
      this.#updateMetaData(column);
    }
  }
}