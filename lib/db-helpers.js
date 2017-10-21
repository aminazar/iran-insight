const sql = require('../sql');
const User = require('./user.model');

function create(tableNames, isTest = true, dropFirst = true) {
  let s = isTest ? sql.test : sql;
  let initialPromise = Promise.resolve();
  if (dropFirst) {
    let reverseTableNames = [...tableNames].reverse();
    initialPromise = reverseTableNames
      .map(tableName => s[tableName].drop)
      .reduce((p1, p2) => p1.then(p2), initialPromise);
  }
  return tableNames
    .map(tableName => s[tableName].create)
    .reduce((p1, p2) => p1.then(p2), initialPromise);
}

function addPerson(username, password, extraData = {}, isTest = true, ignoreDuplicate = false) {
  return new Promise((resolve, reject) => {
    let user = new User(isTest);

    let data = {
      username: username,
      password: password,
    };

    for (let key in extraData) {
      data[key] = extraData[key];
    }

    user.insert(data)
      .then(id => {
        resolve(id);
      })
      .catch((err) => {
        if (ignoreDuplicate && err.message.indexOf('duplicate key value violates unique constraint') !== -1)
          resolve();
        else
          reject(err);
      });
  });
}

module.exports = {
  create: create,
  addPerson: addPerson,
};