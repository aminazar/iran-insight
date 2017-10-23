const request = require("request");
const base_url = "http://localhost:3000/api/";
const test_query = '?test=tEsT';
const lib = require('../../../lib');
const sql = require('../../../sql');
const date = require('../../../utils/date.util');
const error = require('../../../lib/errors.list');


let orgs_info = [{
  oid: null,
  name: 'bent oak systems',
  name_fa: 'بنتوک سامانه',
  ceo_pid: 1,
  org_type_id: 1
}, {
  oid: null,
  name: 'Iran Insight',
  name_fa: 'ایران اینسایت',
  ceo_pid: 2,
  org_type_id: 1
}];

let orgs_lce_info = [{

  oid1: null,
  oid2: null,
  previous_end_date: null,
  current_start_date: null,
  current_end_date: null,
  description: 'IPO',
  description_fa: 'ورود به بازار سهامی عام',
}, {
  oid1: null,
  oid2: null,
  previous_end_date: null,
  current_start_date: null,
  current_end_date: null,
  description: 'management change',
  description_fa: 'تغییر مدیریت',
}];

xdescribe("organization_lce", () => {

  let createNewOrg_LCE = (org_lce_info) => {
    return sql.test.organization_lce.add(org_lce_info);
  };

  let createNewOrg = (org_info) => {

    return sql.test.organization.add(org_info);
  };

  beforeEach(done => {
    lib.dbHelpers.create()
      .then(() => {
        done();
      }).catch(err => {
      console.log('err ==> ', err.message);
      done();
    });
  });

  it("/Get list off orgs_lce and check lce org name by org_id", done => {

    createNewOrg(orgs_info[0]).then(org_id => {

      let org_lce1 = Object.assign({}, orgs_lce_info[0]);
      let org_lce2 = Object.assign({}, orgs_lce_info[1]);
      org_lce1.oid1 = org_id;
      org_lce1.oid2 = org_id;

      createNewOrg_LCE(org_lce1).then(createNewOrg_LCE(org_lce2)).then(() => {
        request.get(base_url + `organization/${org_id}/getLCE` + test_query, function (error, response) {
          let result = JSON.parse(response.body);
          expect(response.statusCode).toBe(200);
          expect(result.length).toBe(2);
          result.forEach(lce => {
            expect(lce['org_name']).toBe(orgs_info[0].name);
          });

          done();
        });
      }).catch(err => {
        console.log('=> ', err);
      });
    });

  });

  it("/Get organization name, ceo_pid and org_type_id by oid", done => {
    request.get(base_url + `organization/${org_info.oid}` + test_query, function (error, response) {
      let result = JSON.parse(response.body);
      expect(response.statusCode).toBe(200);
      expect(result[0].name).toBe(org_info.name);
      expect(result[0].name_fa).toBe(org_info.name_fa);
      expect(result[0].ceo_pid).toBe(org_info.ceo_pid);
      expect(result[0].org_type_id).toBe(org_info.org_type_id);
      done();
    })
  });

  it("/Put new organization", done => {

    let new_org = {
      name: 'iran insight',
      name_fa: 'ایران اینسایت',
      ceo_pid: 2,
      org_type_id: 1
    };
    request.put(base_url + 'organization' + test_query, {json: true, body: new_org}, function (error, response) {
      console.log('=> ', response);
      expect(response.statusCode).toBe(200);
      expect(response.body.oid).toBeGreaterThan(0);
      done();
    });

  });

})

