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
}

module.exports = { CompilerGrammar };