/**
 * Created by Amin on 01/02/2017.
 */
const sql = require('../sql');
const env = require('../env');
const helpers = require('./helpers');
const SqlTable = require('./sqlTable.model');
const error = require('./errors.list');

let tableName = 'organization';
let idMember = 'oid';
let membershipTable = 'membership';

let cols = [
  'oid',
  'name',
  'name_fa',
  'ceo_pid',
  'org_type_id',
];

class Organization extends SqlTable {
  constructor(test = Organization.test) {
    super(tableName, idMember, test, cols);
  }

  saveData(data, id) {
    if (!data.name || !data.name_fa)
      return Promise.reject(error.emptyOrgName);

    return super.saveData(data, id);

  }

  static getById(oid) {
    let curSql = Organization.test ? sql.test : sql;
    return curSql.organization.getById({oid});
  }

  static getAll() {
    let curSql = Organization.test ? sql.test : sql;
    return curSql.organization.getAll();
  }

  setProfile(data, user_id) {
    return new Promise((resolve, reject) => {
      //Check user accessibility
      this.sql[membershipTable].isRepresentativeOrAdmin({pid: user_id})
        .then(res => {
          if (res.length === 0)
            return Promise.reject(error.notAllowed);

          return this.saveData(data, data.oid);
        })
        .then(res => resolve(res))
        .catch(err => {
          console.log(err);
          reject(err);
        });
    });
  }

  setLCE(body, user_id) {
    return new Promise((resolve, reject) => {
      //Check user accessibility
      this.getUserAccess(user_id, body.oid1)
        .then(res => {
          if (res.isAdmin || res.isRep) { // org rep or admin is insert/update lce

            if (!body.id) { // add new expertise

              body.is_confirmed = res.isAdmin;

              this.sql.organization_lce.add(body)
                .then(lceId => {
                    if (!res.isAdmin) {
                      if (body.oid2) {
                        this.sql.person.getUserById({pid: user_id}).then(rep1 => { // send email to rep2 about lce request by rep1
                          this.sql.membership.getOrgRep({oid: body.oid2}).then(rep2 => {
                            helpers.sendMail(`LCE request is received by ${rep1[0].username }`, null, 'lce', rep2[0].username).then(() => {
                            });
                            resolve(lceId);
                          }).catch(err => reject(err));
                        }).catch(err => reject(err));
                      } else resolve(lceId);
                    }
                    else
                      resolve(lceId);

                  }
                ).catch(err => reject(err))

            }
            else { // update expertise

              if (!res.isAdmin) {
                delete body.oid1; // oid1 1 should not be changed during update of lce
                delete body.oid2; // oid2 2 should not be changed during update of lce
                delete body.is_confirmed; // is_confirmed should not change during update of lce
              }
              this.sql.organization_lce.update(body, body.id).then(res => {
                resolve(res);
              }).catch(err => reject(err));
            }
          }
          else {
            reject(error.notAllowed);
          }
        })
        .catch(err => {
          reject(err);
        });
    });

  }

  confirmLCE(user_id, body) {
    return new Promise((resolve, reject) => {


      this.getUserAccess(user_id, body.oid).then(res => {


        if (res.isAdmin || res.isRep) { // org rep or admin is insert/update lce

          if (body.is_confirmed)
            this.sql.organization_lce.update({is_confirmed: body.is_confirmed}, body.id).then(res => {
              resolve(res);
            }).catch(err => reject(err));
          else
            this.sql.organization_lce.delete(body.id).then(res => {
              resolve(res);
            }).catch(err => reject(err));
        } else {
          reject(error.notAllowed);
        }
      })
        .catch(err => {
          reject(err);
        });
    });
  }

  deleteLCE(user_id, body) {
    return new Promise((resolve, reject) => {

      this.sql.organization_lce.get({id: body.id}).then(lce => {
        this.getUserAccess(user_id, lce[0].oid1).then(res => {


          if (res.isAdmin || res.isRep) { // is admin or rep of first org
            this.sql.organization_lce.delete(body.id).then(() => {
              resolve();
            }).catch(err => reject(err));
          } else {
            this.getUserAccess(user_id, lce[0].oid2).then(res => {
              if (res.isAdmin || res.isRep) { // is admin or rep of second org
                this.sql.organization_lce.delete(body.id).then(() => {
                  resolve();
                }).catch(err => reject(err));
              } else
                reject(error.notAllowed);
            }).catch(err => reject(err));
          }
        }).catch(err => reject(err));
      }).catch(err => reject(err));


    });
  }

  getLCE(user_pid, param_oid) {
    return new Promise((resolve, reject) => {

      if (!param_oid)
        reject(error.noOrgId);

      this.getUserAccess(user_pid, param_oid).then(res => {

        if (res.isAdmin || res.isRep) { // rep or admin is not getting org lce

          return this.sql.organization_lce.getAll({oid: param_oid});
        } else {
          return this.sql.organization_lce.getConfirmed({oid: param_oid});
        }
      })
        .then(res => resolve(res))
        .catch(err => {
          reject(err);
        });
    });
  }
  getRequestedLCE(user_pid, param_oid) {
    return new Promise((resolve, reject) => {

      this.getUserAccess(user_pid, param_oid).then(res => {
        if (res.isAdmin || res.isUser) { // rep or admin is confirming get lce requests
          this.sql.organization_lce.getRequested({oid: param_oid}).then(res => {
            resolve(res);
          }).catch(err => reject(err));

        } else {
          reject(error.notAllowed);
        }
      })
        .catch(err => {
          reject(err);
        });
    });
  }

  getUserAccess(user_id, oid) {

    return new Promise((resolve, reject) => {

      let access = {
        isRep: false,
        isAdmin: false
      };

      this.sql[membershipTable].isRepresentativeOrAdmin({pid: user_id, oid: oid, bid: null})
        .then(res => {
          if (res.length === 0) {
            access.isRep = false;
            access.isAdmin = false;
            resolve(access);
          }
          else if (res.length > 1) {
            access.isRep = true;
            access.isAdmin = true;
            resolve(access);
          }
          else if (res.length === 1) {

            access.isAdmin = res[0].is_admin;
            access.isRep = !res[0].is_admin;
            resolve(access);
          }

        }).catch(err => {
        resolve(access)
      });


    });
  }
}

Organization.test = false;
module.exports = Organization;