const rp = require("request-promise");
const lib = require('../../../lib/index');
const sql = require('../../../sql/index');
const moment = require('moment-timezone');


describe('PUT: organization lce', () => {

  let createOrg = (org) => {

    return sql.test.organization.add(org);
  };
  let createLCE_Type = (lce_type) => {

    return sql.test.lce_type.add(lce_type);
  };

  let createOrg_LCE = (org_lce) => {
    return sql.test.organization_lce.add(org_lce);
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

  it('create LCE for organization and return inserted LCE id', function (done) {

    let lce_type = Object.assign({lce_type_id: 1}, lce_type_info[0]);
    let org = Object.assign({oid: 1}, org_info[0]);
    let org_lce = Object.assign({
      oid1: 1,
      start_date: moment.utc('2017-09-08 10:00:00').format(),
      lce_type_id: 1
    }, org_lce_info[0]);

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

            expect(moment.utc(row.start_date).format()).toBe(moment.utc(org_lce.start_date).format());
            done();
          })
          .catch(err => {
            this.fail(lib.helpers.parseServerErrorToString(err));
            done();
          });
      })

  });
  it('create LCE for organization when start date is null and Expect error', function (done) {

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

  it('create LCE for organization when oid 1 is null and Expect error', function (done) {

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

  it('create LCE for organization when lce_type_id is null and Expect error', function (done) {

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
      });
  });
  it('create duplicate LCE for organization and expect Error => same oid1, start_date and lce_type_id', function (done) {

    let lce_type = Object.assign({lce_type_id: 1}, lce_type_info[0]);
    let org = Object.assign({oid: 1}, org_info[0]);
    let org_lce1 = Object.assign({oid1: 1, start_date: '2017-09-08 10:00:00', lce_type_id: 1}, org_lce_info[0]);
    let org_lce2 = Object.assign({oid1: 1, start_date: '2017-09-08 10:00:00', lce_type_id: 1}, org_lce_info[0]);

    createLCE_Type(lce_type)
      .then(createOrg(org))
      .then(createOrg_LCE(org_lce1))
      .then(() => {

        rp({
          method: 'PUT',
          form: org_lce2,
          uri: lib.helpers.apiTestURL(`organization-lce`),
          resolveWithFullResponse: true,
        })
          .then(res => {
            this.fail('did not failed when 2 lce are duplicate');
            done();
          })
          .catch(err => {
            expect(err.statusCode).toBe(500);
            expect(lib.helpers.parseServerErrorToString(err)).toContain('duplicate_records');
            done();
          });
      })

  });


});
