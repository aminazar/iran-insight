/**
 * Created by Amin on 01/02/2017.
 */
/*
 * This is a wrapper to create ready-to-us postgres promises
 * from raw SQLs in the raw.sql.js
 */

const rawSql = require('./raw.sql');
const env = require('../env');
let wrappedSQL = {test: {}};
let usingFunction = query => {
  let res = {
    get: 'any',
    uniqueGet: 'one',
    checkNone: 'none',
    test: 'one',
    add: 'one',
  }[query];

  if (!res)
    res = 'query';

  return res;
};

for (let table in rawSql) {
  wrappedSQL[table] = {};
  wrappedSQL.test[table] = {};
  for (let query in rawSql[table]) {
    wrappedSQL[table][query] = (data) => {
      return ((table === 'db' ? env.initDb : env.db)[usingFunction(query)])(rawSql[table][query], data);
    };
    wrappedSQL.test[table][query] = (data) => {
      return (env.testDb[usingFunction(query)])(rawSql[table][query], data);
    };
  }
}
/*
 * Additional SQLs created by helpers go here
 */
chooseDb = (tableName, isTest) => tableName === 'db' ? env.initDb : (isTest ? env.testDb : env.db);

genericInsert = (tableName, idColumn, isTest) => {
  let db = chooseDb(tableName, isTest);
  return (data) => {
    return db.one(env.pgp.helpers.insert(data, null, tableName) + ' returning ' + idColumn);
  }
};

genericUpdate = (tableName, idColumn, isTest) => {
  let db = chooseDb(tableName, isTest);
  return (data, id) => {
    return db.query(env.pgp.helpers.update(data, null, tableName) + ` where ${idColumn}=` + id);
  };
};

genericSelect = (tableName, isTest) => {
  let db = chooseDb(tableName, isTest);
  return () => {
    return db.query(`select * from ${tableName}`);
  };
};

genericConditionalSelect = (tableName, isTest, whereColumns=[], nullColumns=[], notNullColumns=[]) => {
  let db = chooseDb(tableName, isTest);
  let whereClause = whereColumns ? whereColumns.concat(nullColumns).concat(notNullColumns).map(col => col + (nullColumns.includes(col) ? ' is null' : notNullColumns.includes(col)? ' is not null' : '=${' + col + '}')).join(' and ') : '';
  let query = `select * from ${tableName}${whereClause ? ' where ' + whereClause : ''}`;
  return (constraints) => {
    return db.any(query, constraints);
  };
};

genericGet = (tableName, isTest) => {
  return (constraints) => {
    return genericConditionalSelect(
      tableName,
      isTest,
      Object.keys(constraints).filter(r => constraints[r] !== null && constraints[r] !== 'NOT NULL'),
      Object.keys(constraints).filter(r => constraints[r] === null),
      Object.keys(constraints).filter(r => constraints[r] === 'NOT NULL')
    )(constraints);
  }
};

genericDelete = (tableName, idColumn, isTest) => {
  let db = chooseDb(tableName, isTest);
  return (id) => {
    return db.query(`delete from ${tableName} where ${idColumn}=` + id)
  }
};

let tablesWithSqlCreatedByHelpers = [
  {
    name: 'person',
    insert: true,
    update: true,
    select: true,
    delete: true,
    idColumn: 'pid',
  },
  {
    name: 'expertise',
    insert: true,
    update: true,
    select: true,
    delete: true,
    idColumn: 'pid',
  },
  {
    name: 'person_expertise',
    insert: true,
    update: true,
    select: true,
    delete: true,
    idColumn: 'expertise_id',
  },
  {
    name: 'organization',
    insert: true,
    update: true,
    select: false,
    delete: true,
    idColumn: 'oid',
  },
  {
    name: 'person_activation_link',
    insert: true,
    update: true,
    select: true,
    delete: true,
    idColumn: 'pid',
  },
  {
    name: 'association',
    insert: true,
    update: true,
    select: true,
    get: true,
    delete: true,
    idColumn: 'aid',
  },
  {
    name: 'membership',
    insert: true,
    update: true,
    select: true,
    get: true,
    delete: true,
    idColumn: 'mid',
  },
  {
    name: 'event',
    insert: true,
    update: true,
    select: true,
    get: true,
    delete: true,
    idColumn: 'eid',
  },
];

tablesWithSqlCreatedByHelpers.forEach((table) => {
  if (!wrappedSQL[table])
    wrappedSQL[table] = {};

  if (!wrappedSQL.test[table])
    wrappedSQL.test[table] = {};

  if (table.insert) {
    wrappedSQL[table.name].add = genericInsert(table.name, table.idColumn, false);
    wrappedSQL.test[table.name].add = genericInsert(table.name, table.idColumn, true);
  }

  if (table.update) {
    wrappedSQL[table.name].update = genericUpdate(table.name, table.idColumn, false);
    wrappedSQL.test[table.name].update = genericUpdate(table.name, table.idColumn, true);
  }

  if (table.select) {
    wrappedSQL[table.name].select = genericSelect(table.name, false);
    wrappedSQL.test[table.name].select = genericSelect(table.name, true);
  }

  if (table.conditionalSelect) {
    wrappedSQL[table.name].conditionalSelect = (columns, nullColumns) => genericConditionalSelect(table.name, false, columns, nullColumns);
    wrappedSQL.test[table.name].conditionalSelect = (columns, nullColumns) => genericConditionalSelect(table.name, true, columns, nullColumns);
  }

  if(table.get) {
    wrappedSQL[table.name].get = genericGet(table.name, false);
    wrappedSQL.test[table.name].get = genericGet(table.name, true);
  }

  if (table.delete) {
    wrappedSQL[table.name].delete = genericDelete(table.name, table.idColumn, false);
    wrappedSQL.test[table.name].delete = genericDelete(table.name, table.idColumn, true);
  }
});

module.exports = wrappedSQL;