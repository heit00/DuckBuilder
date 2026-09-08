const { registerTable } = require('./tablesRegister');
const { Relationship } = require('../concepts/reference');
const { TableSchema } = require('../elements/table');
const { Column } = require('../elements/column');
const { isTable } = require('../symbol-lockup/symbols');
/**
 * 
 * @param { * } references 
 * @param {TableSchema} pivotTable 
 * @param {TableSchema} target 
 */

function createIntermediateTableColumns(references, pivotTable, target) {

  const columns = [];

  if (!references || typeof references !== 'object') throw new TypeError('references must be a object.');
  if (!Array.isArray(references)) {
    for (key in references) {
      const column = new Column();
      column.name(key);
      const targetColumnType = target.columns.get(references[key]).type();
      if (targetColumnType === null) throw new Error('type must be defined on target table columns.');
      column.type(targetColumnType);
      columns.push(column);
    }
  }
  else {
    references.map(references => {
      for (key in references) {
        const column = new Column();
        column.name(key);
        const targetColumnType = target.columns.get(references[key]).type();
        if (targetColumnType === null) throw new Error('type must be defined on target table columns.');
        column.type(targetColumnType);
        columns.push(column);
      }
    });
  }

  pivotTable.columns(...columns);
}

function createIntermediateTableReferences(references, pivot, target){
  if (!references || typeof references !== 'object') throw new TypeError('references must be a object.');
  if(!Array.isArray(references)){
    pivot.manyToOneRelation(target, references);
  }
  else{
    references.forEach(el => {
      pivot.manyToOneRelation(target, references);
    });
  }
}

function createManyToManyRelation(name, origin,target, originReferences, targetReferences, pivotName, pivot) {
  if (!isTable(origin) || !isTable(target)) throw new TypeError('origin and target must be Table schema instance.');
  if (!originReferences || typeof originReferences !== 'object' || !targetReferences || typeof targetReferences !== 'object') throw new TypeError('all references args must be objects.');
  

  if (!pivot) {
    const finalPivotName = pivotName ? pivotName : `${origin.schemaName}.${origin.name}_relationIntermediate_${target.schemaName}.${target.name}`;
    pivot = new TableSchema(finalPivotName);
    createIntermediateTableColumns(originReferences, pivot, origin);
    createIntermediateTableColumns(targetReferences, pivot, target);
  }

  createIntermediateTableReferences(originReferences, pivot, origin);
  createIntermediateTableReferences(targetReferences, pivot, target);
  
  const relationShip = new Relationship(name, Relationship.TYPES.manyToMany);
  relationShip.setPivot(pivot);

  target.appendPivots(pivot);
  target.appendRelation(relationShip);
  origin.appendRelation(relationShip);
}

module.exports = { createManyToManyRelation };
