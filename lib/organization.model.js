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


  }

Organization.test = false;
module.exports = Organization;