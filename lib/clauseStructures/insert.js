const { isValue, isColumn, isQuery, isRaw, IT, IR } = require('../symbol-lockup/symbols');
const { QuerySyntaxError } = require('../util/error');
const { Bind } = require('../lexicalStructures/bind');
const { QueryGrammar } = require('../grammar/grammar');
const { Column } = require('../lexicalStructures/column');
const { OnConflict } = require('./onConflict');

class SchemaStructure {
    #data = [];
    #type = undefined;
    #lastSize = undefined; // DEPRECATED
    #schema = [];

    get schema() {
        return this.#schema;
    }

    get valuesMetaSet() {
        if (this.#type === undefined) return {
            type: this.#type,
        };
        if (this.#type === IT.pattern) return {
            type: this.#type,
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

    #defineSchema(target) {
        if (!Array.isArray(target)) {
            const keys = Reflect.ownKeys(target).map(el => this.#normalizeColumn(el));
            this.#schema = keys;
        }
        else {
            const keys = Object.values(target).map(el => this.#normalizeColumn(el));
            this.#schema = keys;
        }
    }

    #schemaAssert(target) {
        const keys = Reflect.ownKeys(target).sort().map(el => this.#normalizeColumn(el));
        const schema = this.#schema.map(el => el.name || el.raw).sort();


        return schema.every((key, i) => {
            return key === (keys[i].name || keys[i].raw);
        });
    }

    #normalizeColumn(column) {
        let obj;

        if (isColumn(column) || isRaw(column)) obj = column;
        else obj = new Column(column);

        if (isRaw(column) && column.values.length !== 0) throw new QuerySyntaxError('can not has params in colum-raw type.');
        if (isColumn(obj) && (obj.hasAlias() || obj.hasTable())) throw new QuerySyntaxError('can not has alias or table prefix in INSERT structure.');
        return obj;
    }

    #normalizeValue(value) {

        return value.map(el => {
            if (isColumn(el)) throw new QuerySyntaxError('can not has column at insert.');
            else if (isValue(el)) return el;
            else return new Bind(el);
        })
       
        //if is structure: ERROR
    }
    
    values(...values) {
        if (values.length === 1 && Array.isArray(values[0])) values = values[0];
        if (values.length === 0) throw new QuerySyntaxError('can not has empty values array. use toInstruct');

        values.forEach((el) => {
            if (!el || typeof el !== 'object' || Array.isArray(el)) throw new TypeError('can not has a non-object structure on .values.');
            if (this.#schema.length === 0) this.#defineSchema(el);
            else if (!this.#schemaAssert(el)) throw new QuerySyntaxError('invalid object schema. Expected: [' + this.#schema.map(el => el.name || el.raw).join(', ') + ']');
        });
        
        const valuesMapped = values.map(el => this.#normalizeValue(Object.values(el)));

        if (this.#type !== IT.pattern && this.#type !== undefined) throw new QuerySyntaxError('can not has values and select struture at same time.');
        this.#type = IT.pattern;

        this.#data.push(...valuesMapped);
        return this;
    }

    select(query, ...columns) {
        if (columns.length === 1 && Array.isArray(columns[0])) columns = columns[0];
        if (!isQuery(query) && !isRaw(query)) throw new TypeError('you can only use raw and query objects.');
        if (this.#data.length > 0) throw new QuerySyntaxError('some operation has been already registered.');
        if (!Object.values(IT.select).includes(this.#type) && this.#type !== undefined) throw new QuerySyntaxError('can not has values and select struture at same time.');

       

        if (isQuery(query)) 
            this.#type = IT.select.instance;  
        else this.#type = IT.select.raw;

        this.#data[0] = query;
        if (columns.length !== 0) {
            
            this.#defineSchema(columns.map(el => this.#normalizeColumn(el)));
        }
        else this.#defineSchema(query.selectColumns);
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
        if (this.#type === IT.select.raw) {
            const select = this.#data[0].toInstruction(count, IR.insert);
            return select;
        }
        if (this.#type === IT.select.instance) {
            const data = this.#data[0];
            if (this.#schema.length === 0) this.#defineSchema(data.selectColumns);
            else {
                const selectColumns = data.selectColumns;
                const schema = this.#schema;
                if (schema.length !== selectColumns.length) throw new QuerySyntaxError('Invalid select columns: Expected Length: ' + schema.length);
            }
            const select = data.toInstruction(count, IR.insert);
            return select;
        }
        else throw new Error('internal builder fail.');
    }
}

class InsertStructure {
    #columns = [];
    #structure = new SchemaStructure();
    #conflict = undefined;


    onConflict(conflict_target){
        if(this.#conflict === undefined)
        this.#conflict = new OnConflict().conflict(conflict_target);
        else this.#conflict.conflict(conflict_target);

        return this;
    }

    set(left, right){
        if(this.#conflict === undefined) 
        this.#conflict = new OnConflict();
        
        this.#conflict.set(left, right);
        
        return this;
    }

    values(...values) {
        this.#structure.values(...values);
        return this;
    }

    select(query, ...columns) {
        this.#structure.select(query, ...columns);
        return this;
    }

    toInstruction(count) {
        const meta = this.#structure.valuesMetaSet;
        const structure = this.#structure;

        const values = structure.toInstruction(count);
        const columnsSet = this.#structure.schema;
        const columns = columnsSet.map(el => el.toInstruction(count)).join(', '); 

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


        const onConflict = this.#conflict !== undefined ? ` ${this.#conflict.toInstruction(count)}` : '';
        return `${encapsuledColumns}${values}${onConflict}`;
    }
}

module.exports = { InsertStructure };