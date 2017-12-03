const SqlTable = require('./sqlTable.model');
const Err = require('./errors.list');
const Notification = require('./notification.system');
let NotificationCategory = null;
let NF = null;
Notification.setup().then(() => {
  NF = Notification.get();
  NotificationCategory = NF.getNotificationCategory();
});
const Person = require('./person.model');

class BizInput extends SqlTable {
  constructor(tableName, columns, test, idColumn, formatter = d => d) {
    super(tableName, idColumn, test, columns);
    this.tableName = tableName;
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

  savePersonal(bid, pid, data, user, id) {
    return new Promise((resolve, reject) => {
      data.claimed_by = user.pid;
      data.is_confirmed = false;

      let saver = () => {
        this.sql.association.add({bid, pid})
          .then(res => {
            data.assoc_id = res.aid;
            return this.saveData(data, id);
          })
          .then(res => {
            this.sqlTable.getDetails({id: res.id})
              .then(result => {
                let msg = {
                  from: user,
                  about: (this.tableName === 'investment') ? NotificationCategory.PersonClaimInvestmentOnBusiness : NotificationCategory.PersonClaimConsultingBusiness,
                  aboutData: {
                    person_name: Person.getPersonFullName(user),
                    person_username: user.username,
                    business_name: result[0].business_name || result[0].business_name_fa,
                    amount: (this.tableName === 'investment') ? result[0].amount : null,
                    currency: (this.tableName === 'investment') ? result[0].currency : null,
                    subject: (this.tableName === 'consultancy') ? result[0].subject || result[0].subject_fa : null,
                  }
                };

                NF.pushNotification(msg, {bid: bid});
              });

            resolve(res);
          })
          .catch(err => reject(err));
      };

      if (+pid === user.pid) {
        saver();
      } else {
        this.sql.person.bizRep({pid: user.pid, bid})
          .then(res => {
            if (res.length) {
              data.is_claimed_by_biz = true;
              saver();
            } else {
              this.sql.person.isAdmin({pid: user.pid})
                .then(res => {
                  if (res.length) {
                    data.is_confirmed = true;
                    data.confirmed_by = user.pid;
                    saver();
                  } else {
                    reject(Err.notRepOf);
                  }
                });
            }
          })
          .catch(reject);
      }
    });
  }

  saveOrganizational(bid, oid, data, user, id) {
    return new Promise((resolve, reject) => {
      data.claimed_by = user.pid;
      data.is_confirmed = false;

      let saver = () => {
        this.sql.association.add({bid, oid})
          .then(res => {
            data.assoc_id = res.aid;
            return this.saveData(data, id);
          })
          .then(res => {
            this.sqlTable.getDetails({id: res.id})
              .then(result => {
                let msg = {
                  from: user,
                  about: (this.tableName === 'investment') ? NotificationCategory.OrganizationClaimInvestmentOnBusiness : NotificationCategory.OrganizationClaimConsultingBusiness,
                  aboutData: {
                    person_name: Person.getPersonFullName(user),
                    person_username: user.username,
                    business_name: result[0].business_name || result[0].business_name_fa,
                    amount: (this.tableName === 'investment') ? result[0].amount : null,
                    currency: (this.tableName === 'investment') ? result[0].currency : null,
                    subject: (this.tableName === 'consultancy') ? result[0].subject || result[0].subject_fa : null,
                  }
                };

                NF.pushNotification(msg, {bid: bid});
              });

            resolve(res);
          })
          .catch(reject);
      };

      this.sql.person.orgRep({pid: user.pid, oid})
        .then(res => {
          if (res.length) {
            saver();
          } else {
            this.sql.person.bizRep({pid: user.pid, bid})
              .then(res => {
                if (res.length) {
                  data.is_claimed_by_biz = true;
                  saver();
                } else {
                  this.sql.person.isAdmin({pid: user.pid})
                    .then(res => {
                      if (res.length) {
                        data.is_confirmed = true;
                        data.confirmed_by = user.pid;
                        saver();
                      } else {
                        reject(Err.notRepOf);
                      }
                    });
                }
              })
          }
        })
        .catch(reject);
    })
  }

  confirm(id, user) {
    return new Promise((resolve, reject) => {
      let saveData = {
        is_confirmed: true,
        confirmed_by: user.pid,
      };

      let data;

      this.sqlTable.getWithAssoc({id})
        .then(res => {
          if (res.length) {
            data = res[0];
            if (data.is_claimed_by_biz) {
              if (data.oid) {
                return this.sql.person.orgRep({oid: data.oid, pid: user.pid})
              } else if (data.pid && +data.pid === user.pid) {
                return Promise.resolve([{pid: user.pid}])
              } else {
                reject(Err.notConfirmer)
              }
            } else {
              if (data.bid) {
                return this.sql.person.bizRep({bid: data.bid, pid: user.pid})
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
        .then(res => {
          this.sqlTable.getDetails({id: id})
            .then(result => {
              let msg = {
                from: user,
                about: (this.tableName === 'investment') ? NotificationCategory.AcceptInvestment : NotificationCategory.AcceptConsulting,
                aboutData: {
                  business_name: result[0].business_name || result[0].business_name_fa,
                }
              };

              (result[0].person_id) ? this.sql.person.getUserById({pid: result[0].person_id, is_user: true}) : this.sql.organization.getById({oid: result[0].organization_id})
                .then(xData => {
                  let msg_broadcast = {
                    from: user,
                    aboutData: {
                      person_name: result[0].person_id ? Person.getPersonFullName(xData) : null,
                      person_username: result[0].person_id ? xData.username : null,
                      amount: (this.tableName === 'investment') ? result[0].amount : null,
                      currency: (this.tableName === 'investment') ? result[0].currency : null,
                      business_name: result[0].business_name || result[0].business_name_fa,
                      organization_name: !(result[0].person_id) ? xData.org_name || xData.org_name_fa : null,
                      subject: (this.tableName === 'consultancy') ? result[0] : null,
                      id: result[0].person_id || result[0].organization_id
                    }
                  };

                  if(this.tableName === 'investment' && result[0].person_id)
                    msg_broadcast = Object.assign({about: NotificationCategory.PersonInvestsOnBusiness}, msg_broadcast);
                  else if(this.tableName === 'investment' && result[0].organization_id)
                    msg_broadcast = Object.assign({about: NotificationCategory.OrganizationInvestsOnBusiness}, msg_broadcast);
                  else if(this.tableName === 'consultancy' && result[0].person_id)
                    msg_broadcast = Object.assign({about: NotificationCategory.PersonConsultingBusiness}, msg_broadcast);
                  else if(this.tableName === 'consultancy' && result[0].organization_id)
                    msg_broadcast = Object.assign({about: NotificationCategory.OrganizationConsultingOnBusiness}, msg_broadcast);

                  NF.pushNotification(msg_broadcast);
                });

              NF.pushNotification(msg, result[0].person_id ? {pid: result[0].person_id} : {oid: result[0].organization_id});
            });

          resolve(res);
        })
        .catch(reject);
    });
  }

  delete(id, user) {
    return new Promise((resolve, reject) => {
      let data;
      let isApprover = true;

      this.sqlTable.getWithAssoc({id})
        .then(res => {
          if (res.length) {
            data = res[0];
            if (data.pid && +data.pid === user.pid) {
              isApprover = false;
              return Promise.resolve([{pid: user.pid}])
            } else {
              return this.sql.person.isAdmin({pid: user.pid})
                .then(res => {
                  if (res.length) {
                    isApprover = false;
                    return Promise.resolve([{pid: user.pid}]);
                  } else if (data.oid && data.bid) {
                    return this.sql.person.orgRep({oid: data.oid, pid: user.pid})
                      .then(res => {
                        if (res.length) {
                          isApprover = false;
                          return Promise.resolve(res);
                        }else
                          return this.sql.person.bizRep({bid: data.bid, pid: user.pid});
                      });
                  } else if (data.oid) {
                    isApprover = false;
                    return this.sql.person.orgRep({oid: data.oid, pid: user.pid})
                  } else if (data.bid) {
                    return this.sql.person.bizRep({bid: data.bid, pid: user.pid})
                  } else {
                    reject(Err.notAllowed)
                  }
                });
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
        .then(res => {
          this.sqlTable.getDetails({id: data.bid})
            .then(result => {
              let msg = {
                from: user,
                aboutData: {
                  person_name: Person.getPersonFullName(user),
                  person_username: user.username,
                  business_name: result[0].business_name || result[0].business_name_fa,
                  business_id: result[0].business_id,
                },
              };

              if(isApprover && this.tableName === 'investment')
                msg = Object.assign({about: NotificationCategory.RejectInvestmentOnBusiness}, msg);
              else if(isApprover && this.tableName === 'consultancy')
                msg = Object.assign({about: NotificationCategory.RejectConsultancyOnBusiness}, msg);
              else if(!isApprover && this.tableName === 'investment')
                msg = Object.assign({about: NotificationCategory.RemoveInvestmentOnBusiness}, msg);
              else if(!isApprover && this.tableName === 'consultancy')
                msg = Object.assign({about: NotificationCategory.RemoveConsultancyOnBusiness}, msg);

              if(isApprover)
                NF.pushNotification(msg, result[0].person_id ? {pid: result[0].person_id} : {oid: result[0].organization_id});
              else
                NF.pushNotification(msg);
            });

          resolve(res);
        })
        .catch(reject);
    });
  }
}

module.exports = BizInput;
