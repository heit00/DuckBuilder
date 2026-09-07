const ELEMENT_VALUE_TYPE = Symbol.for('@duckBuilder.types.ELEMENTS.VALUE');

const ST = {
  table: 'TABLE_STRUCTURE',
  column: 'COLUMN_STRUCTURE'
};


function isColumn(target) {
    if (typeof target !== 'object' || target === null) return false;
    return target[ELEMENT_VALUE_TYPE] === ST.column;
}


function isTable(target) {
    if (typeof target !== 'object' || target === null) return false;
    return target[ELEMENT_VALUE_TYPE] === ST.table;
}


module.exports = {
  ELEMENT_VALUE_TYPE,  
  ST,
  isColumn,
  isTable
};