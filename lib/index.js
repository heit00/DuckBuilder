const {
    QUERY_VALUE_TYPE,
    QT,
} = require('./queryBuilder/symbol-lockup/symbols');

const { Column } = require('./queryBuilder/lexicalStructures/column');
const { Bind } = require('./queryBuilder/lexicalStructures/bind');
const { CaseClause } = require('./queryBuilder/clauseStructures/case');
const { WithClause } = require('./queryBuilder/clauseStructures/with');
const { OrderBy } = require('./queryBuilder/clauseStructures/orderBy');
const { Table } = require('./queryBuilder/lexicalStructures/table');
const { Count, Coalesce, Sum, Min, Max, Avg } = require('./queryBuilder/lexicalStructures/functions'); //ALL CUSTOM FUNCTIONS MUST BE REQUIRD HERE
const { Raw } = require('./queryBuilder/lexicalStructures/raw');
const { Select } = require('./queryBuilder/statements/select');
const { Update } = require('./queryBuilder/statements/update');
const { Delete } = require('./queryBuilder/statements/delete');
const { Insert } = require('./queryBuilder/statements/insert');

class Query {

    //NOTE: ADD anti-action-wrong system like: delete().join();

    get [QUERY_VALUE_TYPE]() { return QT.query; }

    static column(name, alias) {
        return new Column(name, alias);
    }

    static bind(value) {
        return new Bind(value);
    }

    static raw(raw, ...values) {
        return new Raw(raw, ...values);
    }

    static table(name, alias) {
        return new Table(name, alias);
    }

    static case(alias, initial) {
        return new CaseClause(alias, initial);
    }

    static order(column, order) {
        return new OrderBy(column, order);
    }

    static count(args, alias = undefined) {
        return new Count(args).as(alias);
    }

    static coalesce(args, alias = undefined) {
        return new Coalesce(args).as(alias)
    }

    static sum(args, alias = undefined) {
        return new Sum(args).as(alias);
    }

    static avg(args, alias = undefined) {
        return new Avg(args).as(alias);
    }

    static max(args, alias = undefined) {
        return new Max(args).as(alias);
    }

    static min(args, alias = undefined) {
        return new Min(args).as(alias);
    }

    select(...columns) {
        return new Select(...columns);
    }

    update(table) {
        return new Update(table);
    }

    insert(table) {
        return new Insert(table);
    }

    delete() {
        return new Delete();
    }
}

module.exports = Query;


/**
 * RAW:
 * WHERE OK
 * HAVING OK
 * ORDER BY - OK
 * GROUP BY - OK
 * JOIN OK
 * ...
 */