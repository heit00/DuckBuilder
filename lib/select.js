const { T } = require('./util/types');

const {
    QUERY_SPECIFIC_VALUE_TYPE,
    QT, 
    IR
} = require('./symbol-lockup/symbols');

const { QueryGrammar } = require('./grammar/grammar');
const { Column } = require('./lexicalStructures/column');
const { QuerySyntaxError } = require('./util/error');
const { Bind } = require('./lexicalStructures/bind');
const { TemplateCount } = require('./util/template');
const { CaseClause } = require('./clauseStructures/case');
const { WhereClause } = require('./clauseStructures/where');
const { JoinClause } = require('./clauseStructures/join');
const { WithClause } = require('./clauseStructures/with');
const { OrderBy } = require('./clauseStructures/orderBy');
const { Table } = require('./lexicalStructures/table');
const { SetStructure } = require('./clauseStructures/updateSet');
const { InsertStructure } = require('./clauseStructures/insert');
const { Count, Coalesce, Sum, Min, Max, Avg } = require('./lexicalStructures/functions'); //ALL CUSTOM FUNCTIONS MUST BE REQUIRD HERE
const { Raw } = require('./lexicalStructures/raw');



class Select{
    get [QUERY_SPECIFIC_VALUE_TYPE]() { return QT.select };

    #limit = undefined;
    #offset = undefined;
    #fromTables = [];
    #selectColumns = [];
    #groupBy = [];
    #orderBy = [];
    #join = [];
    #where = new WhereClause();
    #distinct = undefined;
    #having = new WhereClause();
    _with = new WithClause();

    get selectColumns() {
        return this.#selectColumns;
    }

    constructor(...columns) {
        if (columns.length === 1 && Array.isArray(columns[0])) columns = columns[0];

        this.#selectColumns = [...this.#selectColumns, ...columns.map(el => {
            if (T.v.filledString.func(el)) return new Column(el);
            if (isValue(el)) return el;
            throw new TypeError('columns must contains valid column representations.');
        })];

        return this;
    }

    hasAlias() {
        return this._alias !== undefined;
    }

    as(alias) {
            if (!T.v.filledString.func(alias)) throw new TypeError('alias must be an string.');
            this._alias = alias;
    
            return this;
    }

    from(...tables) {
        if (tables.length === 1 && Array.isArray(tables[0])) tables = tables[0];

        this.#fromTables = [...this.#fromTables, ...tables.map(el => {
            if (T.v.filledString.func(el)) return new Table(el);
            if (isTable(el)) return el;
            if (isQuery(el)) return el;
            if (isRaw(el)) return el;
            throw new TypeError('tables must contains valid table representation.');
        })];

        return this;
    }

    join(table, left, operator, right) {
        return this.#addJoin(QueryGrammar.joinTypes.innerJoin, table, left, operator, right);
    }

    leftJoin(table, left, operator, right) {
        return this.#addJoin(QueryGrammar.joinTypes.leftJoin, table, left, operator, right);
    }

    rightJoin(table, left, operator, right) {
        return this.#addJoin(QueryGrammar.joinTypes.rightJoin, table, left, operator, right);
    }

    crossJoin(table) {
        return this.#addJoin(QueryGrammar.joinTypes.crossJoin, table);
    }

    fullJoin(table, left, operator, right) {
        return this.#addJoin(QueryGrammar.joinTypes.fullOuterJoin, table, left, operator, right);
    }

    joinRaw(raw, ...values) {
        const jr = new Raw(raw, ...values);
        this.#join.push(jr);
        return this;
    }

    #addJoin(type, table, left, operator, right) {
        
        if (T.v.filledString.func(table)) table = new Table(table);
        else if (!(isTable(table)) && !(isQuery(table)) && !(isRaw(table))) throw new TypeError('table must be a string, instance of Table class. or instance of Query');
        const joinClause = new JoinClause(table, type);

        if (type === QueryGrammar.joinTypes.crossJoin) {
            //Dont need config
        }
        else if (T.v.callable.func(left)) {
            //operator and right are ignored
            const func = left;
            func(joinClause);
        }
        else {
            joinClause.on(left, operator, right);
        }

        this.#join.push(joinClause);
        return this;
    }

    //
    where(left, operator, right) {
        this.#where.where(left, operator, right);
        return this;
    }

    //
    whereBetween(left, [min, max]) {
        this.#where.whereBetween(left, [min, max]);
        return this;
    }

    //
    orWhereBetween(left, [min, max]) {
        this.#where.orWhereBetween(left, [min, max]);
        return this;
    }

    //
    whereExists(query) {
        this.#where.whereExists(query);
        return this;
    }

    //
    orWhereExists(query) {
        this.#where.orWhereExists(query);
        return this;
    }

    whereIn(left, right) {
        this.#where.whereIn(left, right);
        return this;
    }

    orWhereIn(left, right) {
        this.#where.orWhereIn(left, right);
        return this;
    }

    whereNotIn(left, right) {
        this.#where.whereNotIn(left, right);
        return this;
    }

    orWhereNotIn(left, right) {
        this.#where.orWhereNotIn(left, right);
        return this;
    }

    //
    orWhere(left, operator, right) {
        this.#where.orWhere(left, operator, right);
        return this;
    }

    whereGroup(callBack) {
        this.#where.whereGroup(callBack);
        return this;
    }

    orWhereGroup(callBack) {
        this.#where.orWhereGroup(callBack);
        return this;
    }

    //WHERE RAW<<<<<<<<<<<<<<<<<<<<<<
    whereRaw(raw, ...values) {
        this.#where.whereRaw(raw, ...values);
        return this;
    }

    orWhereRaw(raw, ...values) {
        this.#where.orWhereRaw(raw, ...values);
        return this;
    }

    having(left, operator, right) {
        return this.#addHaving(left, operator, right, QueryGrammar.logicalOperator.and);
    }

    havingGroup(callBack) {
        return this.#addHavingGroup(callBack, QueryGrammar.logicalOperator.and);
    }

    orHavingGroup(callBack) {
        return this.#addHavingGroup(callBack, QueryGrammar.logicalOperator.or);
    }

    orHaving(left, operator, right) {
        return this.#addHaving(left, operator, right, QueryGrammar.logicalOperator.or);
    }

    with(qb, alias) {
            this._with.add(qb, alias);
            return this;
        }
    
    _buildWith(count) {
            if (this._with.isEmpty()) return '';
            const verb = QueryGrammar.clauses.with;
    
            return `${verb} ${this._with.toInstruction(count)}`;
    }

    #addHaving(left, operator, right, type) {

        /*
            if (right === undefined && operator !== undefined) {
                right = operator;
                operator = '=';
            }
        */

        if (type === QueryGrammar.logicalOperator.and) {
            if (T.v.callable.func(left)) {
                left(this.#having);
                return this;
            }
            this.#having.where(left, operator, right);
        }
        else if (type === QueryGrammar.logicalOperator.or) {
            this.#having.orWhere(left, operator, right);
        }
        else throw new TypeError(`type must be in: (${Object.values(QueryGrammar.logicalOperator).join(', ')})`);
        return this;
    }

    #addHavingGroup(callBack, type) {
        if (!T.v.callable.func(callBack)) throw new TypeError('callback must be calleable.');
        if (type === QueryGrammar.logicalOperator.and)
            this.#having.whereGroup(callBack);
        else if (type === QueryGrammar.logicalOperator.or)
            this.#having.orWhereGroup(callBack);
        else throw new TypeError(`type must be in: (${Object.values(QueryGrammar.logicalOperator).join(', ')})`);
        return this;
    }

    //RAW<<<<<<<<<<<<<<<<<<

    havingRaw(raw, ...values) {
        return this.#addHavingRaw(QueryGrammar.logicalOperator.and, raw, values);
    }

    orHavingRaw(raw, ...values) {
        return this.#addHavingRaw(QueryGrammar.logicalOperator.or, raw, values);
    }

    #addHavingRaw(type, raw, values) {
        if (type === QueryGrammar.logicalOperator.and) {
            this.#having.whereRaw(raw, ...values);
        }
        else if (type === QueryGrammar.logicalOperator.or) {
            this.#having.orWhereRaw(raw, ...values);
        }
        else throw new TypeError(`type must be in: (${Object.values(QueryGrammar.logicalOperator).join(', ')})`);
        return this;
    }

    //<<<<<<<<<<<<<<<<<<<<<

    distinct() {
        this.#distinct = QueryGrammar.clauses.distinct;
        return this;
    }

    orderBy(...columns) {
        if (columns.length === 1 && Array.isArray(columns[0])) columns = columns[0];
        columns.forEach(el => {
            if (isOrderBy(el)) {
                this.#orderBy.push(el);
            } else if (T.v.filledString.func(el)) this.#orderBy.push(new OrderBy(el));
            else if ((isColumn(el)) || (isCase(el)) || (isQuery(el)) || (isRaw(el))) this.#orderBy.push(new OrderBy(el));
            else throw new TypeError('column must contain strings , Columns or OrderBy instances.');
        });
        return this;
    }

    orderByRaw(raw, ...values) {
        const rawO = new Raw(raw, ...values);
        this.#orderBy.push(rawO);
        return this;
    }

    groupByRaw(raw, ...values) {
        const rawG = new Raw(raw, ...values);
        this.#groupBy.push(rawG);
        return this;
    }

    groupBy(...columns) {
        if (columns.length === 1 && Array.isArray(columns[0])) columns = columns[0];
        columns.forEach(el => {
            if ((isColumn(el)) || (isCase(el)) || (isRaw(el))) {
                if (el.hasAlias()) throw new QuerySyntaxError('groupBy does not allow alias in columns or cases clauses.');
                this.#groupBy.push(el);
            } else if (T.v.filledString.func(el)) this.#groupBy.push(new Column(el));
            else throw new TypeError('column must contain strings , Columns instances or cases instances.');
        });
        return this;
    }

    limit(number) {
        if (!Number.isInteger(number) || number <= 0) throw new TypeError('number must be a integer > 0.');
        this.#limit = number;
        return this;
    }

    offset(number) {
        if (!Number.isInteger(number) || number < 0) throw new TypeError('number must be a integer > 0.');
        this.#offset = number;
        return this;
    }

    #buildSelect(count) {

        const distinct = this.#distinct ? QueryGrammar.clauses.distinct : undefined;

        let str1 = QueryGrammar.actions.select;
        if (distinct !== undefined) str1 = `${str1} ${QueryGrammar.clauses.distinct}`;

        const columns = this.#selectColumns.map(el => el.toInstruction(count, IR.subQuery)).join(', ');

        return [str1, columns.length === 0 ? '*' : columns].join(' ');
    }

    #buildJoin(count) {
        if (this.#join.length === 0) return '';
        if (this.#fromTables.length !== 1) throw new QuerySyntaxError('in join clauses, one FROM need to be used.');

        const joins = this.#join.map(el => el.toInstruction(count)).join(' ');
        return joins;
    }

    #buildWhere(count) {
        if (this.#where.isEmpty()) return '';
        return [QueryGrammar.clauses.where, this.#where.toInstruction(true, count)].join(' ');
    }

    #buildGroupBy(count) {
        if (this.#groupBy.length === 0) return '';
        const verb = QueryGrammar.clauses.groupBy;
        const groupByArray = this.#groupBy.map(el => el.toInstruction(count));
        return `${verb} ${groupByArray.join(', ')}`;
    }

    #buildHaving(count) {
        if (this.#having.isEmpty()) return '';
        if (this.#groupBy.length === 0) throw new QuerySyntaxError('having can not exist without group by');
        const whereHaving = this.#having.toInstruction(true, count);
        const verb = QueryGrammar.clauses.having;

        return `${verb} ${whereHaving}`;
    }

    #buildOrderBy(count) {
        if (this.#orderBy.length === 0) return '';

        const orderBy = this.#orderBy.map(el => el.toInstruction(count)).join(', ');
        const verb = QueryGrammar.clauses.orderBy;
        return `${verb} ${orderBy}`;
    }

    #buildLimit() {
        if (this.#limit === undefined) return '';
        const verb = QueryGrammar.clauses.limit;

        return `${verb} ${this.#limit}`;
    }

    #buildOffset() {
        if (this.#offset === undefined) return '';
        const verb = QueryGrammar.clauses.offSet;

        return `${verb} ${this.#offset}`;
    }

    #buildFrom(count) {
        if (this.#fromTables.length === 0) return '';

        //else if (this.#join.length > 0) throw new QuerySyntaxError('in join clause, all tables must be defined in .join method.');

        const verb = QueryGrammar.clauses.from;


        
        const tables = this.#fromTables.map(el => el.toInstruction(count, IR.subQuery)).join(', ');
        return [verb, tables].join(' ');
        

    }

    #compileSelect(count) {
        const steps = [
            this._buildWith(count),
            this.#buildSelect(count),
            this.#buildFrom(count),
            this.#buildJoin(count),
            this.#buildWhere(count),
            this.#buildGroupBy(count),
            this.#buildHaving(count),
            this.#buildOrderBy(count),
            this.#buildLimit(),
            this.#buildOffset()
        ];

        const finalSteps = steps.filter(step => step && step.length > 0);
        return finalSteps.join(' ');
    }

    toInstruction(count, mode) {
        if (typeof mode === 'string') mode = mode.toUpperCase();
        if (mode && !Object.values(IR).includes(mode)) throw new QuerySyntaxError(`mode must be in: (${Object.values(IR).join(', ')})`);

        if (!mode) {
            return this.#toInstruction();
        }
        else if (mode === IR.subQuery) {
            const alias = this._alias ? ` ${QueryGrammar.extra.as} ${this._alias}` : '';
            const finalStr = `(${this.#toInstruction(count).template})${alias}`;
            return finalStr;
        }
        else if (mode === IR.cte) {
            //DELETE THIS IF BROKE
            if (this.hasAlias()) throw new QuerySyntaxError('can not has alias in CTE subquery type.');
            const finalStr = `(${this.#toInstruction(count).template})`;

            return finalStr;
        }
        else if (mode === IR.cteStruct) {
            if (this.hasAlias()) throw new QuerySyntaxError('can not has alias in CTE STRUCT query type.');
            const finalStr = `(${this.#toInstruction(count).template})`;

            return finalStr;
        }
        else if (mode === IR.insert) {
            //DELETE THIS IF BROKE
            if (this.hasAlias()) throw new QuerySyntaxError('can not has alias in insert subquery type.');
            const finalStr = `${this.#toInstruction(count).template}`;

            return finalStr;
        }
        else throw new QuerySyntaxError(`Unsupported render mode: ${mode}`);
    }

    #toInstruction(count) {
        if (!count)
            count = new TemplateCount();
        const template = this.#compileSelect(count);
        const values = count.getLiterals();
        return { template, values };
    }
}

module.exports = {
    Select
};