const { isTable } = require('../symbol-lockup/symbols');

const tables = new Map();

function registerTable(...items) {
  if (items.length === 1 && Array.isArray(items[0])) items = items[0];

  for (const element of items) {
    if (!isTable(element)) {
      throw new TypeError('all elements values of items[] must be a table instance.');
    }
    const key = `${element.schemaName || 'public'}.${element.name}`;
    if (tables.has(key)) {
       throw new Error(`table ${element.name} already registered.`);
    }
  }
  for (const element of items) {
      const key = `${element.schemaName || 'public'}.${element.name}`;
      tables.set(key, element);
  }
}

function getTables() {
  return [...tables.values()];
}

module.exports = { registerTable, getTables };