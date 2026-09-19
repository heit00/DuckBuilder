const { Relationship } = require('../concepts/reference');
const { Column } = require('../elements/column');
const { isTable } = require('../symbol-lockup/symbols');

function populeColumnsArray(columns, references, target) {
      for (const key in references) {
        const targetColumn = target.columns.get(references[key]);
        if (!targetColumn) throw new Error(`column ${key} doesn't exist on refered table.`);
        const column = new Column();
        column.name(key);
        const targetColumnType = targetColumn.type();
        if (targetColumnType === null) throw new Error('type must be defined on target table columns.');
        column.type(targetColumnType);
        columns.push(column);
    }
}

function createIntermediateTableColumns(references, pivot, target) {

  const columns = []
  if (!references || typeof references !== 'object') throw new TypeError('references must be a object.');
  if (!Array.isArray(references)) {
    populeColumnsArray(columns, references, target);
  }
  else {
    references.map(references => {
    populeColumnsArray(columns, references, target);
    });
  }

  pivot.defineColumns(...columns);

  return;
}

function createIntermediateTableReferences(references, pivot, target){
  if (!references || typeof references !== 'object') throw new TypeError('references must be a object.');
  if(!Array.isArray(references)){
    pivot.manyToOneRelation(target, references);
  }
  else{
    references.forEach(el => {
      pivot.manyToOneRelation(target, el);
    });
  }
}

function createManyToManyRelation(name, origin,target, originReferences, targetReferences, pivotName, pivot) {
  if (!isTable(origin) || !isTable(target)) throw new TypeError('origin and target must be Table schema instance.');
  if (!originReferences || typeof originReferences !== 'object' || !targetReferences || typeof targetReferences !== 'object') throw new TypeError('all references args must be objects.');
  
  if (!pivot) {
    const finalPivotName = pivotName ? pivotName : `${origin.schemaName}.${origin.name}_relationIntermediate_${target.schemaName}.${target.name}`;
    pivot = new origin.constructor(finalPivotName);
    createIntermediateTableColumns(originReferences, pivot, origin);
    createIntermediateTableColumns(targetReferences, pivot, target);
  }

  createIntermediateTableReferences(originReferences, pivot, origin);
  createIntermediateTableReferences(targetReferences, pivot, target);
  
  const relationShip = new Relationship(name, Relationship.TYPES.manyToMany);
  relationShip.setPivot(pivot);

  target.appendPivots(pivot);
  //just target get pivot because it will be registered just one time
  target.appendRelation(relationShip);
  origin.appendRelation(relationShip);
}

module.exports = { createManyToManyRelation };
