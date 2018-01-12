/**
 * Created by Amin on 01/02/2017.
 */
/*
 * This is a wrapper to create ready-to-us postgres promises
 * from raw SQLs in the raw.sql.js
 */

const rawSql = require('./raw.sql');
const env = require('../env');
const types = require('./types');
let wrappedSQL = {test: {}};
let usingFunction = query => {
  let res = {
    get: 'any',
    uniqueGet: 'one',
    getOne: 'oneOrNone',
    checkNone: 'none',
    test: 'one',
    add: 'one',
  }[query];

  if (!res)
    res = 'query';

  return res;
};
let templateGeneratedTables = [];

for (let table in rawSql) {
  wrappedSQL[table] = {};
  wrappedSQL.test[table] = {};

  for (let query in rawSql[table]) {
    let dataTransform = d => d;
    if (rawSql[table][query].fixedArgs) {

      if (!templateGeneratedTables.includes(table))
        templateGeneratedTables.push(table);

      let fixedArgs = rawSql[table][query].fixedArgs;
      let q = rawSql[table][query].query;
      dataTransform = d => {
        if(d === undefined)
          d = {};

        if (d.constructor.name === 'Array') {
          d = {};
        }

        for (let key in fixedArgs) {
          d[key] = fixedArgs[key];
        }

        return d;
      };
      rawSql[table][query] = q;
    }

    wrappedSQL[table][query] = (table === 'db') ? (data, task) => {
      console.log(table, query, usingFunction(query),task)
      return ((task ? task : env.initDb)[usingFunction(query)])(rawSql[table][query], dataTransform(data));
    } : (data, task) => {
      return ((task ? task : env.db)[usingFunction(query)])(rawSql[table][query], dataTransform(data, task));
    };
    wrappedSQL.test[table][query] = (data, task) => {
      return ((task ? task : env.testDb)[usingFunction(query)])(rawSql[table][query], dataTransform(data));
    };
  }
}
/*
 * Additional SQLs created by helpers go here
 */
chooseDb = (tableName, isTest) => tableName === 'db' ? env.initDb : (isTest ? env.testDb : env.db);

genericInsert = (tableName, idColumn, isTest) => {
  let db = chooseDb(tableName, isTest);
  return (data, task) => {
    return (task ? task : db).one(env.pgp.helpers.insert(data, null, tableName) + ' returning ' + idColumn);
  }
};

genericUpdate = (tableName, idColumn, isTest) => {
  let db = chooseDb(tableName, isTest);
  return (data, id, task) => {
    return (task ? task : db).query(env.pgp.helpers.update(data, null, tableName) + ` where ${idColumn}=` + id + ' returning ' + idColumn);
  };
};


genericTemporalUpdate = (tableName, idColumn, isTest) => {
  let db = chooseDb(tableName, isTest);

  return (data, task) => {
    return new Promise((resolve, reject) => {

      let id = data[idColumn];

      if (!id && !data.previous_end_date) { // insert a new record
        (task ? task : db).one(env.pgp.helpers.insert(data, null, tableName) + ' returning ' + idColumn).then(res => {
          resolve(res[idColumn]);
        }).catch(err => reject(err));

      } else if (id && data.previous_end_date) { // update by insert new row and add end_time for previous start date
        (task ? task : db).query(env.pgp.helpers.update({current_end_date: data.previous_end_date}, ['current_end_date'], tableName) + ` where ${idColumn}=` + id + ' returning ' + idColumn).then(updatedId => {

          delete data.id;
          (task ? task : db).one(env.pgp.helpers.insert(data, null, tableName) + ' returning ' + idColumn).then(res => {
            resolve(res[idColumn]);
          }).catch(err => reject(err));

        }).catch(err => reject(err));
      } else
        reject(new Error('arguments are not valid => id and date_time must be empty or valued simultaneously'))
    });

  };
};


genericSelect = (tableName, isTest) => {
  let db = chooseDb(tableName, isTest);
  return (task) => {
    return (task ? task : db).query(`select * from ${tableName}`);
  };
};

genericConditionalSelect = (tableName, isTest, whereColumns = [], nullColumns = [], notNullColumns = []) => {
  let db = chooseDb(tableName, isTest);
  let whereClause = whereColumns ? whereColumns.concat(nullColumns).concat(notNullColumns).map(col => col + (nullColumns.includes(col) ? ' is null' : notNullColumns.includes(col) ? ' is not null' : '=${' + col + '}')).join(' and ') : '';
  let query = `select * from ${tableName}${whereClause ? ' where ' + whereClause : ''}`;
  return (constraints, task) => {
    return (task ? task : db).any(query, constraints);
  };
};

genericGet = (tableName, isTest) => {
  return (constraints, task) => {
    return genericConditionalSelect(
      tableName,
      isTest,
      Object.keys(constraints).filter(r => constraints[r] !== null && constraints[r] !== 'NOT NULL'),
      Object.keys(constraints).filter(r => constraints[r] === null),
      Object.keys(constraints).filter(r => constraints[r] === 'NOT NULL')
    )(constraints, task);
  }
};

genericSafeInsert = (tableName, idColumn, isTest) => {
  let db = chooseDb(tableName, isTest);

  return (data , constraints, task) => {
    // 'constraints' can part of 'data' => if whole of data is not going to be duplicated. but constraint is important about some keys in 'data'
    let arg =constraints ? constraints : data;
  return genericGet(tableName, isTest)(arg)
      .then(res => {
        if (res.length)
          return Promise.resolve(res[0]);
        else
          return (task ? task : db).one(env.pgp.helpers.insert(data, null, tableName) + ' returning ' + idColumn);
      });
  }
};

genericDelete = (tableName, idColumn, isTest) => {
  let db = chooseDb(tableName, isTest);
  return (id, task) => {
    return (task ? task : db).query(`delete from ${tableName} where ${idColumn}=` + id +' returning ' + idColumn)
  }
};

let tablesWithSqlCreatedByHelpers = [
  {
    name: 'person',
    insert: true,
    update: true,
    select: true,
    delete: true,
    get: true,
    idColumn: 'pid',
  },
  {
    name: 'administrators',
    insert: true,
    idColumn: 'admin_id',
    select: true,
    get: true
  },
  {
    name: 'partnership',
    insert: true,
    update: true,
    delete: true,
    get: true,
    idColumn: 'id',
  },
  {
    name: 'expertise',
    insert: true,
    update: true,
    select: true,
    delete: true,
    idColumn: 'expertise_id',
  },
  {
    name: 'person_expertise',
    insert: true,
    update: true,
    select: true,
    delete: true,
    idColumn: 'peid',
  },
  {
    name: 'organization',
    insert: true,
    update: true,
    select: false,
    delete: false,
    idColumn: 'oid',
  },
  {
    name: 'business',
    insert: true,
    update: true,
    select: true,
    delete: false,
    get: true,
    idColumn: 'bid',
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
    safeInsert: true,
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
    name: 'organization_lce',
    insert: true,
    update: true,
    select: false,
    delete: true,
    get: true,
    idColumn: 'id',
  },
  {
    name: 'business_lce',
    insert: true,
    update: true,
    select: false,
    delete: true,
    get: true,
    idColumn: 'id',
  },
  {
    name: 'product',
    insert: true,
    update: true,
    select: true,
    delete: true,
    get: true,
    idColumn: 'product_id',
  },
  {
    name: 'business_product',
    insert: true,
    update: true,
    select: true,
    delete: true,
    get: true,
    idColumn: 'bpid',
  },
  {
    name: 'subscription',
    safeInsert: true,
    update: true,
    select: true,
    delete: true,
    get: true,
    idColumn: 'sid',
  },
  {
    name: 'tag',
    safeInsert: true,
    update: true,
    select: true,
    delete: true,
    get: true,
    idColumn: 'tid',
  },
  {
    name: 'tag_connection',
    insert: true,
    update: true,
    select: true,
    delete: true,
    get: true,
    idColumn: 'id',
  }
].concat(templateGeneratedTables
  .map(tableName => {
      return {
        name: tableName,
        insert: true,
        update: true,
        select: true,
        get: true,
        delete: true,
        idColumn: 'id',
      }
    }
  ));

tablesWithSqlCreatedByHelpers.filter(table => types.includes(table.name)).map(table => {
  delete table.insert;
  table.safeInsert = true
});


tablesWithSqlCreatedByHelpers.forEach((table) => {
  if (!wrappedSQL[table])
    wrappedSQL[table] = {};

  if (!wrappedSQL.test[table])
    wrappedSQL.test[table] = {};

  if (table.insert) {
    wrappedSQL[table.name].add = genericInsert(table.name, table.idColumn, false);
    wrappedSQL.test[table.name].add = genericInsert(table.name, table.idColumn, true);
  }

  if (table.safeInsert) {
    wrappedSQL[table.name].add = genericSafeInsert(table.name, table.idColumn, false);
    wrappedSQL.test[table.name].add = genericSafeInsert(table.name, table.idColumn, true);
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

  if (table.get) {
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