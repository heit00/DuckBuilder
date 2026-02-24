const { T } = require('../util/types');

const {
    QUERY_STRUCTURE_TYPE,
    QT,
    IR,
    isQuery,
    isCase,
    isColumn,
} = require('../symbol-lockup/symbols');

const {QueryGrammar} = require('../grammar/grammar');

const {Column} = require('../lexicalStructures/column');

const {QuerySyntaxError} = require('../util/error');

class OrderBy {

    get [QUERY_STRUCTURE_TYPE](){ return QT.orderBy }

    #column;
    #type;

    constructor(column, type = QueryGrammar.orderByTypes.asc) {
        if (typeof type === 'string') type = type.toUpperCase();
        if (T.v.filledString.func(column)) column = new Column(column);
        else if (!(isColumn(column)) && !(isCase(column)) && !(isQuery(column))) throw new TypeError('column must be a string, a instance of Column class or a caseClause instance.');

        if (typeof column.hasAlias === 'function' && column.hasAlias()) {
            throw new QuerySyntaxError('Expression cannot have an alias in order by clause.');
        }


        if (!Object.values(QueryGrammar.orderByTypes).includes(type)) throw new TypeError(`type must be in: (${Object.values(QueryGrammar.orderByTypes).join(', ')})`);

        this.#column = column;
        this.#type = type;
    }

    get column() {
        return this.#column;
    }

    get type() {
        return this.#type;
    }

    toInstruction(count) {
        const columnStr = this.#column.toInstruction(count, IR.cte);
        const type = this.#type;
        const finalStr = `${columnStr} ${type}`;

        return finalStr;
    }

}

module.exports = {OrderBy};