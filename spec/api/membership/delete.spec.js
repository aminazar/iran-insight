const request = require("request");
const lib = require('../../../lib');
const sql = require('../../../sql');
const rp = require("request-promise");
const moment = require('moment');
let req = request.defaults({jar: true}); //enabling cookies
const error = require('../../../lib/errors.list');

describe('POST product API', () => {

  let adminObj = {
    pid: null,
    jar: null,
  };
  let repObj = {
    pid: null,
    jar: null,
  };
  let normalUserObj = {
    pid: null,
    jar: null,
  };

  let biz_info = [{
    bid: 1,
    name: 'hakupian',
    name_fa: 'هاکوپیان',
    ceo_pid: null,
    biz_type_id: null,
    address: 'Iran-Qom',
    address_fa: 'ایران - قم',
    tel: '025 77307730',
    url: null,
    general_stats: null,
    financial_stats: null
  }];

  let position_type_info = [{
    id: 300,
    name: 'CEO',
    name_fa: 'مدیر عامل',
    active: true
  }, {
    id: 301,
    name: 'programmer',
    name_fa: 'برنامه نویس',
    active: true
  }];

  let assoc_info = [{
    pid: 3,
    bid: 1,
    oid: null,
  }];
  let mem_info = [{
    assoc_id: 1,
    is_active: true,
    is_representative: false,
    position_id: 300,
  }];

  beforeEach(done => {
    lib.dbHelpers.create()
      .then(() => {
        return lib.dbHelpers.addAndLoginPerson('admin', 'test', {display_name_en: 'DNE'})
      })
      .then((res) => {
        adminObj.pid = res.pid;
        adminObj.jar = res.rpJar;
        return lib.dbHelpers.addAdmin(adminObj.pid);
      })
      .then((res) => {
        return lib.dbHelpers.addAndLoginPerson('repUser', '123', {display_name_en: 'DNE'})
      })
      .then((res) => {
        repObj.pid = res.pid;
        repObj.jar = res.rpJar;
        return lib.dbHelpers.addAndLoginPerson('normalUser', '123', {display_name_en: 'DNE'})
      })
      .then((res) => {
        normalUserObj.pid = res.pid;
        normalUserObj.jar = res.rpJar;
        done();
      })
      .catch(err => {
        console.log(err);
        done();
      });
  });

  it('admin should be able to delete a membership', done =>  {
    sql.test.business.add(biz_info[0])
      .then(res => {
        return sql.test.position_type.add(position_type_info[0])
      })
      .then(res => {
        return sql.test.association.add(assoc_info[0])
      })
      .then(res => {
        mem_info[0].assoc_id = res.aid;
        return sql.test.membership.add(mem_info[0])
      })
      .then(res => {
        return rp({
          method: 'DELETE',
          uri: lib.helpers.apiTestURL(`joiner/delete/membership/${res.mid}`),
          jar: adminObj.jar,
          resolveWithFullResponse: true,
        })
      })
      .then(res => {
        expect(res.statusCode).toBe(200);
        return sql.test.membership.select()
      })
      .then(res => {
        expect(res.length).toBe(0);
        done();
      })
      .catch(err => {
        console.log(err.message);
        done();
      });
  })

  it('should threw an error if admin is going to delete a not exist membership', function (done) {
    sql.test.business.add(biz_info[0])
      .then(res => {
        return sql.test.position_type.add(position_type_info[0])
      })
      .then(res => {
        return sql.test.association.add(assoc_info[0])
      })
      .then(res => {
        mem_info[0].assoc_id = res.aid;
        return sql.test.membership.add(mem_info[0])
      })
      .then(res => {
        return rp({
          method: 'DELETE',
          uri: lib.helpers.apiTestURL(`joiner/delete/membership/10`),
          jar: adminObj.jar,
          resolveWithFullResponse: true,
        })
      })
      .then(res => {
        this.fail('There is no membership whith mid 10');
        done();
      })
      .catch(err => {
        expect(err.statusCode).toBe(500);
        done();
      });
  })
})