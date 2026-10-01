class SchemaGrammar{
  static OnAction = {
    cascade: 'CASCADE_ACTION',
    restrict: 'RESTRICT_ACTION'
  }

  static BaseTypes = {
    integer: 'INTEGER_TYPE',
    varchar: 'VARCHAR_TYPE',
    json: 'JSONB_TYPE',
    boolean: 'BOOLEAN_TYPE',
    bigint: 'BIGINT_TYPE',
    timestamp: 'TIMESTAMP_TYPE',
    decimal: 'DECIMAL_TYPE',
    uuid: 'UUID_TYPE',
    text: 'TEXT_TYPE',
    date: 'DATE_TYPE',
    time: 'TIME_TYPE',
    smallint: 'SMALLINT_TYPE'
  }

  static RadicalTypes = SchemaGrammar.BaseTypes;

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