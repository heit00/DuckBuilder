/**
 * @deprecated manyToManyRelation foi migrado diretamente para TableSchema em ../elements/table.js.
 * Esta função foi mantida apenas para compatibilidade regressiva.
 */
function createManyToManyRelation(name, origin, target, originReferences, targetReferences, pivotName, pivot) {
  return origin.manyToManyRelation(name, target, originReferences, targetReferences, pivot, pivotName);
}

module.exports = { createManyToManyRelation };
