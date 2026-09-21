const ELEMENT_VALUE_TYPE = Symbol.for('@duckBuilder.types.ELEMENTS.VALUE');

const ST = Object.freeze({
  table: 'TABLE_STRUCTURE',
  column: 'COLUMN_STRUCTURE',
  constraint: 'CONSTRAINT_STRUCTURE',
  relationship: 'RELATIONSHIP_STRUCTURE',
  type: 'TYPE_STRUCTURE',
});

function isColumn(target) {
  if (typeof target !== 'object' || target === null) return false;
  return target[ELEMENT_VALUE_TYPE] === ST.column;
}

function isTable(target) {
  if (typeof target !== 'object' || target === null) return false;
  return target[ELEMENT_VALUE_TYPE] === ST.table;
}

function isConstraint(target) {
  if (typeof target !== 'object' || target === null) return false;
  return target[ELEMENT_VALUE_TYPE] === ST.constraint;
}

function isRelationship(target) {
  if (typeof target !== 'object' || target === null) return false;
  return target[ELEMENT_VALUE_TYPE] === ST.relationship;
}

function isType(target) {
  if (typeof target !== 'object' || target === null) return false;
  return target[ELEMENT_VALUE_TYPE] === ST.type;
}

module.exports = {
  ELEMENT_VALUE_TYPE,  
  ST,
  isColumn,
  isTable,
  isConstraint,
  isRelationship,
  isType
};