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
    return db.query(env.pgp.helpers.update(data, null, tableName) + ` where ${idColumn}=` + id + ' returning ' + idColumn);
  };
};


genericTemporalUpdate = (tableName, idColumn, isTest) => {
  let db = chooseDb(tableName, isTest);

  return (data) => {
    return new Promise((resolve, reject) => {

      let id = data[idColumn];

      if (!id && !data.previous_end_date) { // insert a new record
        db.one(env.pgp.helpers.insert(data, null, tableName) + ' returning ' + idColumn).then(res => {
          resolve(res[idColumn]);
        }).catch(err => reject(err));

      } else if (id && data.previous_end_date) { // update by insert new row and add end_time for previous start date
        db.query(env.pgp.helpers.update({current_end_date: data.previous_end_date}, ['current_end_date'], tableName ) + ` where ${idColumn}=` + id + ' returning ' + idColumn).then(updatedId => {

          delete data.id;
          db.one(env.pgp.helpers.insert(data, null, tableName) + ' returning ' + idColumn).then(res => {
            resolve(res[idColumn]);
          }).catch(err => reject(err));

        }).catch(err => reject(err));
      }else
        reject(new Error('arguments are not valid => id and date_time must be empty or valued simultaneously'))
    });

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
    name: 'event',
    insert: true,
    update: true,
    select: true,
    get: true,
    delete: true,
    idColumn: 'eid',
  },
  {
    name: 'attendance',
    insert: true,
    update: true,
    select: true,
    get: true,
    delete: true,
    idColumn: 'id',
  },
  {
    name: 'attendance_type',
    insert: true,
    update: true,
    select: true,
    get: true,
    delete: true,
    idColumn: 'id',
  },
    name: 'organization_type',
    insert: true,
    update: true,
    select: false,
    delete: true,
    idColumn: 'org_type_id',
  },
  {
    name: 'organization_lce',
    insert: true,
    update: true,
    select: false,
    delete: true,
    temporalUpdate: true,
    idColumn: 'id',
  },
  {
    name: 'lce_type',
    insert: true,
    update: true,
    select: false,
    delete: true,
    idColumn: 'lce_type_id',
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
  if (table.temporalUpdate) {
    wrappedSQL[table.name].temporalUpdate = genericTemporalUpdate(table.name, table.idColumn, false);
    wrappedSQL.test[table.name].temporalUpdate = genericTemporalUpdate(table.name, table.idColumn, true);
  }


});

module.exports = wrappedSQL;