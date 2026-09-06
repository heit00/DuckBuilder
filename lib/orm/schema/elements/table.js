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

  relations = new Map([]);

  constructor(name, schemaName = Grammar.defaultArgs.publicSchema){
    this.name = name;
    this.schemaName = schemaName;
  }

  #updateMetaData(column){ 
    if (column.primary) {
      this.primaryKeys.push(column.name);
      
      const stringName = `${this.name}_${column.name}`;
      const constraint = new Constraint().name(stringName, Constraint.PREFIX.primary);
      constraint.type(Constraint.TYPES.primaryKey).columns(column.name);
      this.constraints.set(constraint.name, constraint);
    } 
    if (column.references) {

      const stringName = `${ this.name }_${ column.name }_ref_${ column.references.table.name }_${ column.references.columnName }`;
      this.foreignKeys.push(column.name);

      const relation = new Relationship(`${Relationship.PREFIX.foreign}_${stringName}`, Relationship.TYPES.manyToOne);
      relation.createReference({ originTable: this, target: column.references.table, references: { [column.name]: column.references.columnName } });
      this.relations.set(relation.name, relation);

      const constraint = new Constraint().name(stringName, Relationship.PREFIX.foreign);
      constraint.type(Constraint.TYPES.foreignKey).columns(column.name);
      constraint.references(column.references.table, column.references.columnName);
      this.constraints.set(constraint.name, constraint);
    }
    if(column.index) this.indexes.push(column.name);
    if(column.unique){
      const contraint = new Constraint().type(Constraint.TYPES.unique).columns(column.name);
      contraint.unique(column.name).name(`${this.name}_${column.name}`, Constraint.PREFIX.unique);
      this.constraints.set(contraint.name, contraint);
    }
    if(!column.nullable){
      const constraint = new Constraint().type(Constraint.TYPES.notNull).columns(column.name);
      constraint.name(`${this.name}_${column.name}`, Constraint.PREFIX.nullable);
      this.constraints.set(constraint.name, constraint);
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
    return this;
  }

  manyToOneRelation(target, references = {}, name) {
    if (!references || typeof references !== 'object') throw new Error('references must be a object.');
    const relationship = new Relationship(`${this.name}_${Object.keys(references).join('_')}_${target.name}`, Relationship.TYPES.manyToOne);
    relationship.createReference({ originTable: this, target, references });
    this.relations.set(relationship.name, relationship);
    return this;
  }

  manyToManyRelation(relationShip) {
    if (!relationShip || !(relationShip instanceof Relationship)) throw new TypeError('relationShip must be a RelationShip instance.');
    this.relations.set(relationShip.name, relationShip);
    return this;
  }
}