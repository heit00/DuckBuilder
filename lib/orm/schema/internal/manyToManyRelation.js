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

function createManyToManyRelation(name, origin, originReferences, target, targetReferences, pivotName, pivot) {
  if (!isTable(origin) || !isTable(target)) throw new TypeError('origin and target must be Table schema instance.');
  if (!originReferences || typeof originReferences !== 'object' || !targetReferences || typeof targetReferences !== 'object') throw new TypeError('all references args must be objects.');
  const finalPivotName = pivotName ? pivotName : `${origin.schemaName}.${origin.name}_relationIntermediate_${target.schemaName}.${target.name}`;

  if (!pivot) {
    pivot = new TableSchema(finalPivotName);
    createIntermediateTableColumns(originReferences, pivot, origin);
    createIntermediateTableColumns(targetReferences, pivot, target);
  }

  pivot.manyToOneRelation(origin, originReferences).manyToOneRelation(target, targetReferences);
}
