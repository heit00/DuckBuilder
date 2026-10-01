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

    static typeMap = {
        [SchemaGrammar.RadicalTypes.integer]: (type, column) => {
            return column?.autoIncrement() ? 'SERIAL' : 'INTEGER';
        },
        [SchemaGrammar.RadicalTypes.varchar]: (type) => {
            const length = type?.args?.[0] || 255;
            return `VARCHAR(${length})`;
        },
        [SchemaGrammar.RadicalTypes.json]: () => 'JSONB',
    };
}

module.exports = { CompilerGrammar };