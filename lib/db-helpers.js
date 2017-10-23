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
    let pid, rpJar;
    addPerson(username, password, extraData)
      .then(res => {
        pid = res;
        rpJar = rp.jar();

        return rp({
          method: 'POST',
          uri: helpers.apiTestURL('login'),
          form: {username: username, password: password},
          withCredentials: true,
          jar: rpJar,
        })
          .then(() => {
            resolve({pid: pid, rpJar: rpJar});
          })
      })
      .catch(err => {
        reject(`could not login '${username}' with '${password}':\n  ${helpers.parseServerErrorToString(err)}`);
      });
  });
}

function addBusinessWithRep(pid, postfix=0, extraData = {}) {
  let bizData = {
    name: 'biz' + postfix,
    name_fa: 'کسب و کار ' + postfix,
  };
  for(let key in extraData)
    bizData[key] = extraData[key];

  return sql.test.business.add(bizData)
    .then(res => {
      bizData.bid = +res.bid;
      return sql.test.association.add({pid:pid, bid:bizData.bid})
    })
    .then(res => {
      bizData.aid = +res.aid;
      return sql.test.membership.add({assoc_id: bizData.aid, is_active: true, is_representative: true});
    })
    .then(res => {
      bizData.mid = +res.mid;
      return Promise.resolve(bizData);
    })
}

function addOrganizationWithRep(pid, postfix = 0, extraData = {}) {
  let orgData = {
    name: 'org' + postfix,
    name_fa: 'سازمان ' + postfix,
  };
  for(let key in extraData)
    orgData[key] = extraData[key];

  return sql.test.organization.add(orgData)
    .then(res => {
      orgData.oid = +res.oid;
      return sql.test.association.add({pid:pid, oid:orgData.oid})
    })
    .then(res => {
      orgData.aid = +res.aid;
      return sql.test.membership.add({assoc_id: orgData.aid, is_active: true, is_representative: true});
    })
    .then(res => {
      orgData.mid = +res.mid;
      return Promise.resolve(orgData);
    })
}

module.exports = {
  create: create,
  addPerson: addPerson,
  createForConfig: createForConfigure,
  addAndLoginPerson: addAndLoginPerson,
  addBusinessWithRep: addBusinessWithRep,
  addOrganizationWithRep: addOrganizationWithRep,
};