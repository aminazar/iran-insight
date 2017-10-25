const rp = require("request-promise");
const lib = require('../../../lib/index');
const sql = require('../../../sql/index');
const moment = require('moment-timezone');
const date = require('../../../utils/date.util');

describe('Get: organization lce', () => {
  let pid1, pid2, pid3;

  let createLCE_Type = (lce_type) => {

    return sql.test.lce_type.add(lce_type);
  };

  let createOrg_Type = (org_type) => {
    return sql.test.organization_type.add(org_type);

  };

  let createOrg = (org) => {

    return sql.test.organization.add(org);
  };

  let createOrg_LCE = (org_lce) => {
    return sql.test.organization_lce.add(org_lce);
  };

  let org_info = [{
    name: 'bent oak systems',
    name_fa: 'بنتوک سامانه',
  }, {
    name: 'Iran Insight',
    name_fa: 'ایران اینسایت',
  }];

  let lce_type_info = [{
    name: 'management change',
    name_fa: 'تغییر میدیرت',
    active: true,
  },
    {
      name: 'merge',
      name_fa: 'ادغام',
      active: true,
    }, {
      name: 'investment',
      name_fa: 'سرمایه گذاری',
      active: true,
    }];

  let org_type_info = [{
    name: 'governmental',
    name_fa: 'دولتی',
    active: true,
  }, {
    name: 'non-governmental',
    name_fa: 'غیر دولتی',
    active: true,
  }];

  beforeEach(function (done) {
    lib.dbHelpers.create()
      .then(() => lib.dbHelpers.addAndLoginPerson('ehsan', '123123123', {}))
      .then(res => {
        pid1 = res.pid;
        return lib.dbHelpers.addAndLoginPerson('ali', '654321', {})
      })
      .then(res => {
        pid2 = res.pid;
        return lib.dbHelpers.addAndLoginPerson('admin', 'admin', {})
      })
      .then(res => {
        pid3 = res.pid;
        done();
      })
      .catch(err => {
        console.error('Setup failure:', err);
        done();
      });
  });
  it('get list of LCE of an organization and check correct organization names', function (done) {
    let org_type1 = Object.assign({id: 1, suggested_by: pid1}, org_type_info[0]);
    let org_type2 = Object.assign({id: 2, suggested_by: pid2}, org_type_info[1]);
    let lce_type1 = Object.assign({id: 1, suggested_by: pid1}, lce_type_info[0]);
    let lce_type2 = Object.assign({id: 2, suggested_by: pid2}, lce_type_info[1]);
    let lce_type3 = Object.assign({id: 3, suggested_by: pid3}, lce_type_info[2]);

    let org1 = Object.assign({oid: 1, ceo_pid: pid1, org_type_id: 1}, org_info[0]);
    let org2 = Object.assign({oid: 2, ceo_pid: pid2,org_type_id: 2}, org_info[1]);
    let org_lce1 = {oid1: 1, start_date: '2017-09-09 10:00:00', lce_type_id: 1};
    let org_lce2 = {oid1: 1, oid2: 2, start_date: '2017-09-10 10:00:00', lce_type_id: 2};
    let org_lce3 = {oid1: 2, start_date: '2017-09-11 10:00:00', lce_type_id: 3};

      createOrg_Type(org_type1)
      .then(() => createOrg_Type(org_type2))
      .then(() => createLCE_Type(lce_type1))
      .then(() => createLCE_Type(lce_type2))
      .then(() => createLCE_Type(lce_type3))
      .then(() => createOrg(org1))
      .then(() => createOrg(org2))
      .then(() => createOrg_LCE(org_lce1))
      .then(() => createOrg_LCE(org_lce2))
      .then(() => createOrg_LCE(org_lce3))
      .then(() => {
        return rp({
          method: 'GET',
          uri: lib.helpers.apiTestURL(`organization-lce/1`),
          resolveWithFullResponse: true,
        })
      })
      .then(res => {
        expect(res.statusCode).toBe(200);

        let data = JSON.parse(res.body);

        expect(data.length).toBe(2);
        if (data.length) {

          expect(data[1]['lce_name']).toBe(lce_type_info[1].name);
          expect(data[1]['lce_name_fa']).toBe(lce_type_info[1].name_fa);
          expect(data[1]['org2_name']).toBe(org_info[1].name);
          expect(data[1]['org2_name_fa']).toBe(org_info[1].name_fa);
        }

        done();
      })
      .catch(err => {
        this.fail(lib.helpers.parseServerErrorToString(err));
        done();
      });
  });
});