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

  canModifyInvestment(pid, organizer_pid, organizer_oid, organizer_bid) {
    return new Promise((resolve, reject) => {
      this.sql.person.isAdmin({pid: pid})
        .then(res => {
          if (res.length) {
            resolve('admin can modify any investment');
          } else if (+pid === +organizer_pid) {
            resolve('a person can modify his investment');
          } else if (organizer_oid) {
            this.sql.person.orgRep({pid: pid, oid: organizer_oid})
              .then(res => {
                if (!res.length) {
                  reject(Err.notInvestmentOwnerOrgRep);
                } else {
                  resolve("a rep can modify his org's investment");
                }
              });
          } else if (organizer_bid) {
            this.sql.person.bizRep({pid: pid, bid: organizer_bid})
              .then(res => {
                if (!res.length) {
                  reject(Err.notInvestmentOwnerBizRep);
                } else {
                  resolve("a rep can modify his biz's investment");
                }
              });
          } else {
            reject(Err.notInvestmentOwner);
          }
        })
        .catch(reject)
    });
  }

  saveData(data, pid, eid) {
    return this.loadOrData(eid, data)
      .then(result => this.canModifyInvestment(pid, result.organizer_pid, result.organizer_oid, result.organizer_bid))
      .then(msg => {
        console.log(msg);
        data.saved_by = pid;
        return super.saveData(data, eid)
      });
  }

  delete(eid, pid) {
    return this.loadOrData(eid)
      .then(result => this.canModifyInvestment(pid, result.organizer_pid, result.organizer_oid, result.organizer_bid))
      .then(msg => {
        console.log(msg);
        return super.delete(eid);
      })
  }
}

Investment.test = false;

module.exports = Investment;