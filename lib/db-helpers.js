const sql = require('../sql');
const Person = require('./person.model');
const tableNames = require('../table-names');
const helpers = require('./helpers');
const rp = (require("request-promise")).defaults({jar: true});

function create(isTest = true) {
  let s = isTest ? sql.test : sql;
  let initialPromise = Promise.resolve();
  if (isTest) {
    let reverseTableNames = [...tableNames].reverse();
    initialPromise = reverseTableNames
      .map(tableName => s[tableName].drop)
      .reduce((p1, p2) => p1.then(p2), initialPromise);
  }
  return tableNames
    .map(tableName => s[tableName].create)
    .reduce((p1, p2) => p1.then(p2), initialPromise);
}

function createForConfigure() {
  return create(false);
}

function addPerson(username, password, extraData = {}, isTest = true, ignoreDuplicate = false) {
  return new Promise((resolve, reject) => {
    let person = new Person(isTest);

    let data = {
      username: username,
      password: password,
    };

    for (let key in extraData) {
      data[key] = extraData[key];
    }

    person.insert(data)
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

function addAndLoginPerson(username, password, extraData = {}) {
  return new Promise((resolve, reject) => {
    let pid;
    addPerson(username, password, extraData)
      .then(res => {
        pid = res;
        return rp({
          method: 'POST',
          uri: helpers.apiTestURL('login'),
          form: {username: username, password: password}
        })
      })
      .then(() => {
        resolve({pid:pid,rp:rp});
      })
      .catch(err => {
        reject('could not login:' + err.toString());
      });
  });
}

module.exports = {
  create: create,
  addPerson: addPerson,
  createForConfig: createForConfigure,
  addAndLoginPerson: addAndLoginPerson,
};