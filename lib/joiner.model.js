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

  static select(pid) {
    let curSql = Joiner.test ? sql.test : sql;
    return curSql.joiner.repPendingUsers({pid})
      .then(res => {
        let ret = {biz: [], org: []};
        res.forEach(row => {
          let {oid, bid} = row;
          let newRow, needle;
          if (row.oid) {
            newRow = ret.org.find(r => r.oid === oid);
            if (!newRow) {
              newRow = {oid, pending: []};
              ret.org.push(newRow);
            }
            needle = 'org_';
          } else if (row.bid) {
            newRow = ret.biz.find(r => r.bid === bid);
            if (!newRow) {
              newRow = {bid, pending: []};
              ret.biz.push(newRow);
            }
            needle = 'biz_';
          }
          let newPending = {};
          for (let key in row) {
            let i = key.indexOf(needle + 'a_');
            if (row[key] !== null)
              if (i === 0) {
                let newKey = key.substring(6);
                newPending[newKey] = row[key];
              } else {
                let i = key.indexOf(needle);
                if (i === 0) {
                  let newKey = key.substring(4);
                  if (!newRow[newKey]) {
                    newRow[newKey] = row[key];
                  }
                }
              }
          }
          newRow.pending.push(newPending);
        });
        return Promise.resolve(ret);
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