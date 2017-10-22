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


describe("organization_lce", () => {


  let createNewOrg_LCE = (org_lce_info) => {
    return sql.test.organization_lce.add(org_lce_info);
  };

  let createNewOrg = (org_info) => {

    return sql.test.organization.add(org_info);
  };


  beforeEach(done => {
    sql.test.organization_lce.drop()
      .then(sql.test.lce_type.drop)
      .then(sql.test.organization.drop)
      .then(sql.test.organization_type.drop)
      .then(sql.test.organization_type.create)
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

  it('/Put: create first LCE for organization and return inserted LCE id', done => {

    let new_org_info = Object.assign({}, orgs_info[0]);
    new_org_info.oid = 1;

    let new_org_lce_info = Object.assign({}, orgs_lce_info[0]);
    new_org_lce_info.oid1 = new_org_info.oid;
    new_org_lce_info.current_start_date = date.getGregorianNow();

    createNewOrg(new_org_info)
      .then(() => {
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

  it('/Put: create first LCE for organization when oid1 is null and expect error  ', done => {

    let new_org_info = Object.assign({}, orgs_info[0]);
    new_org_info.oid = 1;

    let new_org_lce_info = Object.assign({}, orgs_lce_info[0]);
    new_org_lce_info.current_start_date = date.getGregorianNow();

    request.put(base_url + 'organization-lce' + test_query, {
      json: true,
      body: new_org_lce_info
    }, function (err, res) {
      expect(res.body).toBe(error.emptyOId1InLCETable.message);
      expect(res.statusCode).toBe(error.emptyOId1InLCETable.status);
      done();
    });

  });

  it('/Put: create new LCE for organization when current start date is null and expect error', done => {

    let new_org_lce_info = Object.assign({}, orgs_lce_info[0]);
    new_org_lce_info.oid1 = 1;

    request.put(base_url + 'organization-lce' + test_query, {
      json: true,
      body: new_org_lce_info
    }, function (err, res) {
      expect(res.body).toBe(error.emptyStartDateInLCETable.message);
      expect(res.statusCode).toBe(error.emptyStartDateInLCETable.status);
      done();
    });


  });

  it('/Put: create new LCE for organization when current start date is smaller than previous end date', done => {


    let new_org_info = Object.assign({}, orgs_info[0]);
    new_org_info.oid = 1;

    let new_org_lce_info = Object.assign({}, orgs_lce_info[0]);
    new_org_lce_info.oid1 = new_org_info.oid;
    new_org_lce_info.current_start_date = '2017-09-12 00:00:00';
    new_org_lce_info.previous_end_date = '2017-09-13 00:00:00';


    createNewOrg(new_org_info).then(()=>{
      request.put(base_url + 'organization-lce' + test_query, {
        json: true,
        body: new_org_lce_info
      }, function (err, res) {
        expect(res.statusCode).toBe(500);
        done();
      });


    });
  });

  it('/Put: update LCE for organization when current start date is bigger than current end date and expect 500 error', done => {


    let new_org_info = Object.assign({}, orgs_info[0]);
    new_org_info.oid = 1;

    let new_org_lce_info = Object.assign({}, orgs_lce_info[0]);
    new_org_lce_info.id = 10;
    new_org_lce_info.oid1 = new_org_info.oid;
    new_org_lce_info.current_start_date = '2017-10-12 00:00:00';


    createNewOrg(new_org_info)
      .then(createNewOrg_LCE(new_org_lce_info))
      .then(() => {
        new_org_lce_info.current_start_date = '2017-11-12 00:00:00';
        new_org_lce_info.current_end_date = '2017-08-12 00:00:00';

        request.put(base_url + 'organization-lce' + test_query, {
          json: true,
          body: new_org_lce_info
        }, function (err, res) {
          expect(res.statusCode).toBe(500);
          done();
        });


      });
  });

  it('/Put: create new LCE for organization which have unclosed lce and expect 500 error => test with two near start time', done => {

    let new_org_info = Object.assign({}, orgs_info[0]);
    new_org_info.oid = 1;

    let new_org_lce_info1 = Object.assign({}, orgs_lce_info[0]);
    new_org_lce_info1.oid1 = new_org_info.oid;
    new_org_lce_info1.current_start_date = date.getGregorianNow();

    let new_org_lce_info2 = Object.assign({}, orgs_lce_info[1]);
    new_org_lce_info2.oid1 = new_org_info.oid;
    new_org_lce_info2.current_start_date = date.getGregorianNow();


    createNewOrg(new_org_info)
      .then(createNewOrg_LCE(new_org_lce_info1))
      .then(() => {
        request.put(base_url + 'organization-lce' + test_query, {
          json: true,
          body: new_org_lce_info2
        }, function (err, res) {
          expect(res.statusCode).toBe(500);
          done();
        });


      });


  });


  it('/Put: create new LCE for organization when previous end date is not null and its corresponding record exists in table', done => {
    let new_org_info = Object.assign({}, orgs_info[0]);
    new_org_info.oid = 1;

    let new_org_lce_info1 = Object.assign({}, orgs_lce_info[0]);
    new_org_lce_info1.id = 10;
    new_org_lce_info1.oid1 = new_org_info.oid;
    new_org_lce_info1.current_start_date = '2017-09-21 00:00:00';
    new_org_lce_info1.current_end_date = '2017-09-28 00:00:00';

    let new_org_lce_info2 = Object.assign({}, orgs_lce_info[1]);
    new_org_lce_info2.id = 10;
    new_org_lce_info2.oid1 = new_org_info.oid;
    new_org_lce_info2.previous_end_date = '2017-09-28 00:00:00';
    new_org_lce_info2.current_start_date = '2017-10-21 00:00:00';


    createNewOrg(new_org_info)
      .then(createNewOrg_LCE(new_org_lce_info1))
      .then(() => {
        request.put(base_url + 'organization-lce' + test_query, {
          json: true,
          body: new_org_lce_info2
        }, function (err, res) {
          expect(res.statusCode).toBe(200);
          expect(res.body).toBeGreaterThan(0);
          done();
        });


      });


  });

  it('/Put: create new LCE for organization when previous end date is not null and its corresponding record does not exist in table and expect 500 error', done => {
    let new_org_info = Object.assign({}, orgs_info[0]);
    new_org_info.oid = 1;

    let new_org_lce_info1 = Object.assign({}, orgs_lce_info[0]);
    new_org_lce_info1.oid1 = new_org_info.oid;
    new_org_lce_info1.current_start_date = '2017-09-21 00:00:00';

    let new_org_lce_info2 = Object.assign({}, orgs_lce_info[1]);
    new_org_lce_info2.oid1 = new_org_info.oid;
    new_org_lce_info2.previous_end_date = '2017-09-28 00:00:00';
    new_org_lce_info2.current_start_date = '2017-10-21 00:00:00';


    createNewOrg(new_org_info)
      .then(createNewOrg_LCE(new_org_lce_info1))
      .then(() => {
        request.put(base_url + 'organization-lce' + test_query, {
          json: true,
          body: new_org_lce_info2
        }, function (err, res) {
          expect(res.statusCode).toBe(500);
          done();
        });


      });


  });
  it('/Put: temporal update => expect 2 records in db that one of them is closed (has end date) ',  done => {
    let new_org_info = Object.assign({}, orgs_info[0]);
    new_org_info.oid = 1;

    let new_org_lce_info1 = Object.assign({}, orgs_lce_info[0]);
    new_org_lce_info1.id = 10;
    new_org_lce_info1.oid1 = new_org_info.oid;
    new_org_lce_info1.current_start_date = '2017-09-21 00:00:00';

    let new_org_lce_info2 = Object.assign({}, orgs_lce_info[1]);
    new_org_lce_info2.id = 10;
    new_org_lce_info2.oid1 = new_org_info.oid;
    new_org_lce_info2.previous_end_date = '2017-09-28 00:00:00';
    new_org_lce_info2.current_start_date = '2017-10-21 00:00:00';


    createNewOrg(new_org_info)
      .then(createNewOrg_LCE(new_org_lce_info1))
      .then(() => {
        request.put(base_url + 'organization-lce' + test_query, {
          json: true,
          body: new_org_lce_info2

        }, function (err, res) {
          expect(res.statusCode).toBe(200);
          done();
        });


      });


  });

});
