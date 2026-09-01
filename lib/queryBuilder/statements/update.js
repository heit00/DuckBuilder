const { T } = require('../util/types');

const {
    QUERY_SPECIFIC_VALUE_TYPE,
    QT,
    IR,
    isQuery,
    isCase,
    isColumn,
    isTable,
    isRaw,
} = require('../symbol-lockup/symbols');

const { QueryGrammar } = require('../grammar/grammar');
const { Column } = require('../lexicalStructures/column');
const { QuerySyntaxError } = require('../util/error');
const { TemplateCount } = require('../util/template');
const { WhereClause } = require('../clauseStructures/where');
const { WithClause } = require('../clauseStructures/with');
const { Table } = require('../lexicalStructures/table');
const { SetStructure } = require('../clauseStructures/updateSet');

class Update{
    get [QUERY_SPECIFIC_VALUE_TYPE]() { return QT.update };

    #updateTable = undefined; 
    #updateSets = new SetStructure(); 
    #fromTables = []; 
    #where = new WhereClause(); 
    #returningColumns = [];
    _with = new WithClause();

    constructor(table) {
        if (T.v.filledString.func(table)) table = new Table(table);
        else if (!(isTable(table)) && !(isRaw(table))) throw new QuerySyntaxError('table must be a string or table instance.');

        this.#updateTable = table;

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

    set(left, right) {
        this.#updateSets.set(left, right);
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
    //<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<

    returning(...columns) {
        if (columns.length === 1 && Array.isArray(columns[0])) columns = columns[0];

        const returnColumns = columns.map(el => {
            if ((isColumn(el)) || (isCase(el)) || (isQuery(el)) || (isRaw(el))) return el;
            else if (T.v.filledString.func(el)) return new Column(el);
            else throw new TypeError('el must be a column instance a string or a case instance.');
        });

        this.#returningColumns = [...this.#returningColumns, ...returnColumns];
        return this;
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

    #buildUpdate(count) {
        const str1 = QueryGrammar.actions.update;
        const str2 = this.#updateTable.toInstruction(count);
        return `${str1} ${str2}`;
    }

    #buildSets(count) {
        const str1 = this.#updateSets.toInstruction(count);
        return str1;
    }

    #buildWhere(count) {
        if (this.#where.isEmpty()) return '';
        return [QueryGrammar.clauses.where, this.#where.toInstruction(true, count)].join(' ');
    }

    #buildReturning(count) {
        if (this.#returningColumns.length === 0) return '';
        const verb = QueryGrammar.clauses.returning;

        const column = this.#returningColumns.map(el => el.toInstruction(count, IR.subQuery)).join(', ');

        return `${verb} ${column}`;
    }

    #buildFrom(count) {
        if (this.#fromTables.length === 0) return '';

        const verb = QueryGrammar.clauses.from;
        const tables = this.#fromTables.map(el => el.toInstruction(count, IR.subQuery)).join(', ');
        return [verb, tables].join(' ');
    }



    #compileUpdate(count) {
        const steps = [
            this._buildWith(count),
            this.#buildUpdate(count),
            this.#buildSets(count),
            this.#buildFrom(count),
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
            throw new QuerySyntaxError('in subStatement action must be select.');
        }
        else if (mode === IR.cte) {
            throw new QuerySyntaxError('in subStatement action must be select.');
        }
        else if (mode === IR.cteStruct) {
            if (this.#returningColumns.length === 0) throw new QuerySyntaxError('in CTE you need to return a data set.');
            if (this.hasAlias()) throw new QuerySyntaxError('can not has alias in CTE STRUCT query type.');
            const finalStr = `(${this.#toInstruction(count).template})`;
            return finalStr;
        }
        else if (mode === IR.insert) {
            throw new QuerySyntaxError('in subStatement action must be select.');
        }
        else throw new QuerySyntaxError(`Unsupported render mode: ${mode}`);
    }

    #toInstruction(count) {
        if (!count)
            count = new TemplateCount();

        const template = this.#compileUpdate(count);
        const values = count.getLiterals();
        return { template, values };


    }
}

module.exports = {
    Update
}