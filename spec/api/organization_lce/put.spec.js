const rp = require("request-promise");
const lib = require('../../../lib/index');
const sql = require('../../../sql/index');
const moment = require('moment-timezone');
const date = require('../../../utils/date.util');


describe('PUT: organization lce', () => {
  let createOrg_LCE = (org_lce) => {
    return sql.test.organization_lce.add(org_lce);
  };

  let createOrg = (org) => {

    return sql.test.organization.add(org);
  };
  let createLCE_Type = (lce_type) => {

    return sql.test.lce_type.add(lce_type);
  };

  let org_info = [{
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

  let org_lce_info = [{

    description: 'IPO',
    description_fa: 'ورود به بازار سهامی عام',
  }, {
    description: 'management change',
    description_fa: 'تغییر مدیریت',
  }];

  let lce_type_info = [{
    name: 'management change',
    name_fa: 'تغییر میدیرت'
  },
    {
      name: 'merge',
      name_fa: 'ادغام'
    }];

  beforeEach(function (done) {
    lib.dbHelpers.create()
      .then(() => done());
  });

  it('create first LCE for organization and return inserted LCE id', function (done) {

    let lce_type = Object.assign({lce_type_id: 1}, lce_type_info[0]);
    let org = Object.assign({oid: 1}, org_info[0]);
    let org_lce = Object.assign({oid1: 1, start_date: '2017-09-08 10:00:00', lce_type_id: 1}, org_lce_info[0]);

    createLCE_Type(lce_type)
      .then(createOrg(org))
      .then(() => {

        let inserted_lce_id;
        rp({
          method: 'PUT',
          form: org_lce,
          uri: lib.helpers.apiTestURL(`organization-lce`),
          resolveWithFullResponse: true,
        })
          .then(res => {
            inserted_lce_id = +res.body;
            expect(res.statusCode).toBe(200);
            return sql.test.organization_lce.get({id: inserted_lce_id});
          })
          .then(res => {
            let row = res[0];
            expect(row.id).toBe(inserted_lce_id);
            expect(row.oid1).toBe(org_lce.oid1);
            expect(row.lce_type_id).toBe(org_lce.lce_type_id);
            expect(moment.tz(row.start_date, 'Asia/Tehran').format('YYYY-MM-DD HH:mm:ss')).toBe(org_lce.start_date);
            done();
          })
          .catch(err => {
            this.fail(lib.helpers.parseServerErrorToString(err));
            done();
          });
      })

  });
  it('create first LCE for organization when start date is null and Expect error', function (done) {

    let lce_type = Object.assign({lce_type_id: 1}, lce_type_info[0]);
    let org = Object.assign({oid: 1}, org_info[0]);
    let org_lce = Object.assign({oid1: 1, lce_type_id: 1}, org_lce_info[0]);

    createLCE_Type(lce_type)
      .then(createOrg(org))
      .then(() => {

        rp({
          method: 'PUT',
          form: org_lce,
          uri: lib.helpers.apiTestURL(`organization-lce`),
          resolveWithFullResponse: true,
        })
          .then(res => {
            this.fail('did not failed when lce start date is missing');
            done();
          })
          .catch(err => {
            expect(err.statusCode).toBe(500);
            expect(lib.helpers.parseServerErrorToString(err)).toContain('start_date');
            expect(lib.helpers.parseServerErrorToString(err)).toContain('not-null constraint');
            done();
          });
      })

  });

  it('create first LCE for organization when oid 1 is null and Expect error', function (done) {

    let lce_type = Object.assign({lce_type_id: 1}, lce_type_info[0]);
    let org = Object.assign({oid: 1}, org_info[0]);
    let org_lce = Object.assign({start_date: '2017-09-08 10:00:00', lce_type_id: 1}, org_lce_info[0]);

    createLCE_Type(lce_type)
      .then(createOrg(org))
      .then(() => {

        rp({
          method: 'PUT',
          form: org_lce,
          uri: lib.helpers.apiTestURL(`organization-lce`),
          resolveWithFullResponse: true,
        })
          .then(res => {
            this.fail('did not failed when oid1 is missing');
            done();
          })
          .catch(err => {
            expect(err.statusCode).toBe(500);
            expect(lib.helpers.parseServerErrorToString(err)).toContain('oid1');
            expect(lib.helpers.parseServerErrorToString(err)).toContain('not-null constraint');
            done();
          });
      })

  });

  it('create first LCE for organization when lce_type_id is null and Expect error', function (done) {

    let lce_type = Object.assign({lce_type_id: 1}, lce_type_info[0]);
    let org = Object.assign({oid: 1}, org_info[0]);
    let org_lce = Object.assign({oid1: 1, start_date: '2017-09-08 10:00:00'}, org_lce_info[0]);

    createLCE_Type(lce_type)
      .then(createOrg(org))
      .then(() => {

        rp({
          method: 'PUT',
          form: org_lce,
          uri: lib.helpers.apiTestURL(`organization-lce`),
          resolveWithFullResponse: true,
        })
          .then(res => {
            this.fail('did not failed when lce_type_id is missing');
            done();
          })
          .catch(err => {
            expect(err.statusCode).toBe(500);
            expect(lib.helpers.parseServerErrorToString(err)).toContain('lce_type_id');
            expect(lib.helpers.parseServerErrorToString(err)).toContain('not-null constraint');
            done();
          });
      })

  });
});
// describe("organization_lce", () => {
//
//   it('/Put: create first LCE for organization and return inserted LCE id', done => {
//
//     let new_org_info = Object.assign({}, orgs_info[0]);
//     new_org_info.oid = 1;
//
//     let new_org_lce_info = Object.assign({}, orgs_lce_info[0]);
//     new_org_lce_info.oid1 = new_org_info.oid;
//     new_org_lce_info.current_start_date = date.getGregorianNow();
//
//     createNewOrg(new_org_info)
//       .then(() => {
//         request.put(base_url + 'organization-lce' + test_query, {
//           json: true,
//           body: new_org_lce_info
//         }, function (err, res) {
//
//           expect(res.statusCode).toBe(200);
//           expect(res.body).toBeGreaterThan(0);
//
//           done();
//         });
//
//       });
//
//
//   });
//
//   it('/Put: create first LCE for organization when oid1 is null and expect error  ', done => {
//
//     let new_org_info = Object.assign({}, orgs_info[0]);
//     new_org_info.oid = 1;
//
//     let new_org_lce_info = Object.assign({}, orgs_lce_info[0]);
//     new_org_lce_info.current_start_date = date.getGregorianNow();
//
//     request.put(base_url + 'organization-lce' + test_query, {
//       json: true,
//       body: new_org_lce_info
//     }, function (err, res) {
//       expect(res.body).toBe(error.emptyOId1InLCETable.message);
//       expect(res.statusCode).toBe(error.emptyOId1InLCETable.status);
//       done();
//     });
//
//   });
//
//   it('/Put: create new LCE for organization when current start date is null and expect error', done => {
//
//     let new_org_lce_info = Object.assign({}, orgs_lce_info[0]);
//     new_org_lce_info.oid1 = 1;
//
//     request.put(base_url + 'organization-lce' + test_query, {
//       json: true,
//       body: new_org_lce_info
//     }, function (err, res) {
//       expect(res.body).toBe(error.emptyStartDateInLCETable.message);
//       expect(res.statusCode).toBe(error.emptyStartDateInLCETable.status);
//       done();
//     });
//
//
//   });
//
//   it('/Put: create new LCE for organization when current start date is smaller than previous end date', done => {
//
//
//     let new_org_info = Object.assign({}, orgs_info[0]);
//     new_org_info.oid = 1;
//
//     let new_org_lce_info = Object.assign({}, orgs_lce_info[0]);
//     new_org_lce_info.oid1 = new_org_info.oid;
//     new_org_lce_info.current_start_date = '2017-09-12 00:00:00';
//     new_org_lce_info.previous_end_date = '2017-09-13 00:00:00';
//
//
//     createNewOrg(new_org_info).then(() => {
//       request.put(base_url + 'organization-lce' + test_query, {
//         json: true,
//         body: new_org_lce_info
//       }, function (err, res) {
//         expect(res.statusCode).toBe(500);
//         done();
//       });
//
//
//     });
//   });
//
//   it('/Put: update LCE for organization when current start date is bigger than current end date and expect 500 error', done => {
//
//
//     let new_org_info = Object.assign({}, orgs_info[0]);
//     new_org_info.oid = 1;
//
//     let new_org_lce_info = Object.assign({}, orgs_lce_info[0]);
//     new_org_lce_info.id = 10;
//     new_org_lce_info.oid1 = new_org_info.oid;
//     new_org_lce_info.current_start_date = '2017-10-12 00:00:00';
//
//
//     createNewOrg(new_org_info)
//       .then(createNewOrg_LCE(new_org_lce_info))
//       .then(() => {
//         new_org_lce_info.current_start_date = '2017-11-12 00:00:00';
//         new_org_lce_info.current_end_date = '2017-08-12 00:00:00';
//
//         request.put(base_url + 'organization-lce' + test_query, {
//           json: true,
//           body: new_org_lce_info
//         }, function (err, res) {
//           expect(res.statusCode).toBe(500);
//           done();
//         });
//
//
//       });
//   });
//
//   it('/Put: create new LCE for organization which have unclosed lce and expect 500 error => test with two near start time', done => {
//
//     let new_org_info = Object.assign({}, orgs_info[0]);
//     new_org_info.oid = 1;
//
//     let new_org_lce_info1 = Object.assign({}, orgs_lce_info[0]);
//     new_org_lce_info1.oid1 = new_org_info.oid;
//     new_org_lce_info1.current_start_date = date.getGregorianNow();
//
//     let new_org_lce_info2 = Object.assign({}, orgs_lce_info[1]);
//     new_org_lce_info2.oid1 = new_org_info.oid;
//     new_org_lce_info2.current_start_date = date.getGregorianNow();
//
//
//     createNewOrg(new_org_info)
//       .then(createNewOrg_LCE(new_org_lce_info1))
//       .then(() => {
//         request.put(base_url + 'organization-lce' + test_query, {
//           json: true,
//           body: new_org_lce_info2
//         }, function (err, res) {
//           expect(res.statusCode).toBe(500);
//           done();
//         });
//
//
//       });
//
//
//   });
//
//
//   it('/Put: create new LCE for organization when previous end date is not null and its corresponding record exists in table', done => {
//     let new_org_info = Object.assign({}, orgs_info[0]);
//     new_org_info.oid = 1;
//
//     let new_org_lce_info1 = Object.assign({}, orgs_lce_info[0]);
//     new_org_lce_info1.id = 10;
//     new_org_lce_info1.oid1 = new_org_info.oid;
//     new_org_lce_info1.current_start_date = '2017-09-21 00:00:00';
//     new_org_lce_info1.current_end_date = '2017-09-28 00:00:00';
//
//     let new_org_lce_info2 = Object.assign({}, orgs_lce_info[1]);
//     new_org_lce_info2.id = 10;
//     new_org_lce_info2.oid1 = new_org_info.oid;
//     new_org_lce_info2.previous_end_date = '2017-09-28 00:00:00';
//     new_org_lce_info2.current_start_date = '2017-10-21 00:00:00';
//
//
//     createNewOrg(new_org_info)
//       .then(createNewOrg_LCE(new_org_lce_info1))
//       .then(() => {
//         request.put(base_url + 'organization-lce' + test_query, {
//           json: true,
//           body: new_org_lce_info2
//         }, function (err, res) {
//           expect(res.statusCode).toBe(200);
//           expect(res.body).toBeGreaterThan(0);
//           done();
//         });
//
//
//       });
//
//
//   });
//
//   it('/Put: create new LCE for organization when previous end date is not null and its corresponding record does not exist in table and expect 500 error', done => {
//     let new_org_info = Object.assign({}, orgs_info[0]);
//     new_org_info.oid = 1;
//
//     let new_org_lce_info1 = Object.assign({}, orgs_lce_info[0]);
//     new_org_lce_info1.oid1 = new_org_info.oid;
//     new_org_lce_info1.current_start_date = '2017-09-21 00:00:00';
//
//     let new_org_lce_info2 = Object.assign({}, orgs_lce_info[1]);
//     new_org_lce_info2.oid1 = new_org_info.oid;
//     new_org_lce_info2.previous_end_date = '2017-09-28 00:00:00';
//     new_org_lce_info2.current_start_date = '2017-10-21 00:00:00';
//
//
//     createNewOrg(new_org_info)
//       .then(createNewOrg_LCE(new_org_lce_info1))
//       .then(() => {
//         request.put(base_url + 'organization-lce' + test_query, {
//           json: true,
//           body: new_org_lce_info2
//         }, function (err, res) {
//           expect(res.statusCode).toBe(500);
//           done();
//         });
//
//
//       });
//
//
//   });
//   it('/Put: temporal update => expect 2 records in db that one of them is closed (has end date) ', done => {
//     let new_org_info = Object.assign({}, orgs_info[0]);
//     new_org_info.oid = 1;
//
//     let new_org_lce_info1 = Object.assign({}, orgs_lce_info[0]);
//     new_org_lce_info1.id = 10;
//     new_org_lce_info1.oid1 = new_org_info.oid;
//     new_org_lce_info1.current_start_date = '2017-09-21 00:00:00';
//
//     let new_org_lce_info2 = Object.assign({}, orgs_lce_info[1]);
//     new_org_lce_info2.id = 10;
//     new_org_lce_info2.oid1 = new_org_info.oid;
//     new_org_lce_info2.previous_end_date = '2017-09-28 00:00:00';
//     new_org_lce_info2.current_start_date = '2017-10-21 00:00:00';
//
//
//     createNewOrg(new_org_info)
//       .then(createNewOrg_LCE(new_org_lce_info1))
//       .then(() => {
//         request.put(base_url + 'organization-lce' + test_query, {
//           json: true,
//           body: new_org_lce_info2
//
//         }, function (err, res) {
//           expect(res.statusCode).toBe(200);
//           done();
//         });
//
//
//       });
//
//
//   });

