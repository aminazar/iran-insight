/**
 * Created by Amin on 01/02/2017.
 */
const sql = require('../sql');
const env = require('../env');
const helpers = require('./helpers');
const SqlTable = require('./sqlTable.model');
const error = require('./errors.list');
const Notification = require('./notification.system');
let NotificationCategory = null;
let NF = null;
Notification.setup().then(() => {
  NF = Notification.get();
  NotificationCategory = NF.getNotificationCategory();
});
const Person = require('./person.model');

let tableName = 'organization';
let idMember = 'oid';

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
      this.sql[membershipTable].isRepresentativeOrAdmin({
        pid: user_id,
        bid: data.bid ? data.bid : null,
        oid: data.oid ? data.oid : null
      })
        .then(res => {
          if (res.length === 0)
            return Promise.reject(error.notAllowed);

          return this.saveData(data, data.oid);
        })
        .then(res => {
          if (data.oid)
            this.sql[tableName].getById({oid: data.oid})
              .then(res => {
                if (data.oid) {
                  let msg = {
                    from: res[0].oid,
                    about: NotificationCategory.OrganizationUpdateProfile,
                    aboutData: {
                      organization_name: res[0].name || res[0].name_fa,
                      organization_id: res[0].oid,
                    },
                  };

                  NF.pushNotification(msg);
                }
              });

          resolve(res);
        })
        .catch(err => {
          console.log(err);
          reject(err);
        });
    });
  }

  pushingLCENotification(organization_id, lce_description, lce_description_fa, isConfirmed = false, other_organization_id) {
    this.sql[tableName].get({oid: organization_id})
      .then(res => {
        let msg = {
          from: res[0].oid,
          about: isConfirmed ? NotificationCategory.OrganizationAddLifeCycleEvent : NotificationCategory.OrganizationRequestLifeCycleEvent,
          aboutData: {
            organization_name: res[0].name || res[0].name_fa,
            lce_description: lce_description || lce_description_fa,
            organization_id: res[0].oid,
          },
        };

        if(isConfirmed)
          NF.pushNotification(msg);
        else
          NF.pushNotification(msg, {oid: other_organization_id});
      });
  }

  setLCE(body, user_id) {
    return new Promise((resolve, reject) => {
      //Check user accessibility
      this.getUserAccess(user_id, null, body.oid1)
        .then(res => {
          if (res.isAdmin || res.isRep) { // org rep or admin is insert/update lce

            if (!body.id) { // Insert

              body.is_confirmed = res.isAdmin;

              this.sql.organization_lce.add(body)
                .then(lceId => {
                    if (!res.isAdmin) {
                      if (body.oid2) {
                        this.pushingLCENotification(body.oid1, body.description, body.description_fa, body.is_confirmed, body.oid2);
                        resolve(lceId);
                      } else {
                        this.pushingLCENotification(body.oid1, body.description, body.description_fa, true, null);
                        resolve(lceId);
                      }
                    }
                    else {
                      this.pushingLCENotification(body.oid1, body.description, body.description_fa, body.is_confirmed, null);
                      resolve(lceId);
                    }
                  }
                ).catch(err => reject(err))

            }
            else { // Update
              if (!res.isAdmin) {
                delete body.oid1; // oid1 1 should not be changed during update of lce
                delete body.oid2; // oid2 2 should not be changed during update of lce
                delete body.is_confirmed; // is_confirmed should not change during update of lce
              }
              this.sql.organization_lce.update(body, body.id).then(res => {
                this.sql.organization_lce.get({lce_id: body.id})
                  .then(res => this.pushingLCENotification(res[0].oid1, res[0].description, res[0].description_fa, res[0].is_confirmed, res[0].oid2));
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
      let organizationLCEDetails = null;
      this.getUserAccess(user_id, null, body.oid).then(res => {
        if (res.isAdmin || res.isRep) { // org rep or admin is insert/update lce
          if (body.is_confirmed)
            this.sql.organization_lce.update({is_confirmed: body.is_confirmed}, body.id).then(res => {
              this.sql.organization_lce.getOrganizationLCEData({id: body.id})
                .then(res => {
                  let msg_confirm = {
                    from: {oid: body.oid},
                    about: NotificationCategory.OrganizationConfirmLifeCycleEvent,
                    aboutData: {
                      organization_name: res[0].seconder_name || res[0].seconder_name_fa,
                    }
                  };

                  let overall_from = res[0];

                  let msg_broadcast = {
                    about: NotificationCategory.TwoOrganizationAddLifeCycleEvent,
                    aboutData: {
                      organization_name1: res[0].former_name || res[0].former_name_fa,
                      organization_name2: res[0].seconder_name || res[0].seconder_name_fa,
                      lce_description: res[0].description || res[0].description_fa,
                    }
                  };

                  let msg_broadcast_for_former = Object.assign({from: Object.assign({oid: res[0].former_oid}, overall_from)}, msg_broadcast);
                  let msg_broadcast_for_seconder = Object.assign({from: Object.assign({oid: res[0].seconder_oid}, overall_from)}, msg_broadcast);

                  NF.pushNotification(msg_confirm, {oid: res[0].former_oid});
                  NF.pushNotification(msg_broadcast_for_former);
                  NF.pushNotification(msg_broadcast_for_seconder);
                });
              resolve(res);
            }).catch(err => reject(err));
          else
            this.sql.organization_lce.getOrganizationLCEData({id: body.id})
              .then(res => {
                organizationLCEDetails = res[0];
                return this.sql.organization_lce.delete(body.id)
              })
              .then(res => {
                let msg = {
                  from: organizationLCEDetails,
                  about: NotificationCategory.OrganizationRejectLifeCycleEvent,
                  aboutData: {
                    organization_name: organizationLCEDetails.seconder_name || organizationLCEDetails.seconder_name_fa,
                    lce_description: organizationLCEDetails.description || organizationLCEDetails.description_fa,
                  }
                };

                NF.pushNotification(msg, {oid: organizationLCEDetails.former_oid});

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

  deleteLCE(user, body) {
    return new Promise((resolve, reject) => {
      this.sql.organization_lce.getOrganizationLCEData({id: body.id}).then(lce => {
        this.getUserAccess(user.pid, null, lce[0].oid1).then(res => {
          if (res.isAdmin || res.isRep) { // is admin or rep of first org
            this.sql.organization_lce.delete(body.id).then(() => {
              let msg = {
                from: (res.isAdmin) ? user : {oid: lce[0].former_oid},
                about: NotificationCategory.OrganizationRemoveLifeCycleEvent,
                aboutData: {
                  admin_name: Person.getPersonFullName(user),
                  admin_username: user.username,
                  isAdmin: res.isAdmin,
                  organization_name: lce[0].former_name || lce[0].former_name_fa,
                  lce_description: lce[0].description || lce[0].description_fa,
                  organization_id: lce[0].former_oid
                }
              };

              if(res.isAdmin){
                NF.pushNotification(msg, {oid: lce[0].former_oid});
                if(lce[0].seconder_oid)
                  NF.pushNotification(msg, {oid: lce[0].seconder_oid});
              }
              else{
                NF.pushNotification(msg);

                if(lce[0].seconder_oid)
                  NF.pushNotification(msg, {oid: lce[0].seconder_oid});
              }

              resolve();
            }).catch(err => reject(err));
          } else {
            this.getUserAccess(user.pid, null, lce[0].oid2).then(res => {
              if (res.isAdmin || res.isRep) { // is admin or rep of second org
                this.sql.organization_lce.delete(body.id).then(() => {
                  let msg = {
                    from: (res.isAdmin) ? user : {oid: lce[0].seconder_oid},
                    about: NotificationCategory.OrganizationRemoveLifeCycleEvent,
                    aboutData: {
                      admin_name: Person.getPersonFullName(user),
                      admin_username: user.username,
                      isAdmin: res.isAdmin,
                      organization_name: lce[0].seconder_name || lce[0].seconder_name_fa,
                      lce_description: lce[0].description || lce[0].description_fa,
                      organization_id: lce[0].seconder_oid
                    }
                  };

                  if(res.isAdmin){
                    NF.pushNotification(msg, {oid: lce[0].former_oid});
                    if(lce[0].seconder_oid)
                      NF.pushNotification(msg, {oid: lce[0].seconder_oid});
                  }
                  else{
                    NF.pushNotification(msg);
                    NF.pushNotification(msg, {oid: lce[0].former_oid});
                  }

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

      this.getUserAccess(user_pid, null, param_oid).then(res => {

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

      this.getUserAccess(user_pid, null, param_oid).then(res => {
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

  }

Organization.test = false;
module.exports = Organization;