const { T } = require('./util/types');

const {
    QUERY_VALUE_TYPE,
    QT,
    IR,
    isQuery,
    isCase,
    isColumn,
    isValue,
    isTable,
    isOrderBy,
} = require('./symbol-lockup/symbols');

const {QueryGrammar} = require('./grammar/grammar');
const {Column} = require('./lexicalStructures/column');
const {QuerySyntaxError} = require('./util/error');
const {Bind} = require('./lexicalStructures/bind');
const {TemplateCount} = require('./util/template');
const {CaseClause} = require('./clauseStructures/case');
const {WhereClause} = require('./clauseStructures/where');
const { JoinClause } = require('./clauseStructures/join');
const { WithClause } = require('./clauseStructures/with');
const { OrderBy } = require('./clauseStructures/orderBy');
const { Table } = require('./lexicalStructures/table');
const { SetStructure} = require('./clauseStructures/updateSet');

class Query {

    //NOTE: ADD anti-action-wrong system like: delete().join();

    get [QUERY_VALUE_TYPE]() { return QT.query; }

    #using = [];
    #returningColumns = [];
    #with = new WithClause();
    #alias = undefined;
    #limit = undefined;
    #offset = undefined;
    #distinct = undefined;
    #fromTables = [];
    #selectColumns = [];
    #action = undefined;
    #orderBy = [];
    #join = [];
    #where = new WhereClause();
    #groupBy = [];
    #having = new WhereClause();
    #updateTable = undefined;
    #updateSets = new SetStructure();

    static column(name, alias) {
        return new Column(name, alias);
    }

    static bind(value) {
        return new Bind(value);
    }

    static table(name) {
        return new Table(name);
    }

    static case(alias, initial){
        return new CaseClause(alias, initial);
    }

    #set(action){
        action = action?.toUpperCase();
        if(!Object.values(QueryGrammar.actions).includes(action)) throw new TypeError(`action must be  in: (${Object.values(QueryGrammar.actions).join(', ')})`);

        //...implements AFTER all builder complete actions

    }

    hasAlias() {
        return this.#alias !== undefined;
    }

    select(...columns) {
        if (!this.#action || this.#action === QueryGrammar.actions.select) this.#action = QueryGrammar.actions.select;
        else throw new QuerySyntaxError(`a action is already registered: (${this.#action})`);
        //clear()

        if (columns.length === 1 && Array.isArray(columns[0])) columns = columns[0];

        this.#selectColumns = [...this.#selectColumns, ...columns.map(el => {
            if (T.v.filledString.func(el)) return new Column(el);
            if (isValue(el)) return el;
            throw new TypeError('columns must contains valid column representations.');
        })];

        return this;
    }

    update(table){
        if (!this.#action || this.#action === QueryGrammar.actions.update) this.#action = QueryGrammar.actions.update;
        else throw new QuerySyntaxError(`a action is already registered: (${this.#action})`);
        //clear()

        if(T.v.filledString.func(table)) table = new Table(table);
        else if(!(isTable(table))) throw new QuerySyntaxError('table must be a string or table instance.');

        this.#updateTable = table;

        return this;
    }

    set(left, right){
        this.#updateSets.set(left, right);

        return this;
    }

    from(...tables) {
        if (tables.length === 1 && Array.isArray(tables[0])) tables = tables[0];

        this.#fromTables = [...this.#fromTables, ...tables.map(el => {
            if (T.v.filledString.func(el)) return new Table(el);
            if (isTable(el)) return el;
            if (isQuery(el)) return el;
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

    #addJoin(type, table, left, operator, right) {
        if (right === undefined && typeof left === 'string') {
            right = operator;
            operator = '=';
        }

        if (T.v.filledString.func(table)) table = new Table(table);
        else if (!(isTable(table)) && !(isQuery(table))) throw new TypeError('table must be a string, instance of Table class. or instance of Query');
        const joinClause = new JoinClause(table, type);

        if (type === QueryGrammar.joinTypes.crossJoin) {
            //Dont need config
        }
        //else if ((T.v.filledString.func(left))) {
            //if (!QueryGrammar.relationalOperators.has(operator)) throw new QuerySyntaxError(`operator must be in: (${[...QueryGrammar.relationalOperators].join(', ')})`);
           // if (!T.v.filledString.func(right)) throw new TypeError('right must be a string.');
            //joinClause.on(left, operator, right);
        //}
        else if (T.v.callable.func(left)) {
            //operator and right are ignored
            const func = left;
            func(joinClause);
        }
        else {
            //if (!QueryGrammar.relationalOperators.has(operator)) throw new QuerySyntaxError(`operator must be in: (${[...QueryGrammar.relationalOperators].join(', ')})`);
            //if (!T.v.filledString.func(right)) throw new TypeError('right must be a string.');
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

    delete() {
        if (!this.#action) this.#action = QueryGrammar.actions.delete;
        else throw new QuerySyntaxError(`a action is already registered: (${this.#action})`);

        return this;
    }

    using(...table) {
        if (table.length === 1 && Array.isArray(table[0])) table = table[0];
        this.#using = [... this.#using, ...table.map(el => {
            if (T.v.filledString.func(el)) return new Table(el);
            else if (isTable(el)) return el;
            else if (isQuery(el)) return el;
            else throw new TypeError('table elements must be an string or table class instance.');
        })];
        return this;
    }

    #addHaving(left, operator, right, type) {
        if (right === undefined) {
            right = operator;
            operator = '=';
        }
        if (type === QueryGrammar.logicalOperator.and) {
            this.#having.add(left, operator, right);
        }
        else if (type === QueryGrammar.logicalOperator.or) {
            this.#having.addOr(left, operator, right);
        }
        else throw new TypeError(`type must be in: (${Object.values(QueryGrammar.logicalOperator).join(', ')})`);
        return this;
    }

    #addHavingGroup(callBack, type) {
        if (!T.v.callable.func(callBack)) throw new TypeError('callback must be calleable.');
        if (type === QueryGrammar.logicalOperator.and)
            this.#having.addGroup(callBack);
        else if (type === QueryGrammar.logicalOperator.or)
            this.#having.addGroupOr(callBack);
        else throw new TypeError(`type must be in: (${Object.values(QueryGrammar.logicalOperator).join(', ')})`);
        return this;
    }

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
            else if ((isColumn(el)) || (isCase(el)) || (isQuery(el))) this.#orderBy.push(new OrderBy(el));
            else throw new TypeError('column must contain strings , Columns or OrderBy instances.');
        });
        return this;
    }

    groupBy(...columns) {
        if (columns.length === 1 && Array.isArray(columns[0])) columns = columns[0];
        columns.forEach(el => {
            if ((isColumn(el)) || (isCase(el))) {
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

    as(alias) {
        if (!T.v.filledString.func(alias)) throw new TypeError('alias must be an string.');
        this.#alias = alias;

        return this;
    }

    returning(...columns) {
        if (columns.length === 1 && Array.isArray(columns[0])) columns = columns[0];

        const returnColumns = columns.map(el => {
            if ((isColumn(el)) || (isCase(el)) || (isQuery(el))) return el;
            else if (T.v.filledString.func(el)) return new Column(el);
            else throw new TypeError('el must be a column instance a string or a case instance.');
        });

        this.#returningColumns = [...this.#returningColumns, ...returnColumns];
        return this;
    }

    with(qb, alias) {
        this.#with.add(qb, alias);
        return this;
    }

    #buildWith(count) {
        if (this.#with.isEmpty()) return '';
        const verb = QueryGrammar.clauses.with;

        return `${verb} ${this.#with.toInstruction(count)}`;
    }

    //SELECT
    #buildSelect(count) {

        const distinct = this.#distinct ? QueryGrammar.clauses.distinct : undefined;

        let str1 = QueryGrammar.actions.select;
        if (distinct !== undefined) str1 = `${str1} ${QueryGrammar.clauses.distinct}`;

        const columns = this.#selectColumns.map(el => el.toInstruction(count, IR.subQuery)).join(', ');

        return [str1, columns.length === 0 ? '*' : columns].join(' ');
    }

    #buildJoin(count) {
        if (this.#join.length === 0) return '';
        if(this.#fromTables.length !== 1) throw new QuerySyntaxError('in join clauses, one FROM need to be used.');

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
        if (this.#action !== QueryGrammar.actions.select) throw new QuerySyntaxError('limit must be only in select clause.');
        const verb = QueryGrammar.clauses.limit;

        return `${verb} ${this.#limit}`;
    }

    #buildOffset() {
        if (this.#offset === undefined) return '';
        if (this.#action !== QueryGrammar.actions.select) throw new QuerySyntaxError('offset must be only in select clause.');
        const verb = QueryGrammar.clauses.offSet;

        return `${verb} ${this.#offset}`;
    }

    #buildReturning(count) {
        if (this.#returningColumns.length === 0) return '';
        if (this.#action === QueryGrammar.actions.select) throw new QuerySyntaxError('returning in SQL is invalid.');
        const verb = QueryGrammar.clauses.returning;

        const column = this.#returningColumns.map(el => el.toInstruction(count, IR.subQuery)).join(', ');

        return `${verb} ${column}`;
    }

    //SELECT | DELETE
    #buildFrom(count) {
        if(this.#fromTables.length === 0) return '';
        
        //else if (this.#join.length > 0) throw new QuerySyntaxError('in join clause, all tables must be defined in .join method.');

        const verb = QueryGrammar.clauses.from;

        if (this.#action === QueryGrammar.actions.delete) {
            if (this.#fromTables.length > 1) throw new QuerySyntaxError('in delete actio, just 1 table can be defined.');
            const table = this.#fromTables[0];
            if (isQuery(table)) throw new QuerySyntaxError('subQuery is now allowed in delete clause.');


            return [verb, table.toInstruction()].join(' ');
        }

        else {
            const tables = this.#fromTables.map(el => el.toInstruction(count, IR.subQuery)).join(', ');
            return [verb, tables].join(' ');
        }

    }

    //DELETE
    #buildDelete() {
        return QueryGrammar.actions.delete
    }

    #buildUsing(count) {
        if (this.#action !== QueryGrammar.actions.delete && this.#action !== QueryGrammar.actions.update) throw new QuerySyntaxError('actions must be update or delete to use using clause.');
        if (this.#using.length === 0) return '';
        const verb = QueryGrammar.clauses.using;
        const usingTables = this.#using.map(el => el.toInstruction(count, IR.subQuery));

        return `${verb} ${usingTables.join(', ')}`;
    }

    //COMPILERS

    #compileSelect(count) {
        const steps = [
            this.#buildWith(count),
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

    #compileDelete(count) {
        const steps = [
            this.#buildWith(count),
            this.#buildDelete(),
            this.#buildFrom(count),
            this.#buildUsing(count),
            this.#buildWhere(count),
            this.#buildReturning(count)
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
            if (this.#action !== QueryGrammar.actions.select) throw new QuerySyntaxError('in subStatement action must be select.');
            const alias = this.#alias ? ` ${QueryGrammar.extra.as} ${this.#alias}` : '';
            const finalStr = `(${this.#toInstruction(count).template})${alias}`;
            return finalStr;
        }
        else if (mode === IR.cte) {
            if (this.#action !== QueryGrammar.actions.select) throw new QuerySyntaxError('in subStatement action must be select.');
            const finalStr = `(${this.#toInstruction(count).template})`;

            return finalStr;
        }
        else throw new QuerySyntaxError(`Unsupported render mode: ${mode}`);
    }

    #toInstruction(count) {
        if (!count)
            count = new TemplateCount();
        if (this.#action === QueryGrammar.actions.select) {
            const template = this.#compileSelect(count);
            const values = count.getLiterals();
            return { template, values };
        }
        else if (this.#action === QueryGrammar.actions.delete) {
            const template = this.#compileDelete(count);
            const values = count.getLiterals();
            return { template, values };
        }
        else throw new Error('sorry i did not created others still :D');
        //...
    }

}

module.exports = Query;