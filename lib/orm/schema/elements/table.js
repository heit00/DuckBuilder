const { SchemaGrammar: Grammar} = require('../grammar/schemaGrammar');

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

  /** 
  * @param {import('./column').Column} column 
  */
  #updateMetaData(column){ 
    if(column.primary) this.primaryKeys.push(column.name);
    if(column.references) this.foreignKeys.push(column.name);
    if(column.index) this.indexes.push(column.name);
  }

  defineColumns(columns = {}){
    if(!columns || typeof columns !== 'object') throw new TypeError('columns must be a object.');
    for(key in columns){
      const column = columns[key];
      this.columns.set(key, column);
    }
  }
}