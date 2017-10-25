/**
 * Created by Amin on 01/02/2017.
 */

const error = require('./errors.list');
const sql = require('../sql');

class Joiner {
  constructor(test = Joiner.test) {
    Joiner.test = test;
    this.sql = test ? sql.test : sql;
  }

  static select() {
    this.sql.membership.getReps()
      .then(res => {

      })
  }

  saveData(userId, joinerId) {
    if (!data.name || !data.name_fa)
      return Promise.reject(error.emptyOrgTypeName);

    return super.saveData(data, id);
  }

  delete(userId, memberId) {

  }

}

Joiner.test = false;

module.exports = Joiner;