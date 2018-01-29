/**
 * Created by Amin on 01/02/2017.
 */

const Err = require('./errors.list');
const Person = require('./person.model');
const sql = require('../sql');
const env = require('../env');
const moment = require('moment');
const Notification = require('./notification.system');
let NotificationCategory = null;
let NF = null;
Notification.setup().then(() => {
  NF = Notification.get();
  NotificationCategory = NF.getNotificationCategory();
});

class Joiner {
  constructor(test = Joiner.test) {
    Joiner.test = test;
    this.sql = test ? sql.test : sql;
    Person.test = Joiner.test;
    this.db = test ? env.testDb : env.db;
  }

  static select(pid) {
    let curSql = Joiner.test ? sql.test : sql;
    return new Promise((resolve, reject) => {
      curSql.membership.repPendingUsers({pid})
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
            } else reject(Err.badDataInDatabase);

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

            if (Object.keys(newPending).length)
              newRow.pending.push(newPending);
          });
          resolve(ret);
        })
    });
  }

  canModifyMembership(pid, mid, aid) {
    let membership;
    let query = aid ? 'getWithLimitedAssoc' : 'getWithAssoc';
    return new Promise((resolve, reject) => {
      return this.db.task(task => {
        console.log(query);
        return this.sql.membership[query]({mid, aid}, task)
          .then(res => {
            if (!res.length)
              reject(Err.badMembership);

            membership = res[0];
            return this.sql.person.isAdmin({pid}, task)
          })
          .then(res => {
            if (res.length) {
              resolve('admin can modify any membership');
            } else if (membership.oid) {
              return this.sql.person.orgRep({pid: pid, oid: +membership.oid}, task)
                .then(res => {
                  if (!res.length) {
                    reject(Err.notOrgRep);
                  } else {
                    resolve("a rep can modify his org's event");
                  }
                });
            } else if (membership.bid) {
              return this.sql.person.bizRep({pid: pid, bid: +membership.bid}, task)
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
      })
    });
  }

  saveData(mid, user) {
    return new Promise((resolve, reject) => {
      return this.db.task(task => {
        return this.canModifyMembership(user.pid, mid, null, task)
          .then(msg => {
            console.log(msg);
            return this.sql.membership.update({is_active: true}, mid, task);
          })
          .then(res => {
            this.sql.membership.getBizOrgNameById({mid: mid}, task)
              .then(result => {
                let msg = {
                  from: user,
                  about: NotificationCategory.PersonJoinTo,
                  aboutData: {
                    is_business: result[0].is_biz,
                    org_biz_name: result[0].name || result[0].name_fa,
                  }
                };

                NF.pushNotification(msg, {pid: result[0].pid});
              });

            resolve(res);
          })
          .catch(err => reject(err));
      })
    });
  }


  delete(mid, aid, user) {
    return new Promise((resolve, reject) => {
      let orgBizData = null;
      return this.db.task(task => {
        return this.canModifyMembership(user.pid, mid, aid, task)
          .then(msg => {
            console.log(msg);
            return this.sql.membership.getBizOrgNameById({mid: mid}, task);
          })
          .then(res => {
            orgBizData = res[0];
            console.log(orgBizData);
            return this.sql.membership.delete(mid, task)
          })
          .then(() => {
            return this.sql.association.delete(aid)
              .then(() => Promise.resolve())
              .catch(err => Promise.resolve());
          })
          .then(res => {
            let msg = {
              from: user,
              about: NotificationCategory.PersonRejectJoinRequest,
              aboutData: {
                is_business: orgBizData.is_biz,
                org_biz_name: orgBizData.name || orgBizData.name_fa,
              }
            };

            NF.pushNotification(msg, {pid: orgBizData.pid});

            resolve(res);
          })
          .catch(err => reject(err));
      })
    });
  }

  getOrgBizMembers(bid, oid, offset = 0, limit = null) {
    return this.sql.membership.getOrgBizMembers({bid, oid, offset, limit})
  }

  getSpecialMembershipByMid(bid, oid, mid) {
    return this.sql.membership.getSpecialDetailedMembershipByMid({bid, oid, mid});
  }

  static findRepRequests() {
    let curSql = Joiner.test ? sql.test : sql;
    let repInfo = [];
    return this.db.task(task => {
      return curSql[tableName].getListOfRepresentationRequests(task)
        .then(res => {
          if (res.length === 0)
            resolve('No new representative request.');
          else if (res.length > 0) {
            res.forEach(el => {
              let tempObj = repInfo.find(i => i.person.pid === el.pid);
              if (tempObj) {
                if (el.bid)
                  tempObj.business.push({
                    bizname: el.biz_name,
                    bizname_fa: el.biz_name_fa,
                    bizceo_name_fa: el.biz_ceo_first_name_fa,
                    bizceo_name_en: el.biz_ceo_first_name_en,
                    bizceo_surname_fa: el.biz_ceo_sur_name_fa,
                    bizceo_surname_en: el.biz_ceo_sur_name_en,
                    biz_type_name_fa: el.biz_type_name_fa,
                    biz_type_name_en: el.biz_type_name_en,
                    bizaddress: el.biz_address,
                    bizaddress_fa: el.biz_address_fa,
                    biztel: el.biz_tel,
                    bizurl: el.biz_url,
                    bizgeneral_stats: el.biz_general_stats,
                    bizfinancial_stats: el.biz_financial_stats,
                    biz_position: el.pos_id ? el.position_name_fa : null
                  });

                if (el.oid)
                  tempObj.organization.push({
                    orgname: el.org_name,
                    orgname_fa: el.org_name_fa,
                    orgceo_pid: el.org_ceo_pid,
                    orgceo_name_fa: el.org_ceo_first_name_fa,
                    orgceo_name_en: el.org_ceo_first_name_en,
                    orgceo_surname_fa: el.org_ceo_sur_name_fa,
                    orgceo_surname_en: el.org_ceo_sur_name_en,
                    org_type_name_fa: el.org_type_name_fa,
                    org_type_name_en: el.org_type_name_en,
                    org_position: el.pos_id ? el.position_name_fa : null
                  });
              }
              else {
                repInfo.push({
                  person: {
                    pid: el.pid,
                    firstname_en: el.first_name_en,
                    firstname_fa: el.first_name_fa,
                    surname_en: el.surname_en,
                    surname_fa: el.surname_fa,
                    username: el.username,
                    display_name_en: el.display_name_en,
                    display_name_fa: el.display_name_fa
                  },
                  business: el.bid ? [{
                    bizname: el.biz_name,
                    bizname_fa: el.biz_name_fa,
                    bizceo_pid: el.biz_ceo_pid,
                    bizceo_name_fa: el.biz_ceo_first_name_fa,
                    bizceo_name_en: el.biz_ceo_first_name_en,
                    bizceo_surname_fa: el.biz_ceo_sur_name_fa,
                    bizceo_surname_en: el.biz_ceo_sur_name_en,
                    biz_type_name_fa: el.biz_type_name_fa,
                    biz_type_name_en: el.biz_type_name_en,
                    bizaddress: el.biz_address,
                    bizaddress_fa: el.biz_address_fa,
                    biztel: el.biz_tel,
                    bizurl: el.biz_url,
                    bizgeneral_stats: el.biz_general_stats,
                    bizfinancial_stats: el.biz_financial_stats,
                    biz_position: el.pos_id ? el.position_name_fa : null
                  }] : [],
                  organization: el.oid ? [{
                    orgname: el.org_name,
                    orgname_fa: el.org_name_fa,
                    orgceo_pid: el.org_ceo_pid,
                    orgceo_name_fa: el.org_ceo_first_name_fa,
                    orgceo_name_en: el.org_ceo_first_name_en,
                    orgceo_surname_fa: el.org_ceo_sur_name_fa,
                    orgceo_surname_en: el.org_ceo_sur_name_en,
                    org_type_name_fa: el.org_type_name_fa,
                    org_type_name_en: el.org_type_name_en,
                    org_position: el.pos_id ? el.position_name_fa : null
                  }] : []
                });
              }
            });
            console.log(JSON.stringify(repInfo, null, 2));
            resolve(repInfo);
          }
        })
    });
  }

  static confirmRepByAdmin(mid, aid, user) {
    let curSql = Joiner.test ? sql.test : sql;
    return this.db.task(task => {
      return curSql.membership.checkIfRepIsExist({aid: aid}, task)
        .then((res) => {
          if (res.length === 1) {
            return curSql.membership.update({is_active: true}, mid, task);
          }
          else if (res.length > 1) {
            return Promise.all(res.map(el => {
              if (el.mid === parseInt(mid)) {
                return curSql.membership.update({is_active: true}, mid, task);
              }
              else {
                return curSql.membership.update({is_representative: false}, el.mid, task);
              }
            }))
          }
          else if (res.length === 0) {
            reject(Err.hasRepresentative);
          }
        })
        .then(() => {
          curSql.membership.getBizOrgNameById({mid: mid}, task)
            .then(res => {
              let msg = {
                from: user,
                about: NotificationCategory.AcceptRepRequest,
                aboutData: {
                  person_name: Person.getPersonFullName(user),
                  person_username: user.username,
                  org_biz_name: res[0].name || res[0].name_fa,
                  is_business: res[0].is_biz,
                }
              };

              let msg_broadcast = {
                from: user,
                about: NotificationCategory.UpdateBusinessOrganizationRep,
                aboutData: {
                  person_name: Person.getPersonFullName(user),
                  person_username: user.username,
                  org_biz_name: res[0].name || res[0].name_fa,
                  is_business: res[0].is_biz,
                  id: res[0].id,
                }
              };

              NF.pushNotification(msg, {pid: res[0].pid});
              NF.pushNotification(msg_broadcast);
            });

          resolve();
        })
    })
  }

  static deleteRepRequest(user, mid) {
    let curSql = Joiner.test ? sql.test : sql;
    return this.db.task(task => {
      return curSql.membership.get({mid: mid}, task)
        .then(res => {
          if (res[0].is_representative === false)
            reject(Err.hasRepresentative);
          else {
            return curSql.membership.update({is_representative: false, is_active: true}, mid, task);
          }
        })
        .then(() => {
          curSql.membership.getBizOrgNameById({mid: mid}, task)
            .then(res => {
              let msg = {
                from: user,
                about: NotificationCategory.RejectRepRequest,
                aboutData: {
                  person_name: Person.getPersonFullName(user),
                  person_username: user.username,
                  org_biz_name: res[0].name || res[0].name_fa,
                  is_business: res[0].is_biz,
                }
              };

              NF.pushNotification(msg, {pid: res[0].pid});
            });

          resolve();
        })
    });
  }

  static deleteRepAndHisCompany(mid) {
    let curSql = Joiner.test ? sql.test : sql;
    return this.db.task(task => {
      let assocMemberObj = {};
      return curSql.membership.getWithAssoc({mid: mid}, task)
        .then(res => {
          if (res[0].is_representative === false)
            reject(Err.hasRepresentative);
          else {
            assocMemberObj = res[0];
            return curSql.membership.delete(assocMemberObj.mid, task);
          }
        })
        .then(() => {
          return curSql.association.delete(assocMemberObj.assoc_id, task)
            .catch(err => resolve())
        })
        .then(() => {
          if (assocMemberObj.bid) {
            return curSql.business.delete(assocMemberObj.bid, task)
              .catch(err => resolve())
          }
          else {
            return curSql.organization.delete(assocMemberObj.oid, task)
              .catch(err => resolve())
          }
        })
    });
  }

  deleteUserMembership(mid, pid) {    //admin can delete a membership of every one.
    let curSql = Joiner.test ? sql.test : sql;
    return this.db.task(task => {
      return curSql.person.isAdmin({pid: pid}, task)
        .then(res => {
          if (res.length > 0) {    //admin is going to delete a membership
            return curSql.membership.get({mid: mid}, task)
              .then((res) => {
                if (res.length === 1)
                  return curSql.membership.delete(mid, task);
                else
                  return Promise.reject(Err.badMembership);
              })
          }
          else return Promise.reject(Err.adminOnly);
        })
    })
  }

  upsertMembership(data, pid) {
    console.log('====>',data);
    let assoc_info = {
      pid: data.pid ? data.pid : null,
      bid: data.bid ? data.bid : null,
      oid: data.oid ? data.oid : null,
      start_time: (data.start_time ? moment(data.start_time) : moment()).format('YYYY-MM-DD'),
    };
    let mem_info = {
      is_active: data.is_active,
      is_representative: data.is_representative,
      start_time: (data.start_time ? moment(data.start_time) : moment()).format('YYYY-MM-DD'),
      end_time: data.end_time ? moment(data.end_time).format('YYYY-MM-DD') : null,
      position_id: data.position_id ? data.position_id : null,
    };

    let query = data.bid ? 'getBizRep' : 'getOrgRep';
    let bizOrgId = data.bid ? data.bid : data.oid;

    if (data.end_time !== null) {
      if (moment(data.start_time).format('YYYY-MM-DD') > moment(data.end_time).format('YYYY-MM-DD'))
        return Promise.reject(Err.notValidEndDate);
    }
    return this.db.task(task => {
      return this.sql.person.isAdmin({pid: pid},task)
        .then(res => {
          if (res.length < 0)

            return Promise.reject(Err.adminOnly);
          else
            return this.sql.membership[query]({bid: bizOrgId, oid: bizOrgId}, task)
        })
        .then(res => {
          if (res.length > 0 && data.is_representative === true && (mem_info.end_time === null || mem_info.end_time > moment().format('YYYY-MM-DD')) && ((!data.mid) || (data.mid && data.pid !== res[0].pid))) {
            return Promise.reject(Err.hasRepresentative);
          }
          else if (!data.mid) {
            return this.sql.association.getSpecialAssoc({pid: data.pid, bid: data.bid, oid: data.oid}, task)
              .then((res) => {
                if (res.length === 0) {
                  console.log('admin insert new membership (assocication not exists)');
                  return this.sql.association.add(assoc_info, null, task)
                    .then((res) => {
                      mem_info.assoc_id = +res.aid;
                      return this.sql.membership.add(mem_info, task)
                    })
                }
                else {
                  console.log('admin insert new membership (assocication exists)');
                  mem_info.assoc_id = res[0].aid;
                  return this.sql.membership.add(mem_info, task)
                }
              })
          }
          else { //admin update a membership
            console.log('admin update membership : ' + data.mid);
            return this.sql.membership.update(mem_info, data.mid, task);
          }
        })
    })
  }

  updateMembershipForUser(membership_id, data, pid) {
    //TODO delete a false data entry in membership(for example typing error)
    let curSql = Joiner.test ? sql.test : sql;
    let dest_person_id;
    let dest_bid;
    let dest_oid;
    let dest_aid;
    let dest_end_time;
    let dest_Is_Rep = false;
    let resultIsRep = false;
    let resultIsActive = false;
    return this.db.task(task => {
      return curSql.membership.getWithAssoc({mid: membership_id}, task)
        .then((res) => {
          if (res !== undefined && res.length > 0) {
            dest_person_id = res[0].pid;
            dest_aid = res[0].aid;
            dest_bid = (res[0].bid !== null) ? res[0].bid : null;
            dest_oid = (res[0].oid !== null) ? res[0].oid : null;
            dest_Is_Rep = res[0].is_representative;
            resultIsRep = dest_Is_Rep;
            dest_end_time = res[0].end_time;
            return super.getUserAccess(pid, dest_bid, dest_oid, task)
          }
          else return Promise.reject(Err.notAbleToChangePosition);
        })
        .then((res) => {
          if (res.isAdmin === true) {
            if (dest_end_time === null || dest_end_time > new Date()) {
              resultIsActive = true;
              return curSql.membership.update({end_time: new Date()}, membership_id, task);
            }
            else if (dest_end_time < new Date())
              return Promise.reject(Err.membershipIsFinished);
          }
          else if (res.isRep === true) { // !!rep of a biz/org is going to update his membership
            if (dest_end_time === null || dest_end_time > new Date()) {
              resultIsActive = true;
              return curSql.membership.update({end_time: new Date()}, membership_id, task);
            }
            else if (dest_end_time < new Date())
              return Promise.reject(Err.membershipIsFinished);
          }
          else if (dest_person_id === pid) {
            if (dest_end_time === null || dest_end_time > new Date()) {
              resultIsActive = true;
              return curSql.membership.update({end_time: new Date()}, membership_id, task);
            }
            else if (dest_end_time < new Date())
              return Promise.reject(Err.membershipIsFinished);
          }
          else
            return Promise.reject(Err.notAbleToChangePosition);
        })
        .then((res) => {
          let temp_start_time = (data.start_time !== null && data.start_time !== undefined) ? data.start_time : moment.utc(new Date()).format();
          let temp_end_time = (data.end_time !== null && data.end_time !== undefined) ? data.end_time : null;
          return curSql.membership.add({
            assoc_id: dest_aid,
            is_active: resultIsActive,
            is_representative: resultIsRep,
            position_id: data.position_id,
            start_time: temp_start_time,
            end_time: temp_end_time
          }, task);
        })
    })
  }
}

Joiner.test = false;

module.exports = Joiner;
