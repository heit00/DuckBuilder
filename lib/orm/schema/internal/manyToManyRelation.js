const { registerTable } = require('./tablesRegister');
const { Relationship } = require('../concepts/reference');
const { TableSchema } = require('../elements/table');
const { isTable } = require('../symbol-lockup/symbols');

function createManyToManyRelation(name, origin, originReferences, target, targetReferences, pivotName) {
  if (!isTable(origin) || !isTable(target)) throw new TypeError('origin and target must be Table schema instance.');
  if (!originReferences || typeof originReferences !== 'object' || !targetReferences || typeof targetReferences !== 'object') throw new TypeError('all references args must be objects.');
  const name = pivotName ? pivotName : `${origin.schemaName}.${origin.name}_relationIntermediate_${target.schemaName}.${target.name}`;
  const pivotTable = new TableSchema(name);
 
  //CREATE COLUMNS DEFINITION


  pivotTable.manyToOneRelation(origin, originReferences).manyToOneRelation(target, targetReferences);

}