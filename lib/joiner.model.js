/**
 * Created by Amin on 01/02/2017.
 */

const Err = require('./errors.list');
const sql = require('../sql');

class Joiner {
  constructor(test = Joiner.test) {
    Joiner.test = test;
    this.sql = test ? sql.test : sql;
  }

  static select(pid) {
    let curSql = Joiner.test ? sql.test : sql;
    return curSql.membership.repPendingUsers({pid})
      .then(res => {
        console.log(res);
        let ret = {biz: [], org: []};
        res.forEach(row => {
          let {oid, bid} = row;
          let newRow={}, needle;
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
          if(!newRow.pending)
            newRow.pending = [];
          newRow.pending.push(newPending);
        });
        return Promise.resolve(ret);
      })
  }

  canModifyMembership(pid, mid, aid) {
    let membership;
    let query = aid ? 'getWithLimitedAssoc' : 'getWithAssoc';
    return new Promise((resolve, reject) => {
      this.sql.membership[query]({mid, aid})
        .then(res => {
          if(!res.length)
            reject(Err.badMembership);

          membership = res[0];
          return this.sql.person.isAdmin({pid})
        })
        .then(res => {
          if (res.length) {
            resolve('admin can modify any membership');
          } else if (membership.oid) {
            this.sql.person.orgRep({pid: pid, oid: +membership.oid})
              .then(res => {
                if (!res.length) {
                  reject(Err.notOrgRep);
                } else {
                  resolve("a rep can modify his org's event");
                }
              });
          } else if (membership.bid) {
            this.sql.person.bizRep({pid: pid, bid: +membership.bid})
              .then(res => {
                if (!res.length) {
                  reject(Err.notBizRep);
                } else {
                  resolve("a rep can modify his biz's event");
                }
              });
          } else {
            reject(Err.badMembership);
          }
        })
        .catch(reject)
    });
  }

  saveData(mid, repPid) {
    return this.canModifyMembership(repPid, mid)
      .then(msg => {
        console.log(msg);
        return this.sql.membership.update({is_active: true}, mid);
      });
  }

  delete(mid, aid, repPid) {
    return this.canModifyMembership(repPid, mid, aid)
      .then(msg => {
        console.log(msg);
        return this.sql.membership.delete(mid)
      })
      .then(() => {
        return this.sql.association.delete(aid)
          .then(() => Promise.resolve())
          .catch(err => Promise.resolve());
      })
  }
}

Joiner.test = false;

module.exports = Joiner;