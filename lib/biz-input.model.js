const SqlTable = require('./sqlTable.model');
const Err = require('./errors.list');

class BizInput extends SqlTable {
  constructor(tableName, columns, test, idColumn, formatter = d => d) {
    super(tableName, idColumn, test, columns);
    this.sqlTable = this.sql[tableName];
    this.formatter = formatter;
  }

  getByBiz(bid) {
    return new Promise((resolve, reject) => {
      this.sqlTable.getByBiz({bid})
        .then(data => resolve(this.formatter(data)))
        .catch(reject);
    });
  }

  getByOrg(oid) {
    return new Promise((resolve, reject) => {
      this.sqlTable.getByOrg({oid})
        .then(data => resolve(this.formatter(data)))
        .catch(reject);
    });
  }

  getByPerson(pid) {
    return new Promise((resolve, reject) => {
      this.sqlTable.getByPerson({pid})
        .then(data => resolve(this.formatter(data)))
        .catch(reject);
    });
  }

  getBizPending(pid) {
    return this.sqlTable.getPendingByBiz({pid})
      .then(data => Promise.resolve(this.formatter(data)));
  }

  getOrgPending(pid) {
    return this.sqlTable.getPendingByOrg({pid})
      .then(data => Promise.resolve(this.formatter(data)));
  }

  getPersonalPending(pid) {
    return this.sqlTable.getPendingByPerson({pid})
      .then(data => Promise.resolve(this.formatter(data)));
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
              this.sql.person.isAdmin({pid:userPid})
                .then(res=>{
                  if(res.length) {
                    data.is_confirmed = true;
                    data.confirmed_by = userPid;
                    saver();
                  } else {
                    reject(Err.notRepOfInvestment);
                  }
                });
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
                  this.sql.person.isAdmin({pid:userPid})
                    .then(res=>{
                      if(res.length) {
                        data.is_confirmed = true;
                        data.confirmed_by = userPid;
                        saver();
                      } else {
                        reject(Err.notRepOfInvestment);
                      }
                    });
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

      this.sqlTable.getWithAssoc({id})
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

  delete(id, userPid) {
    console.log(id,userPid);
    return new Promise((resolve, reject) => {
      let invData;

      this.sqlTable.getWithAssoc({id})
        .then(res => {
          if (res.length) {
            invData = res[0];
            console.log(invData);
            if (invData.pid && +invData.pid === userPid) {
              return Promise.resolve([{pid: userPid}])
            } else if(invData.oid && invData.bid){
              return this.sql.person.orgRep({oid: invData.oid, pid: userPid})
                .then(res => {
                  if(res.length)
                    return Promise.resolve(res);
                  else
                    return this.sql.person.bizRep({bid: invData.bid, pid: userPid});
                });
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
        .then(resolve)
        .catch(reject);
    });
  }
}

module.exports = BizInput;