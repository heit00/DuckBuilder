class Insert{
    #returningColumns = [];
    #insertTable = undefined;
    #insertStruct = new InsertStructure();
    #with = new WithClause();

    constructor(table) {
        if (T.v.filledString.func(table)) table = new Table(table);
        else if (!(isTable(table)) && !(isRaw(table))) throw new QuerySyntaxError('table must be a string or table instance.');

        this.#insertTable = table;
        this.#executePendingStates();
        return this;
    }


    values(...values) {
        this.#insertStruct.values(...values);
        return this;
    }

    queryValues(query, ...columns) {
        this.#insertStruct.select(query, ...columns);
        return this;
    }

    set(left, right) {
        this.#insertStruct.set(left, right);
        return this;
    }

    onConflict(conflict_target) {
        this.#insertStruct.onConflict(conflict_target);

        return this;
    }

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
        this.#with.add(qb, alias);
        return this;
    }

    #buildWith(count) {
        if (this.#with.isEmpty()) return '';
        const verb = QueryGrammar.clauses.with;

        return `${verb} ${this.#with.toInstruction(count)}`;
    }

    #buildReturning(count) {
        if (this.#returningColumns.length === 0) return '';
        if (this.#action === QueryGrammar.actions.select) throw new QuerySyntaxError('returning in SQL is invalid.');
        const verb = QueryGrammar.clauses.returning;

        const column = this.#returningColumns.map(el => el.toInstruction(count, IR.subQuery)).join(', ');

        return `${verb} ${column}`;
    }

        #buildInsert(count) {
        const str1 = QueryGrammar.actions.insert;
        const str2 = this.#insertTable.toInstruction(count);
        const into = QueryGrammar.clauses.into;
        return `${str1} ${into} ${str2}`;
    }

    #buildInsertStruct(count) {
        const str = this.#insertStruct.toInstruction(count);
        return str;
    }

    #compileInsert(count) {
        const steps = [
            this.#buildWith(count),
            this.#buildInsert(count),
            this.#buildInsertStruct(count),
            // WARNING:  #buildOnConflict (Upsert) HERE
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

        const template = this.#compileInsert(count);
        const values = count.getLiterals();
        return { template, values };
        
    
    }
}
