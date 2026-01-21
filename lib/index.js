const { T } = require('./types');

//FILE CHANGE PATH 
//1<
class QueryGrammar {
    static relationalOperators = new Set(['>', '<', '=', '!=', '<=', '>=', '<>', 'IN', 'IS', 'LIKE']);

    static extraClauses = {
        distinct: 'DISTINCT',
        offSet: 'OFFSET',
        limit: 'LIMIT',
        from: 'FROM',
        where: 'WHERE',
        groupBy: 'GROUP BY',
        orderBy: 'ORDER BY',
        having: 'HAVING'
    }

    static actions = {
        select: 'SELECT',
        insert: 'INSERT',
        delete: 'DELETE',
        update: 'UPDATE'
    }

    static joinTypes = {
        innerJoin: 'INNER JOIN',
        leftJoin: 'LEFT JOIN',
        rightJoin: 'RIGHT JOIN',
        fullOuterJoin: 'FULL OUTER JOIN',
        crossJoin: 'CROSS JOIN',
    };

    static logicalOperator = {
        or: 'OR',
        and: 'AND',
    };

    static orderByTypes = {
        asc: 'ASC',
        desc: 'DESC'
    }
}
//>
//

//INTERNAL
class Expression {
    #type;
    #left;
    #operator;
    #right;

    constructor(left, operator, right, type = 'AND') {
        if (typeof type === 'string') type = type.toUpperCase();
        if (!T.v.filledString.func(left) && !(left instanceof Column) && !(left instanceof Bind)) throw new TypeError('left must be a string, a column instance or a binder instance.');
        if (!QueryGrammar.relationalOperators.has(operator)) throw new TypeError(`operator must be in: (${[...QueryGrammar.relationalOperators].join(', ')})`);
        if (!T.v.filledString.func(right) && !(right instanceof Column) && !(right instanceof Bind)) throw new TypeError('right must be a string, a column instance or a binder instance.');
        if (!Object.values(QueryGrammar.logicalOperator).includes(type)) throw new TypeError(`type must be in: (${Object.values(QueryGrammar.logicalOperator).join(', ')})`);

        if (T.v.filledString.func(left)) this.#left = new Column(left);
        else this.#left = left
        if (T.v.filledString.func(right)) this.#right = new Column(right); //DEFAULT: COLUMN
        else this.#right = right;
        this.#type = type;
        this.#operator = operator;

        if (this.#left instanceof Column && this.#left.alias) {
            throw new SyntaxError('Columns inside an expression cannot have an alias.');
        }

        if (this.#right instanceof Column && this.#right.alias) {
            throw new SyntaxError('Columns inside an expression cannot have an alias.');
        }
    }

    //PLACE CHANGE 
    toInstruction(first = false, count) {
        if (typeof first !== 'boolean') throw new TypeError('first must be a boolean.');
        let preString;
        const leftInst = this.#left.toInstruction(count);
        const rightInst = this.#right.toInstruction(count);
        if (!first) preString = [this.#type, leftInst, this.#operator, rightInst];
        else preString = [leftInst, this.#operator, rightInst];
        return preString.join(' ');
    }
}

class Bind {
    #value;

    constructor(value) {
        if (value === undefined) throw new TypeError('value can not be undefined.');
        this.#value = value;
    }

    //PLACE CHANGE
    toInstruction(count) {
        if (!(count instanceof TemplateCount)) throw new TypeError('Bind count is required for compilation.');
        return `$${count.idx(this.#value)}`;
    }
}

class TemplateCount {
    #idx = 0;
    #values = [];

    idx(value) {
        this.#values.push(value);
        return ++this.#idx;
    }

    getLiterals() {
        return this.#values;
    }
}

class WhereClause {
    #type;
    #expressions = [];

    constructor(type = QueryGrammar.logicalOperator.and) {
        if (typeof type === 'string') type = type.toUpperCase();
        if (!Object.values(QueryGrammar.logicalOperator).includes(type)) throw new TypeError(`type must be in: (${Object.values(QueryGrammar.logicalOperator).join(', ')})`);
        this.#type = type;
    }

    isEmpty() {
        return this.#expressions.length <= 0;
    }

    add(left, operator, right) {
        return this.#add(left, operator, right, QueryGrammar.logicalOperator.and);
    }

    addOr(left, operator, right) {
        return this.#add(left, operator, right, QueryGrammar.logicalOperator.or);
    }

    #add(left, operator, right, type) {

        if(right === undefined){
            right = operator;
            operator = '=';
        }

        if (!(right instanceof Column) && !(right instanceof Bind)) right = new Bind(right);
        //IF is not a object o string the error will exploood in new Expression();

        const exp = new Expression(left, operator, right, type);
        this.#expressions.push(exp);
        return this;
    }

    addGroup(callBack) {
        return this.#addGroup(callBack, QueryGrammar.logicalOperator.and);
    }

    addGroupOr(callBack) {
        return this.#addGroup(callBack, QueryGrammar.logicalOperator.or);
    }

    #addGroup(callBack, type) {
        const subWhereClause = new WhereClause(type);
        if (!T.v.callable.func(callBack)) throw new TypeError('callBack ust be calleable.');
        callBack(subWhereClause);
        this.#expressions.push(subWhereClause);
        return this;
    }

    //PLACE CHANGE
    toInstruction(first = false, countObj) {
        if (this.#expressions.length === 0) throw new SyntaxError('conditions not initialized.');

        if (typeof first !== 'boolean') throw new TypeError('first must be a boolean.');
        const str = `${!first ? this.#type + ' ' : ''}(${this.#expressions.map((el, i) => {
            if (i === 0)
                return el.toInstruction(true, countObj);
            else return el.toInstruction(false, countObj);
        }).join(' ')})`;

        return str;
    }
}

class JoinClause {
    #table;
    #type;
    #whereClause = new WhereClause();

    constructor(table, type) {
        this.#table = (table instanceof Table) ? table : new Table(table);
        if (!Object.values(QueryGrammar.joinTypes).includes(type)) throw new SyntaxError(`type must be in: (${Object.values(QueryGrammar.joinTypes).join(', ')})`);
        this.#type = type;
    }

    get whereClause() {
        return this.#whereClause;
    }

    on(left, operator, right) {
        return this.#on(left, operator, right, QueryGrammar.logicalOperator.and);
    }

    onOr(left, operator, right) {
        return this.#on(left, operator, right, QueryGrammar.logicalOperator.or);
    }

    #on(left, operator, right, type) {
        if (right === undefined) {
            right = operator;
            operator = '=';
        }
        if (!(right instanceof Column) && !(right instanceof Bind)) right = new Column(right);
        if (type === QueryGrammar.logicalOperator.and) {
            this.#whereClause.add(left, operator, right);
        }
        else if (type === QueryGrammar.logicalOperator.or) {
            this.#whereClause.addOr(left, operator, right);
        }
        else throw new TypeError(`type must be in: (${Object.values(QueryGrammar.logicalOperator)})`);
        return this;
    }

    onGroup(callBack) {
        this.#whereClause.addGroup(callBack);
        return this;
    }

    onGroupOr(callBack) {
        this.#whereClause.addGroupOr(callBack);
        return this;
    }

    //PLACE CHANGE
    toInstruction(countObj) {
        const isCross = this.#type === QueryGrammar.joinTypes.crossJoin;

        if (this.#whereClause.isEmpty() && !isCross) throw new SyntaxError('on clause not found.');
        if (!this.#whereClause.isEmpty() && isCross) throw new SyntaxError('on clause in cross join is bad syntax.');

        const str = [];
        str.push(this.#type);
        str.push(this.#table.toInstruction());

        if (!isCross) {
            str.push('ON');
            str.push(this.#whereClause.toInstruction(true, countObj));
        }

        return str.join(' ');
    }
    //
}


class Column {
    #name;
    #alias;
    #table

    constructor(name, alias = undefined) {
        if (!T.v.filledString.func(alias) && alias !== undefined) throw new TypeError('alias must be undefined or a string.');
        if (typeof name !== 'string' || name.trim().length === 0) throw new SyntaxError('column must be an string.');
        const parts = name.split('.');
        if (parts.length > 2) throw new SyntaxError('namespace table must have 1 dot.');

        this.#table = parts.length > 1 ? parts[0] : undefined;
        this.#name = parts.length > 1 ? parts[1] : parts[0];
        this.#alias = alias;
    }

    get alias() {
        return this.#alias;
    }

    get name() {
        return this.#name;
    }

    get table() {
        {
            return this.#table;
        }
    }

    //PLACE CHANGE
    toInstruction() {

        const str1 = `"${this.#name}"`;
        const str2 = this.#table ? `"${this.#table}"` : '';
        const str3 = this.#alias ? ` AS "${this.#alias}"` : '';

        const finalStr = `${str2.trim().length > 0 ? str2 + '.' : ''}${str1}${str3}`;
        return finalStr;
    }
}

class OrderBy {
    #column;
    #type;

    constructor(column, type = QueryGrammar.orderByTypes.asc) {
        if (typeof type === 'string') type = type.toUpperCase();
        if (T.v.filledString.func(column)) column = new Column(column);
        else if (!(column instanceof Column)) throw new TypeError('column must be a string or instance of Column class.');

        if (column.alias !== undefined) throw new SyntaxError('column can not have alias in orderBy.');

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

    toInstruction() {
        const columnStr = this.#column.toInstruction();
        const type = this.#type;
        const finalStr = `${columnStr} ${type}`;

        return finalStr;
    }
}

class Table {
    #name;
    #alias
    constructor(name, alias = undefined) {
        if (!T.v.filledString.func(alias) && alias !== undefined) throw new TypeError('alias must be undefined or a string.');
        if (typeof name !== 'string' || name.trim().length === 0) throw new SyntaxError('column must be an string.');
        this.#name = name;
        this.#alias = alias;
    }


    toInstruction() {
        const str1 = `"${this.#name}"`;
        const str3 = this.#alias ? ` AS "${this.#alias}"` : '';

        const finalStr = `${str1}${str3}`;
        return finalStr;
    }
}

class QueryBuilder {

    /***
     *  ATRIBUTES ARE CREATED IN RUNTIME;
     */

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

    static column(name) {
        return new Column(name);
    }

    static bind(value) {
        return new Bind(value);
    }

    select(...columns) {
        if (!this.#action || this.#action === QueryGrammar.actions.select) this.#action = QueryGrammar.actions.select;
        else throw new SyntaxError(`a action is already registered: (${this.#action})`);

        if (columns.length === 1 && Array.isArray(columns[0])) columns = columns[0];

        this.#selectColumns = [...this.#selectColumns, ...columns.map(el => {
            if (T.v.filledString.func(el)) return new Column(el);
            if (el instanceof Column) return el;
            throw new TypeError('columns must contains valid column representations.');
        })]

        return this;
    }

    from(...tables) {

        if (!this.#action) this.#action = QueryGrammar.actions.select;

        if (this.#action !== QueryGrammar.actions.delete && this.#action !== QueryGrammar.actions.select) throw new SyntaxError('action must be select or delete.');

        if (tables.length === 1 && Array.isArray(tables[0])) tables = tables[0];

        this.#fromTables = [...this.#fromTables, ...tables.map(el => {
            if (T.v.filledString.func(el)) return new Table(el);
            if (el instanceof Table) return el;
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
        else if (!(table instanceof Table)) throw new TypeError('table must be a string or instance of Table class.');
        const joinClause = new JoinClause(table, type);

        if (type === QueryGrammar.joinTypes.crossJoin) {
            //Dont need config
        }
        else if ((T.v.filledString.func(left))) {
            if (!QueryGrammar.relationalOperators.has(operator)) throw new SyntaxError(`operator must be in: (${[...QueryGrammar.relationalOperators].join(', ')})`);
            if (!T.v.filledString.func(right)) throw new TypeError('right must be a string.');
            joinClause.on(left, operator, right);
        }
        else if (T.v.callable.func(left)) {
            //operator and right are ignored
            const func = left;
            func(joinClause);
        }
        else throw new TypeError('invalid argument structure.');

        this.#join.push(joinClause);
        return this;
    }

    where(left, operator, right) {
        this.#where.add(left, operator, right);
        return this;
    }

    orWhere(left, operator, right) {
        this.#where.addOr(left, operator, right);
        return this;
    }

    whereGroup(callBack) {
        this.#where.addGroup(callBack);
        return this;
    }

    orWhereGroup(callBack) {
        this.#where.addGroupOr(callBack);
        return this;
    }

    having(left, operator, right) {
        return this.#addHaving(left, operator, right, QueryGrammar.logicalOperator.and);
    }

    havingGroup(callBack) {
        return this.#addHavingGroup(callBack, QueryGrammar.logicalOperator.and);
    }

    havingGroupOr(callBack) {
        return this.#addHavingGroup(callBack, QueryGrammar.logicalOperator.or);
    }

    orHaving(left, operator, right) {
        return this.#addHaving(left, operator, right, QueryGrammar.logicalOperator.or);
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
        this.#distinct = QueryGrammar.extraClauses.distinct;
        return this;
    }

    orderBy(...columns) {
        if (columns.length === 1 && Array.isArray(columns[0])) columns = columns[0];
        columns.forEach(el => {
            if (el instanceof OrderBy) {
                this.#orderBy.push(el);
            } else if (T.v.filledString.func(el)) this.#orderBy.push(new OrderBy(el));
            else if (el instanceof Column) this.#orderBy.push(new OrderBy(el));
            else throw new TypeError('column must contain strings , Columns or OrderBy instances.');
        });
        return this;
    }

    groupBy(...columns) {
        if (columns.length === 1 && Array.isArray(columns[0])) columns = columns[0];
        columns.forEach(el => {
            if (el instanceof Column) {
                if (el.alias !== undefined) throw new SyntaxError('groupBy does not allow alias in columns.');
                this.#groupBy.push(el);
            } else if (T.v.filledString.func(el)) this.#groupBy.push(new Column(el));
            else throw new TypeError('column must contain strings , Columns instances.');
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

    //SELECT
    #buildSelect() {
        const distinct = this.#distinct ? QueryGrammar.extraClauses.distinct : undefined;

        let str1 = QueryGrammar.actions.select;
        if (distinct !== undefined) str1 = `${str1} ${QueryGrammar.extraClauses.distinct}`;

        const columns = this.#selectColumns.map(el => el.toInstruction()).join(', ');

        return [str1, columns.length === 0 ? '*' : columns].join(' ');
    }

    #buildFrom() {
        if (this.#fromTables.length === 0) return '';
        const verb = QueryGrammar.extraClauses.from;
        const tables = this.#fromTables.map(el => el.toInstruction()).join(', ');

        return [verb, tables].join(', ');
    }

    #buildJoin(count) {
        if (this.#join.length === 0) return '';

        const joins = this.#join.map(el => el.toInstruction(count)).join(' ');
        return joins;
    }

    #buildWhere(count) {
        if (this.#where.isEmpty()) return '';
        return [QueryGrammar.extraClauses.where, this.#where.toInstruction(true, count)].join(' ');
    }

    #buildGroupBy() {
        if (this.#groupBy.length === 0) return '';
        const verb = QueryGrammar.extraClauses.groupBy;
        const groupByArray = this.#groupBy.map(el => el.toInstruction());
        return `${verb} ${groupByArray.join(', ')}`;
    }

    #buildHaving(count) {
        if (this.#having.isEmpty()) return '';
        if (this.#groupBy.length === 0) throw new SyntaxError('having can not exist without group by');
        const whereHaving = this.#having.toInstruction(true, count);
        const verb = QueryGrammar.extraClauses.having;

        return `${verb} ${whereHaving}`;
    }

    #buildOrderBy() {
        if (this.#orderBy.length === 0) return '';

        const orderBy = this.#orderBy.map(el => el.toInstruction()).join(', ');
        const verb = QueryGrammar.extraClauses.orderBy;
        return `${verb} ${orderBy}`;
    }
    //

    #buildLimit() {
        if (this.#limit === undefined) return '';
        const verb = QueryGrammar.extraClauses.limit;

        return `${verb} ${this.#limit}`;
    }

    #buildOffset() {
        if (this.#offset === undefined) return '';
        const verb = QueryGrammar.extraClauses.offSet;

        return `${verb} ${this.#offset}`;
    }

    #compileSelect(count) {
        const steps = [
            this.#buildSelect(),
            this.#buildFrom(),
            this.#buildJoin(count),
            this.#buildWhere(count),
            this.#buildGroupBy(),
            this.#buildHaving(count),
            this.#buildOrderBy(),
            this.#buildLimit(),
            this.#buildOffset()
        ];

        const finalSteps = steps.filter(step => step && step.length > 0);
        return finalSteps.join(' ');
    }

    toInstruction() {
        const count = new TemplateCount();
        if (this.#action === QueryGrammar.actions.select) {
            const template = this.#compileSelect(count);
            const values = count.getLiterals();
            return { template, values };
        }
        else throw new Error('sorry i did not created others still :D');

    }
}

module.exports = QueryBuilder;
