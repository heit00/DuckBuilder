const { isValue, isColumn, isQuery, isRaw, IT, IR } = require('../symbol-lockup/symbols');
const { QuerySyntaxError } = require('../util/error');
const { Bind } = require('../lexicalStructures/bind');
const { QueryGrammar } = require('../grammar/grammar');
const { Column } = require('../lexicalStructures/column');

class ValuesStructure {
    #data = [];
    #type = undefined;
    #lastSize = undefined;

    get valuesMetaSet() {
        if (this.#type === undefined) return {
            type: this.#type,
            size: 0
        };
        if (this.#type === IT.pattern) return {
            type: this.#type,
            size: this.#lastSize
        };
        if (this.#type === IT.select.instance) {
            if (this.#data[0].action !== QueryGrammar.actions.select) throw new QuerySyntaxError('Can not has non-select statement in INSERT-SELECT statement.');

            const size = this.#data[0].selectColumns.length;
            const obj = {
                type: this.#type
            };

            if (!this.#data[0].selectColumns.some(el => el.name === '*')) obj.size = size;

            return obj;
        }
        if (this.#type === IT.select.raw) {
            return {
                type: this.#type
            }
        }
        else throw new Error('not supported yet.');
    }

    #normalizeValue(value) {
        if (isColumn(value)) throw new QuerySyntaxError('can not has column at insert.');
        else if (isValue(value)) return value;
        else return new Bind(value);
        //if is structure: ERROR
    }

    values(...values) {
        if (values.length === 1 && Array.isArray(values[0])) values = values[0];
        if (values.length === 0) throw new QuerySyntaxError('can not has empty values array. use toInstruct');
        if (values.length !== this.#lastSize && this.#lastSize !== undefined) throw new QuerySyntaxError("difference between values array size is not allowed.");
        const valuesMapped = values.map(el => this.#normalizeValue(el));

        if (this.#type !== IT.pattern && this.#type !== undefined) throw new QuerySyntaxError('can not has values and select struture at same time.');
        this.#type = IT.pattern;

        if (this.#lastSize === undefined) this.#lastSize = values.length;

        this.#data.push(valuesMapped);
        return this;
    }

    select(query) {
        if (!isQuery(query) && !isRaw(query)) throw new TypeError('you can only use raw and query objects.');
        if (this.#data.length > 0) throw new QuerySyntaxError('some operation has been already registered.');
        if (!Object.values(IT.select).includes(this.#type) && this.#type !== undefined) throw new QuerySyntaxError('can not has values and select struture at same time.');

        if (isQuery(query))
            this.#type = IT.select.instance;
        else this.#type = IT.select.raw;

        this.#data[0] = query;
        return this;
    }

    toInstruction(count) {
        if (this.#type === undefined) {
            const def = QueryGrammar.extra.default;
            const val = QueryGrammar.clauses.values;
            return `${def} ${val}`;
        }
        if (this.#type === IT.pattern) {
            const verb = QueryGrammar.clauses.values;
            const values = `(${this.#data.map(el1 => el1.map(el2 => el2.toInstruction(count, IR.cte)).join(', ')).join('), (')})`;

            return `${verb} ${values}`;
        }
        if (Object.values(IT.select).includes(this.#type)) {
            const select = this.#data[0].toInstruction(count, IR.insert);
            return select;
        }
        else throw new Error('internal builder fail.');
    }
}

class InsertStructure {
    #columns = [];
    #values = new ValuesStructure();
    #conflict = undefined;

    #normalizeColumn(column) {
        let obj;

        if (isColumn(column) || isRaw(column)) obj = column;
        else obj = new Column(column);

        if (isColumn(obj) && (obj.hasAlias() || obj.hasTable())) throw new QuerySyntaxError('can not has alias or table prefix in INSERT structure.');
        return obj;
    }

    columns(...columns) {
        if (columns.length === 1 && Array.isArray(columns[0])) columns = columns[0];

        const temp = columns.map(
            el => this.#normalizeColumn(el)
        )

        this.#columns = [...this.#columns, ...temp];

        return this;
    }

    values(...values) {
        this.#values.values(...values);
        return this;
    }

    select(query) {
        this.#values.select(query);
        return this;
    }

    toInstruction(count) {
        const meta = this.#values.valuesMetaSet;
        const valuesSet = this.#values;
        const columnsSet = this.#columns;

        if (meta.type === undefined || meta.type === IT.pattern) {
            if (columnsSet.length !== meta.size) throw new QuerySyntaxError(`invalid size equality: ${meta.size} != ${columnsSet.length}`);

        }
        else if (meta.type === IT.select.instance) {
            if (meta.size !== undefined && columnsSet.length !== meta.size && columnsSet.length !== 0) throw new QuerySyntaxError(`invalid size equality: ${meta.size} != ${columnsSet.length}`);

        }
        else if (meta.type === IT.select.raw) {

        }

        else throw new Error('not supported yet');

        const columns = columnsSet.map(el => el.toInstruction(count)).join(', ');
        const values = valuesSet.toInstruction(count);
        let encapsuledColumns;

        if (meta.type === undefined || meta.type === IT.pattern) {
            encapsuledColumns = meta.type === undefined ? '' : `(${columns}) `;
        }
        else if (meta.type === IT.select.instance) {
            encapsuledColumns = columnsSet.length !== 0 ? `(${columns}) ` : '';
        }
        else if (meta.type === IT.select.raw) {
            encapsuledColumns = columnsSet.length !== 0 ? `(${columns}) ` : '';
        }

        return `${encapsuledColumns}${values}`;
    }
}

module.exports = { InsertStructure };