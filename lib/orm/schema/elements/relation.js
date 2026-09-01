class Relation{
  name;
  columns = new Map([]);
  constraints = new Map([]);

  foreignKeys = [];
  primaryKeys = [];

  onDelete = 'RESTRICT';
  onUpdate = 'CASCADE'

}