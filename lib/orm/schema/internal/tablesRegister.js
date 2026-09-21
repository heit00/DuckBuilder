const { isTable } = require('../../global-symbol-lockup/symbols');

const TABLES = new Map();

function registerTable(...items) {
  if (items.length === 1 && Array.isArray(items[0])) items = items[0];

  for (const element of items) {
    if (!isTable(element)) {
      throw new TypeError('all elements values of items[] must be a table instance.');
    }
    const key = `${element.schemaName || 'public'}.${element.name}`;
    if (TABLES.has(key)) {
       throw new Error(`table ${element.name} already registered.`);
    }
    for (const pivotElement of element.pivots) {
      const key = `${pivotElement.schemaName || 'public'}.${pivotElement.name}`;
      if (TABLES.has(key))
      throw new Error(`table ${pivotElement.name} already registered.`);
    }
  }
  for (const element of items) {
    const key = `${element.schemaName || 'public'}.${element.name}`;
    TABLES.set(key, element);
    for (const pivotElement of element.pivots) {
      const key = `${pivotElement.schemaName || 'public'}.${pivotElement.name}`;
      TABLES.set(key, pivotElement);
    }
  }
}

function getTables() {
  return [...TABLES.values()];
}

module.exports = { registerTable, getTables };