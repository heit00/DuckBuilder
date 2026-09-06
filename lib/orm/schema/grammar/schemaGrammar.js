class SchemaGrammar{
  static OnAction = {
    cascade: 'CASCADE',
    restrict: 'RESTRICT'
  }

  static RadicalTypes = {
    integer: 'INTEGER',
    varchar: 'VARCHAR',
    json: 'JSONB'
  }

  static defaultArgs = {
    publicSchema: 'public',
    primaryKeyName: 'id'
  }

  static constraints = {
    types: {
      primaryKey: 'PRIMARY KEY',
      unique: 'UNIQUE',
      foreignKey: 'FOREIGN KEY',
      check: 'CHECK'
    }
  }
}

module.exports = { SchemaGrammar };