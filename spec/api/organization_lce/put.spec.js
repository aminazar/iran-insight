const rp = require("request-promise");
const lib = require('../../../lib/index');
const sql = require('../../../sql/index');
const moment = require('moment-timezone');


describe('PUT: organization lce', () => {

  let pid1,pid2,pid3;

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




});
