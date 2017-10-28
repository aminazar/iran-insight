/**
 * Created by Amin on 31/01/2017.
 */
const env = require('./env');
const sql = require('./sql');
const lib = require('./lib');

function dbTestCreate() {
  return new Promise((resolve, reject) => {
    sql.db.create({dbName: env.test_db_name}, true)
      .then(() => {
        resolve();
      })
      .catch(err => {
        if(err.message.indexOf('already exists') === -1) {
          reject(err);
        } else {
          resolve();
        }
      });
  });
}

function prodTablesCreate() {
  return lib.dbHelpers.createForConfig();
}

function setupMainDatabase() {
  prodTablesCreate()
    .then(() => lib.dbHelpers.addPerson('admin', 'admin', {}, false, true))
    .then(adminId => lib.dbHelpers.addAdmin(adminId))
    .then(() => {
      if (env.isDev)
        return dbTestCreate();
      else
        process.exit();
    })
    .then(() => process.exit())
    .catch((err) => {
      console.log(err);
      process.exit();
    });
}

if (env.isDev) {
  sql.db.create({dbName: env.db_name})
    .then(() => {
      setupMainDatabase();
    })
    .catch(err => {
      if(err.message.indexOf('already exists') === -1) {
        console.log(err);
        process.exit();
      } else {
        setupMainDatabase();
      }
    });
}