class SchemaGrammar{
  static OnAction = {
    cascade: 'CASCADE_ACTION',
    restrict: 'RESTRICT_ACTION'
  }

  static RadicalTypes = {
    integer: 'INTEGER_TYPE',
    varchar: 'VARCHAR_TYPE',
    json: 'JSONB_TYPE'
  }

  static defaultArgs = {
    publicSchema: 'public',
    primaryKeyName: 'id'
  }

  static constraints = {
    types: {
      primaryKey: 'PRIMARY_KEY_TYPE',
      unique: 'UNIQUE_TYPE',
      foreignKey: 'FOREIGN_KEY_TYPE',
      check: 'CHECK_TYPE'
    }
  }
}

module.exports = { SchemaGrammar };