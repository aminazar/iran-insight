const SqlTable = require('./sqlTable.model');
const moment = require('moment');
const Err = require('./errors.list');

let tableName = 'investment';
let idColumn = 'id';
let columns = [
  "assoc_id",
  "amount",
  "currency",
  "investment_cycle",
  "is_lead",
  "claimed_by",
  "confirmed_by",
  "is_claimed_by_biz",
  "is_confirmed",
  "saved_at",
];

let formatMoneyData = data => {
  return data.map(row => {
    row.amount = row.amount ? row.amount.substring(1).replace(',', '') : data.amount;
    return row;
  });
};

class Investment extends SqlTable {
  constructor(test = Investment.test) {
    Investment.test = test;
    super(tableName, idColumn, test, columns);
  }

  getByBiz(bid) {
    return new Promise((resolve, reject) => {
      this.sql.investment.getByBiz({bid})
        .then(data => resolve(formatMoneyData(data)))
        .catch(reject);
    });
  }

  getByOrg(oid) {
    return new Promise((resolve, reject) => {
      this.sql.investment.getByOrg({oid})
        .then(data => resolve(formatMoneyData(data)))
        .catch(reject);
    });
  }

  getByPerson(pid) {
    return new Promise((resolve, reject) => {
      this.sql.investment.getByPerson({pid})
        .then(data => resolve(formatMoneyData(data)))
        .catch(reject);
    });
  }

  savePersonal(bid, pid, data, userPid, id) {
    return new Promise((resolve, reject) => {
      data.claimed_by = userPid;
      data.is_confirmed = false;

      let saver = () => {
        this.sql.association.add({bid, pid})
          .then(res => {
            data.assoc_id = res.aid;
            return this.saveData(data, id);
          })
          .then(res => resolve(res))
          .catch(err => reject(err));
      };

      if (+pid === userPid) {
        saver();
      } else {
        this.sql.person.bizRep({pid: userPid, bid})
          .then(res => {
            if (res.length) {
              data.is_claimed_by_biz = true;
              saver();
            } else {
              reject(Err.notBizRep);
            }
          })
          .catch(reject);
      }
    });
  }

  saveOrganizational(bid, oid, data, userPid, id) {
    return new Promise((resolve, reject) => {
      data.claimed_by = userPid;
      data.is_confirmed = false;

      let saver = () => {
        this.sql.association.add({bid, oid})
          .then(res => {
            data.assoc_id = res.aid;
            return this.saveData(data, id);
          })
          .then(resolve)
          .catch(reject);
      };

      this.sql.person.orgRep({pid: userPid, oid})
        .then(res => {
          if (res.length) {
            saver();
          } else {
            this.sql.person.bizRep({pid: userPid, bid})
              .then(res => {
                if (res.length) {
                  data.is_claimed_by_biz = true;
                  saver();
                } else {
                  reject(Err.notRepOfInvestment)
                }
              })
          }
        })
        .catch(reject);
    })
  }

  confirm(id, userPid) {
    return new Promise((resolve, reject) => {
      let saveData = {
        is_confirmed: true,
        confirmed_by: userPid,
      };

      let invData;

      this.sql.investment.getWithAssoc({id})
        .then(res => {
          if (res.length) {
            invData = res[0];
            if (invData.is_claimed_by_biz) {
              if (invData.oid) {
                return this.sql.person.orgRep({oid: invData.oid, pid: userPid})
              } else if (invData.pid && +invData.pid === userPid) {
                return Promise.resolve([{pid: userPid}])
              } else {
                reject(Err.notConfirmer)
              }
            } else {
              if (invData.bid) {
                return this.sql.person.bizRep({bid: invData.bid, pid: userPid})
              } else {
                reject(Err.notBizRep)
              }
            }
          } else {
            reject(Err.badDataInRequest);
          }
        })
        .then(res => {
          if (res.length) {
            return this.saveData(saveData, id)
          } else {
            reject(Err.notConfirmer);
          }
        })
        .then(resolve)
        .catch(reject);
    });
  }

  delete(id, pid) {
    return new Promise((resolve, reject) => {
      let invData;

      this.sql.investment.getWithAssoc({id})
        .then(res => {
          if (res.length) {
            invData = res[0];
            if (invData.pid && +invData.pid === userPid) {
              return Promise.resolve([{pid: userPid}])
            } else if (invData.oid) {
              return this.sql.person.orgRep({oid: invData.oid, pid: userPid})
            } else if (invData.bid) {
              return this.sql.person.bizRep({bid: invData.bid, pid: userPid})
            } else {
              reject(Err.notAllowed)
            }
          } else {
            reject(Err.badDataInRequest);
          }
        })
        .then(res => {
          if (res.length) {
            return super.delete(id)
          } else {
            reject(Err.notAllowed);
          }
        })
        .catch(reject);
    });
  }
}

Investment.test = false;

module.exports = Investment;
