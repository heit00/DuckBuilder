const { SchemaGrammar } = require('../../../schema/grammar/schemaGrammar');

class CompilerGrammar {
    static statements = {
        create: 'CREATE',
        alter: 'ALTER',
        add: 'ADD',
        drop: 'DROP',
    }

    static tableDDL = {
        tableToken: 'TABLE',
        leftSeparator: '(',
        rightSeparator: ')',
        columnSeparator: ','
    }

    static conditionals = {
        ifNotExists: 'IF NOT EXISTS'
    }

    static specialOperators = {
        is: 'IS',
    }

    static logicOperators = {
        and: 'AND',
        or: 'OR'
    }

    static columnDDL = {
        columnToken: 'COLUMN',
        default: 'DEFAULT',
        null: 'NULL',
        notNull: 'NOT NULL',
        typeLeftSeparator: '(',
        typeRightSeparator: ')',
        argsSeparator: ','
    }

    static constraintDDL = {
        constraintToken: 'CONSTRAINT',
        tokens: {
            primary: 'PRIMARY KEY',
            foreign: 'FOREIGN KEY',
            unique: 'UNIQUE',
            check: 'CHECK',
            notNull: 'NOT NULL',
            references: 'REFERENCES',
        },
        actions: {
            onDelete: 'ON DELETE',
            onUpdate: 'ON UPDATE',
            cascade: 'CASCADE',
            restrict: 'RESTRICT',
            setNull: 'SET NULL',
            setDefault: 'SET DEFAULT',
            noAction: 'NO ACTION'
        },
        defer: {
            deferred: 'DEFERRED',
            deferrable: 'DEFERRABLE',
            initially: 'INITIALLY',
            immediate: 'IMMEDIATE'
        }
    }

    static indexesDDL = {
        indexToken: 'INDEX',
        unique: 'UNIQUE',
        on: 'ON',
        using: 'USING',
        leftSeparator: '(',
        rightSeparator: ')',
        columnSeparator: ',',
        methods: {
            btree: 'btree',
            hash: 'hash',
            gin: 'gin',
            gist: 'gist'
        }
    }

    static quotes = {
        identifier: '"'
    }

    static typesMapper = {
        [SchemaGrammar.BaseTypes.integer]: 'INTEGER',
        [SchemaGrammar.BaseTypes.varchar]: 'VARCHAR',
        [SchemaGrammar.BaseTypes.json]: 'JSONB',
        [SchemaGrammar.BaseTypes.boolean]: 'BOOLEAN',
        [SchemaGrammar.BaseTypes.bigint]: 'BIGINT',
        [SchemaGrammar.BaseTypes.timestamp]: 'TIMESTAMP',
        [SchemaGrammar.BaseTypes.decimal]: 'NUMERIC',
        [SchemaGrammar.BaseTypes.uuid]: 'UUID',
        [SchemaGrammar.BaseTypes.text]: 'TEXT',
        [SchemaGrammar.BaseTypes.date]: 'DATE',
        [SchemaGrammar.BaseTypes.time]: 'TIME',
        [SchemaGrammar.BaseTypes.smallint]: 'SMALLINT'
    }

    static constraintsMapper = {
        [SchemaGrammar.constraints.types.primaryKey]: CompilerGrammar.constraintDDL.tokens.primary,
        [SchemaGrammar.constraints.types.unique]: CompilerGrammar.constraintDDL.tokens.unique,
        [SchemaGrammar.constraints.types.foreignKey]: CompilerGrammar.constraintDDL.tokens.foreign,
        [SchemaGrammar.constraints.types.check]: CompilerGrammar.constraintDDL.tokens.check,
        [SchemaGrammar.constraints.types.notNull]: CompilerGrammar.constraintDDL.tokens.notNull,
    };

    static actionsMapper = {
        [SchemaGrammar.OnAction.cascade]: CompilerGrammar.constraintDDL.actions.cascade,
        [SchemaGrammar.OnAction.restrict]: CompilerGrammar.constraintDDL.actions.restrict,
        'CASCADE': CompilerGrammar.constraintDDL.actions.cascade,
        'RESTRICT': CompilerGrammar.constraintDDL.actions.restrict,
        'SET NULL': CompilerGrammar.constraintDDL.actions.setNull,
        'SET DEFAULT': CompilerGrammar.constraintDDL.actions.setDefault,
        'NO ACTION': CompilerGrammar.constraintDDL.actions.noAction,
    };
}

module.exports = { CompilerGrammar };