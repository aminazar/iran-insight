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

function createForConfig() {
  return create(false);
}

function addPerson(username, password, extraData = {display_name_en: 'DNE'}, isTest = true, ignoreDuplicate = false) {
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

function addAdmin(pid, isTest = true) {
  return new Promise((resolve, reject) => {
    let person = new Person(isTest);
    if(pid) {
      person.insertAdmin(pid)
        .then(id => {
          resolve(id);
        })
        .catch((err) => {
          if (err.message.indexOf('duplicate key')!== -1) {
            resolve()
          } else {
            reject(err);
          }
        });
    } else {
      resolve();
    }
  });
}

function addAndLoginPerson(username, password = '123456', extraData = {display_name_en: 'DNE'}) {
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

function addBusinessWithRep(pid, postfix = 0, extraData = {}) {
  let bizData = {
    name: 'biz' + postfix,
    name_fa: 'کسب و کار ' + postfix,
  };
  for (let key in extraData)
    bizData[key] = extraData[key];

  return sql.test.business.add(bizData)
    .then(res => {
      bizData.bid = +res.bid;
      return sql.test.association.add({pid: pid, bid: bizData.bid})
    })
    .then(res => {
      bizData.aid = +res.aid;
      return sql.test.membership.add({
        assoc_id: bizData.aid,
        is_active: extraData.is_active !== undefined ? extraData.is_active : true,
        is_representative: extraData.is_representative !== undefined ? extraData.is_representative : true
      });
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
  for (let key in extraData)
    orgData[key] = extraData[key];

  return sql.test.organization.add(orgData)
    .then(res => {
      orgData.oid = +res.oid;
      return sql.test.association.add({pid: pid, oid: orgData.oid})
    })
    .then(res => {
      orgData.aid = +res.aid;
      return sql.test.membership.add({
        assoc_id: orgData.aid,
        is_active: extraData.is_active !== undefined ? extraData.is_active : true,
        is_representative: extraData.is_representative !== undefined ? extraData.is_representative : true
      });
    })
    .then(res => {
      orgData.mid = +res.mid;
      return Promise.resolve(orgData);
    })
}

function addOrgPerson(username, oid, extraData) {
  let ret = {};
  return addPerson(username, '123', {firstname_en: username+'f', surname_en: username+'s'})
    .then(res => {
      ret.pid = +res;
      return sql.test.association.add({pid: ret.pid, oid: oid})
    })
    .then(res => {
      ret.aid = +res.aid;
      ret.mid = + res.mid;
      let membershipPromsie = pos_id => {
        let membershipData = {
          assoc_id: ret.aid,
          is_active: extraData.is_active !== undefined ? extraData.is_active : true,
          is_representative: extraData.is_representative !== undefined ? extraData.is_representative : true
        };
        if(pos_id)
          membershipData.position_id = pos_id;
        return sql.test.membership.add(membershipData)
      };

      if(extraData.position)
        return sql.test.position_type.add({name:extraData.position,name_fa:extraData.position+'_fa'})
          .then(res => membershipPromsie(+res.id));
      else
        return membershipPromsie();
    })
    .then(res => {
      ret.mid = + res.mid;
      return Promise.resolve(ret);
    })
}

function addBizPerson(username, bid, extraData) {
  let ret = {};
  return addPerson(username, '123', {firstname_en: username+'f', surname_en: username+'s'})
    .then(res => {
      ret.pid = +res;
      return sql.test.association.add({pid: ret.pid, bid: bid})
    })
    .then(res => {
      ret.aid = +res.aid;
      ret.mid = + res.mid;
      let membershipPromsie = pos_id => {
        let membershipData = {
          assoc_id: ret.aid,
          is_active: extraData.is_active !== undefined ? extraData.is_active : true,
          is_representative: extraData.is_representative !== undefined ? extraData.is_representative : true
        };
        if(pos_id)
          membershipData.position_id = pos_id;
        return sql.test.membership.add(membershipData)
      };

      if(extraData.position)
        return sql.test.position_type.add({name:extraData.position,name_fa:extraData.position+'_fa'})
          .then(res => membershipPromsie(+res.id));
      else
        return membershipPromsie();
    })
    .then(res => {
      ret.mid = + res.mid;
      return Promise.resolve(ret);
    })
}


module.exports = {
  create,
  addPerson,
  addAdmin,
  createForConfig,
  addAndLoginPerson,
  addBusinessWithRep,
  addOrganizationWithRep,
  addOrgPerson,
  addBizPerson,
};