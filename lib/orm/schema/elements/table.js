const { SchemaGrammar: Grammar} = require('../grammar/schemaGrammar');
const { Relationship } = require('../concepts/reference');
const { Constraint } = require('../concepts/constraint');
const { ST, ELEMENT_VALUE_TYPE, isColumn } = require('../symbol-lockup/symbols');
const { createManyToManyRelation } = require('../internal/manyToManyRelation');
const { Column } = require('./column');

class TableSchema {
  get [ELEMENT_VALUE_TYPE]() { return ST.table }

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
  pivots = []; //schedule pivot tables creation...

  constructor(name, schemaName = Grammar.defaultArgs.publicSchema) {
    this.name = name;
    this.schemaName = schemaName;
  }

  #updateMetaData(column) {
    if (column.primary()) {
      this.primaryKeys.push(column.name());
      
      const stringName = `${this.schemaName}_${this.name}_${column.name()}`;
      const constraint = new Constraint().name(stringName, Constraint.PREFIX.primary);
      constraint.type(Constraint.TYPES.primaryKey).columns(column.name());
      this.constraints.set(constraint.name(), constraint);
    }
    if (column.references()) {

      const targetSchema = column.references().table.schemaName ? `${column.references().table.schemaName}_` : '';
      const stringName = `${this.schemaName}_${this.name}_${column.name()}_ref_${targetSchema}${column.references().table.name}_${column.references().columnName}`;
      this.foreignKeys.push(column.name());

      const relation = new Relationship(`${Relationship.PREFIX.foreign}_${stringName}`, Relationship.TYPES.manyToOne);
      relation.createReference({ originTable: this, target: column.references().table, references: { [column.name()]: column.references().columnName } });
      this.relations.set(relation.name, relation);

      const constraint = new Constraint().name(stringName, Relationship.PREFIX.foreign);
      constraint.type(Constraint.TYPES.foreignKey).columns(column.name());
      constraint.references(column.references().table, column.references().columnName);
      this.constraints.set(constraint.name(), constraint);
    }
    if (column.index()) this.indexes.push(column.name());
    if (column.unique()) {
      const contraint = new Constraint().type(Constraint.TYPES.unique).columns(column.name());
      contraint.unique(column.name()).name(`${this.schemaName}_${this.name}_${column.name()}`, Constraint.PREFIX.unique);
      this.constraints.set(contraint.name(), contraint);
    }
    if (!column.nullable()) {
      const constraint = new Constraint().type(Constraint.TYPES.notNull).columns(column.name());
      constraint.name(`${this.schemaName}_${this.name}_${column.name()}`, Constraint.PREFIX.nullable);
      this.constraints.set(constraint.name(), constraint);
    }
    return;
  }

  defineColumns(...columns) {
    if (columns.length === 1 && Array.isArray(columns[0])) columns = columns[0];
    if (columns.some(column => !isColumn(column))) throw new TypeError('columns must be a column');
    columns.forEach(column => {
      if (this.columns.has(column.name())) throw new Error(`column ${column.name()} already registered.`);
      this.columns.set(column.name(), column);
      this.#updateMetaData(column);
    })
    return this;
  }
  
  manyToOneRelation(target, references = {}, name, { constraintName, ...options } = {}) {
    if (!references || typeof references !== 'object') throw new Error('references must be a object.');

    if (Object.values(references).some(targetColumnName =>
      !target.columns.has(targetColumnName) || (!target.columns.get(targetColumnName).unique() && !target.columns.get(targetColumnName).primary())
    )) throw new Error('target columns references must be unique or primary key.');

    const targetSchema = target.schemaName ? `${target.schemaName}_` : '';
    const relName = name || `${this.schemaName}_${this.name}_${Object.keys(references).join('_')}_${targetSchema}${target.name}`;

    const relationship = new Relationship(relName, Relationship.TYPES.manyToOne);
    if (this.relations.has(relationship.name)) throw new Error(`relationship ${relationship.name} already registered.`);

    const constraint = new Constraint();
    constraint.foreignKey(...Object.keys(references));
    constraint.references(target, Object.values(references), options);
    const cName = constraintName || `${Constraint.PREFIX.foreign}_${relName}`;
    constraint.name(cName);

    this.constraints.set(cName, constraint);
    relationship.createReference({ originTable: this, target, references });
    this.relations.set(relationship.name, relationship);
    
     if (this.constraints.has(cName)) throw new Error(`constraint ${cName} already registered.`);

    return this;
  }

  manyToManyRelation(name, target, originReferences, targetReferences, pivot = null, pivotName) {
    createManyToManyRelation(name, this, target, originReferences, targetReferences, pivotName, pivot);
  }

  appendPivots(...pivots){
    this.pivots.push(...pivots);
  }

  appendRelation(relation){
    this.relations.set(relation.name, relation);
  }
}

module.exports = { TableSchema };