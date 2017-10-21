const request = require("request");
const base_url = "http://localhost:3000/api/";
const test_query = '?test=tEsT';
const lib = require('../../lib');
const sql = require('../../sql');
let req = request.defaults({jar: true});//enabling cookies
const date = require('../../utils/date');
const error = require('../../lib/errors.list');


let orgs_info = [{
  name: 'bent oak systems',
  name_fa: 'بنتوک سامانه',
  ceo_pid: 1,
  org_type_id: 1
}, {
  name: 'Iran Insight',
  name_fa: 'ایران اینسایت',
  ceo_pid: 2,
  org_type_id: 1
}];

let orgs_lce_info = [{
  oid1: null,
  oid2: null,
  start_date: date.getGregorianNow(),
  start_date_fa: date.getJalaliNow(),
  end_date: date.getGregorianNow(),
  end_date_fa: date.getJalaliNow(),
  description: 'IPO',
  description_fa: 'ورود به بازار سهامی عام',
}, {
  oid1: null,
  oid2: null,
  start_date: date.getGregorianNow(),
  start_date_fa: date.getJalaliNow(),
  end_date: date.getGregorianNow(),
  end_date_fa: date.getJalaliNow(),
  description: 'management change',
  description_fa: 'تغییر مدیریت',
}];


describe("organization_lce", () => {
  let org_lce;


  let createNewOrg = (org_info) => {
    let org = new lib.Organization(true);
    return org.saveData(org_info);

  };

  let createNewOrg_LCE = (org_lce_info) => {
    let org_lce = new lib.OrganizationLCE(true);
    org_lce.saveData(org_lce_info);
  };

  beforeEach(done => {
    sql.test.organization_lce.drop()
      .then(sql.test.lce_type.drop)
      .then(sql.test.organization.drop)
      .then(sql.test.organization.create)
      .then(sql.test.lce_type.create)
      .then(sql.test.organization_lce.create)
      .then(() => {
        done();
      }).catch(err => {
      console.log('err ==> ', err.message);
      done();
    });
  });

  it('/Put: create new LCE for existing organization and return inserted LCE id', done => {


    createNewOrg(orgs_info[0]).then(id => {
      let new_org_lce_info = Object.assign({}, orgs_lce_info[0]);
      new_org_lce_info['oid1'] = id;
      request.put(base_url + 'organization-lce' + test_query, {
        json: true,
        body: new_org_lce_info
      }, function (err, res) {

        expect(res.statusCode).toBe(200);
        expect(res.body).toBeGreaterThan(0);

        done();
      });

    });

  });

  it('/Put: create new LCE for existing organization when oid1 is null and expect error  ', done => {
    createNewOrg(orgs_info[0]).then(id => {

      request.put(base_url + 'organization-lce' + test_query, {
        json: true,
        body: orgs_lce_info[0]
      }, function (err, res) {
        expect(res.body).toBe(error.emptyOId1InLCETable.message);
        expect(res.statusCode).toBe(error.emptyOId1InLCETable.status);
        done();
      });

    });

  });

  it('/Put: create new LCE for existing organization when start date is null and expect error', done => {
    createNewOrg(orgs_info[0]).then(id => {

      let new_org_lce_info = Object.assign({}, orgs_lce_info[0]);
      new_org_lce_info['oid1'] = id;
      new_org_lce_info['start_date'] = null;

      request.put(base_url + 'organization-lce' + test_query, {
        json: true,
        body: new_org_lce_info
      }, function (err, res) {
        expect(res.body).toBe(error.emptyStartDateInLCETable.message);
        expect(res.statusCode).toBe(error.emptyStartDateInLCETable.status);
        done();
      });

    });

  });


  it('/Put: create new LCE for existing organization when start date (farsi) is null and expect error', done => {
    createNewOrg(orgs_info[0]).then(id => {

      let new_org_lce_info = Object.assign({}, orgs_lce_info[0]);
      new_org_lce_info['oid1'] = id;
      new_org_lce_info['start_date_fa'] = null;

      request.put(base_url + 'organization-lce' + test_query, {
        json: true,
        body: new_org_lce_info
      }, function (err, res) {
        expect(res.body).toBe(error.emptyStartDateInLCETable.message);
        expect(res.statusCode).toBe(error.emptyStartDateInLCETable.status);
        done();
      });

    });

  });
  // it("/Get list off orgs_lce and check lce org name by org_id", done => {
  //
  //   createNewOrg(orgs_info[0]).then(org_id => {
  //
  //     let org_lce1 = Object.assign({}, orgs_lce_info[0]);
  //     let org_lce2 = Object.assign({}, orgs_lce_info[1]);
  //     org_lce1.oid1 = org_id;
  //     org_lce1.oid2 = org_id;
  //
  //     createNewOrg_LCE(org_lce1).then(createNewOrg_LCE(org_lce2)).then(() => {
  //       request.get(base_url + `organization/${org_id}/getLCE` + test_query, function (error, response) {
  //         let result = JSON.parse(response.body);
  //         expect(response.statusCode).toBe(200);
  //         expect(result.length).toBe(2);
  //         result.forEach(lce => {
  //           expect(lce['org_name']).toBe(orgs_info[0].name);
  //         });
  //
  //         done();
  //       });
  //     }).catch(err => {
  //       console.log('=> ', err);
  //     });
  //   });
  //
  // });

  // it("/Get organization name, ceo_pid and org_type_id by oid", done => {
  //   request.get(base_url + `organization/${org_info.oid}` + test_query, function (error, response) {
  //     let result = JSON.parse(response.body);
  //     expect(response.statusCode).toBe(200);
  //     expect(result[0].name).toBe(org_info.name);
  //     expect(result[0].name_fa).toBe(org_info.name_fa);
  //     expect(result[0].ceo_pid).toBe(org_info.ceo_pid);
  //     expect(result[0].org_type_id).toBe(org_info.org_type_id);
  //     done();
  //   })
  // });
  //
  // it("/Put new organization", done => {
  //
  //   let new_org = {
  //     name: 'iran insight',
  //     name_fa: 'ایران اینسایت',
  //     ceo_pid: 2,
  //     org_type_id: 1
  //   };
  //   request.put(base_url + 'organization' + test_query, {json: true, body: new_org}, function (error, response) {
  //     console.log('=> ', response);
  //     expect(response.statusCode).toBe(200);
  //     expect(response.body.oid).toBeGreaterThan(0);
  //     done();
  //   });
  //
  // });

});
