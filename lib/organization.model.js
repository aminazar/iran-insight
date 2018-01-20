/**
 * Created by Amin on 01/02/2017.
 */
const sql = require('../sql');
const env = require('../env');
const helpers = require('./helpers');
const SqlTable = require('./sqlTable.model');
const error = require('./errors.list');
const moment = require('moment');
const Notification = require('./notification.system');
let NotificationCategory = null;
let NF = null;
Notification.setup().then(() => {
  NF = Notification.get();
  NotificationCategory = NF.getNotificationCategory();
});
const Person = require('./person.model');

let tableName = 'organization';
let membershipTable = 'membership';
let idMember = 'oid';

let cols = [
  'oid',
  'name',
  'name_fa',
  'ceo_pid',
  'org_type_id',
  'start_date',
  'end_date',
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
      this.sql.membership.isRepresentativeOrAdmin({
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

  endOrg(oid, user_id, end_date){
    let mid = null;
    let aid = null;

    if(!oid)
      return Promise.reject(error.noOrganizationIdDeclare);

    if(!end_date)
      return Promise.reject(error.noEndDate);

    return this.db.task(t =>
      this.sql[membershipTable].isRepresentativeOrAdmin({
        pid: user_id,
        bid: null,
        oid: oid,
      }, t)
        .then(res => {
          if(!res || res.length <= 0)
            return Promise.reject(error.notOrgRep);

          return this.sql[tableName].getById({oid: oid}, t);
        })
        .then(res => {
          if(!res || res.length <= 0)
            return Promise.reject(error.orgNotFound);

          let endDate = (end_date ? moment(end_date) : moment()).format('YYYY-MM-DD');

          if(moment(res[0].org_start_date).isAfter(endDate))
            return Promise.reject(error.incorrectEndDate);

          return this.sql[tableName].ending({end_date: endDate, oid: oid}, t);
        })
        .then(res => {
          return Promise.resolve('');
        })
        .catch(err => {
          return Promise.reject(err);
        })
    );
  }

  deleteOrg(oid) {
    return this.sql[tableName].delete(oid);
  }
}

Organization.test = false;
module.exports = Organization;