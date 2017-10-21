/**
 * Created by Amin on 31/01/2017.
 */
const env = require('./env');
const sql = require('./sql');
const lib = require('./lib');
const User = lib.User;

function dbTestCreate() {
  return new Promise((resolve, reject) => {
    sql.db.create({dbName: env.test_db_name}, true)
      .then(() => {
        resolve();
      })
      .catch(err => {
        reject(err);
      });
  });
}

function createOrExist(tableName) {
  return new Promise((resolve, reject) => {
    sql[tableName].create()
      .then(resolve)
      .catch(err => {
        if (err.message.indexOf(`"${tableName}" already exists`) !== -1)
          resolve();
        else
          reject(err);
      })
  })
}

function prodTablesCreate() {
  return new Promise((resolve, reject) => {
    createOrExist('person')
      .then(createOrExist('expertise'))
      .then(createOrExist('person_expertise'))
      .then(createOrExist('organization_type'))
      .then(createOrExist('person_activation_link'))
      .then(createOrExist('organization'))
      .then(createOrExist('lce_type'))
      .then(createOrExist('organization_lce'))
      .then(createOrExist('business'))
      .then(resolve())
      .catch(err => reject(err));
  });

}

function adminRowCreate() {
  return new Promise((resolve, reject) => {
    let user = new User();

    let data = {
      username: 'admin',
      password: 'admin',
    };

    user.insert(data)
      .then(() => {
        resolve();
      })
      .catch((err) => {
        reject(err);
      });
  });
}

function setupMainDatabase(msg) {
  console.log(msg);
  prodTablesCreate()
    .then(adminRowCreate)
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
    .then(res => {
      setupMainDatabase(res);
    })
    .catch(err => {
      setupMainDatabase(err.message);
    });
}