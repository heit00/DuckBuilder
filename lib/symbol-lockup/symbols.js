const QUERY_VALUE_TYPE = Symbol.for('@duckBuilder.types.VALUE');
const QUERY_STRUCTURE_TYPE = Symbol.for('@duckBuilder.types.STRUCTURE');
const QUERY_INTERNAL_TYPE = Symbol.for('@duckBuilder.types.INTERNAL');

const QT = {
    query: 'QUERY_STRUCTURE',
    case: 'CASE_CLAUSE',
    column: 'COLUMN_STRUCTURE',
    table: 'TABLE_STRUCTURE',
    bind: 'BIND_STRUCTURE',
    orderBy: 'ORDER_BY_STRUCTURE',
    with: 'WITH_STRUCTURE',
    template: 'TEMPLATE_STRUCTURE'
};

const IR = {
    subQuery: 'SUBQUERY',
    statement: 'STATEMENT',
    cte: 'CTE'
};

function isQuery(target) {
    if (typeof target !== 'object' || target === null) return false;
    return target[QUERY_VALUE_TYPE] === QT.query;
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
    return target[QUERY_VALUE_TYPE] !== undefined;
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

// Exportando tudo no final (estilo CJS)
module.exports = {
    QUERY_VALUE_TYPE,
    QUERY_STRUCTURE_TYPE,
    QUERY_INTERNAL_TYPE,
    QT,
    IR,
    isQuery,
    isCase,
    isColumn,
    isBind,
    isValue,
    isTable,
    isOrderBy,
    isWith,
    isTemplateCount
};