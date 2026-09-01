const QUERY_VALUE_TYPE = Symbol.for('@duckBuilder.types.VALUE');
const QUERY_STRUCTURE_TYPE = Symbol.for('@duckBuilder.types.STRUCTURE');
const QUERY_INTERNAL_TYPE = Symbol.for('@duckBuilder.types.INTERNAL');
const QUERY_GENERIC_TYPE = Symbol.for('@duckBuilder.types.GENERIC');
const QUERY_SPECIFIC_VALUE_TYPE = Symbol.for('@duckBuilder.types.SPECIFIC_VALUE');

const QT = {
    query: 'QUERY_STRUCTURE',
    select: 'QUERY_SELECT_STRUCTURE',
    case: 'CASE_CLAUSE',
    column: 'COLUMN_STRUCTURE',
    table: 'TABLE_STRUCTURE',
    bind: 'BIND_STRUCTURE',
    orderBy: 'ORDER_BY_STRUCTURE',
    with: 'WITH_STRUCTURE',
    template: 'TEMPLATE_STRUCTURE',
    function: 'SQL_FUNCTION_STRUCTURE',
    raw: 'RAW_GENERIC_STRUCTURE'
};

const SQL_FUNCTIONS = {
    count: 'COUNT',
    coalesce: 'COALESCE',
    max: 'MAX',
    min: 'MIN',
    sum: 'SUM',
    now: 'NOW',
    avg: 'AVG',
}

const IR = {
    subQuery: 'SUBQUERY',
    statement: 'STATEMENT',
    cte: 'CTE',
    cteStruct: 'CTE_STRUCT',
    insert: 'INSERT'
};

const IT = {
    pattern: 'PATETRN',
    select: {
        instance: 'SELECT',
        raw: 'RAW'
    }, 
}

function isQuery(target) {
    if (typeof target !== 'object' || target === null) return false;
    return target[QUERY_VALUE_TYPE] === QT.query;
}

function isSelect(target) {
     if (typeof target !== 'object' || target === null) return false;
    return target[QUERY_SPECIFIC_VALUE_TYPE] === QT.select;
}

function isCase(target) {
    if (typeof target !== 'object' || target === null) return false;
    return target[QUERY_VALUE_TYPE] === QT.case;
}

function isColumn(target) {
    if (typeof target !== 'object' || target === null) return false;
    return target[QUERY_VALUE_TYPE] === QT.column;
}

function isBind(target) {
    if (typeof target !== 'object' || target === null) return false;
    return target[QUERY_VALUE_TYPE] === QT.bind;
}

function isValue(target) {
    if (typeof target !== 'object' || target === null) return false;
    return (target[QUERY_VALUE_TYPE] !== undefined) || (target[QUERY_GENERIC_TYPE] === QT.raw);
}

function isStructure(target) {
    if (typeof target !== 'object' || target === null) return false;
    return target[QUERY_VALUE_TYPE] !== undefined || target[QUERY_GENERIC_TYPE] !== undefined
    || target[QUERY_INTERNAL_TYPE] !== undefined || target[QUERY_VALUE_TYPE] !== undefined;
}

function isFunction(target) {
    if (typeof target !== 'object' || target === null) return false;
    return target[QUERY_VALUE_TYPE] === QT.function;
}

function isTable(target) {
    if (typeof target !== 'object' || target === null) return false;
    return target[QUERY_STRUCTURE_TYPE] === QT.table;
}

function isOrderBy(target) {
    if (typeof target !== 'object' || target === null) return false;
    return target[QUERY_STRUCTURE_TYPE] === QT.orderBy;
}

function isWith(target) {
    if (typeof target !== 'object' || target === null) return false;
    return target[QUERY_STRUCTURE_TYPE] === QT.with;
}

function isTemplateCount(target) {
    if (typeof target !== 'object' || target === null) return false;
    return target[QUERY_INTERNAL_TYPE] === QT.template;
}

function isRaw(target){
    if (typeof target !== 'object' || target === null) return false;
    return target[QUERY_GENERIC_TYPE] === QT.raw;
}

function getSubQuerySizeColumns(target){
    
}

module.exports = {
    QUERY_VALUE_TYPE,
    QUERY_STRUCTURE_TYPE,
    QUERY_INTERNAL_TYPE,
    QUERY_GENERIC_TYPE,
    QUERY_SPECIFIC_VALUE_TYPE,
    QT,
    IR,
    IT,
    SQL_FUNCTIONS,
    isQuery,
    isCase,
    isColumn,
    isBind,
    isValue,
    isFunction,
    isStructure,
    isTable,
    isOrderBy,
    isWith,
    isTemplateCount,
    isRaw,
    isSelect
};