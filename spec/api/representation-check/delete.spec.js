const request = require("request");
const lib = require('../../../lib');
const sql = require('../../../sql');
const rp = require("request-promise");
let req = request.defaults({jar: true});//enabling cookies

let orgs_type_info = [{
  id: 100,
  name: 'governmental',
  name_fa: 'دولتی',
  active: true
}, {
  id: 101,
  name: 'non-governmental',
  name_fa: 'غیر دولتی',
  active: true
}, {
  id: 102,
  name: 'half-governmental',
  name_fa: 'نیمه دولتی',
  active: true
}];

let biz_type_info = [{
  id: 200,
  name: 'start_up',
  name_fa: 'استارت آپ',
  active: true
}, {
  id: 201,
  name: 'sicence_base',
  name_fa: 'دانش بنیان',
  active: true
}, {
  id: 202,
  name: 'research_base',
  name_fa: 'تحقیقاتی',
  active: true
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
}, {
  id: 302,
  name: 'tester',
  name_fa: 'تستر نرم افزار',
  active: true
}, {
  id: 303,
  name: 'accountant',
  name_fa: 'حسابدار',
  active: true
}, {
  id: 304,
  name: 'operator',
  name_fa: 'اپراتور',
  active: true
}, {
  id: 305,
  name: 'minister',
  name_fa: 'وزیر',
  active: true
}];

let orgs_info = [
  {
    oid: 50,
    name: 'IT Ministry',
    name_fa: 'وزارت ارتباطات',
    ceo_pid: 2,
    org_type_id: 100
  }, {
    oid: 51,
    name: 'bent oak systems',
    name_fa: 'بنتوک سامانه',
    ceo_pid: 3,
    org_type_id: 101
  }, {
    oid: 52,
    name: 'Iran Insight',
    name_fa: 'ایران اینسایت',
    ceo_pid: 2,
    org_type_id: null
  }];

let biz_info = [{
  bid: 1,
  name: 'burgista app',
  name_fa: 'برگیستا',
  ceo_pid: 1,
  biz_type_id: 200,
  address: null,
  address_fa: null,
  tel: null,
  url: null,
  general_stats: null,
  financial_stats: null
}, {
  bid: 2,
  name: 'snap',
  name_fa: 'اسنپ',
  ceo_pid: 3,
  biz_type_id: 201,
  address: null,
  address_fa: null,
  tel: null,
  url: null,
  general_stats: null,
  financial_stats: null
}, {
  bid: 3,
  name: 'tapsi',
  name_fa: 'تپسی',
  ceo_pid: 3,
  biz_type_id: 201,
  address: null,
  address_fa: null,
  tel: null,
  url: null,
  general_stats: null,
  financial_stats: null
}, {
  bid: 4,
  name: 'fara-dars',
  name_fa: 'فرادرس',
  ceo_pid: 2,
  biz_type_id: 202,
  address: null,
  address_fa: 'تهران - هفت تیر',
  tel: '02188888888',
  url: null,
  general_stats: null,
  financial_stats: null
}];

let assoc_info = [
  {
    aid: 1,
    pid: 3,
    bid: 1,
    oid: null,
    start_date: null,
    end_date: null
  }, {
    aid: 3,
    pid: 2,
    bid: null,
    oid: 50,
    start_date: null,
    end_date: null
  }, {
    aid: 7,
    pid: 2,
    bid: 3,
    oid: null,
    start_date: null,
    end_date: null
  }, {
    aid: 8,
    pid: 2,
    bid: 1,
    oid: null,
    start_date: null,
    end_date: null
  }];

let mem_info = [{
  mid: 1,
  assoc_id: 1,
  is_active: false,
  is_representative: true,
  position_id: 300
}, {
  mid: 3,
  assoc_id: 3,
  is_active: false,
  is_representative: true,
  position_id: 305
}, {
  mid: 6,
  assoc_id: 1,
  is_active: false,
  is_representative: true,
  position_id: 301
}, {
  mid: 7,
  assoc_id: 7,
  is_active: true,
  is_representative: false,
  position_id: 300
}, {
  mid: 11,
  assoc_id: 8,
  is_active: false,
  is_representative: true,
  position_id: 300
}];
///////////////////////////////////////////////
let createNewOrgType = (org_type_info) => {

  return sql.test.organization_type.add(org_type_info);
};

let createNewBizType = (biz_type_info) => {

  return sql.test.business_type.add(biz_type_info);
};

let createNewPositionType = (position_type_info) => {

  return sql.test.position_type.add(position_type_info);
};

let createNewOrg = (org_info) => {

  return sql.test.organization.add(org_info);
};

let createNewBusiness = (biz_info) => {

  return sql.test.business.add(biz_info);
};

let createNewMembership = (mem_info) => {

  return sql.test.membership.add(mem_info);
};

let createNewAssociation = (biz_info) => {

  return sql.test.association.add(biz_info);
};

describe('Representation-check, DELETE API', () => {
  let adminPid, aminPid, rezaPid, adminJar, aminJar, rezaJar;
  beforeEach(done => {
    lib.dbHelpers.create()
      .then(() => {
        return lib.dbHelpers.addAndLoginPerson('admin', 'test')
      })
      .then((res) => {
        adminPid = res.pid;
        adminJar = res.rpJar;
        return lib.dbHelpers.addAdmin(adminPid);
      })
      .then(() => {
        return lib.dbHelpers.addAndLoginPerson('amin', '123456')
      })
      .then((res) => {
        aminPid = res.pid;
        aminJar = res.rpJar;
        return lib.dbHelpers.addAndLoginPerson('reza', '123456')
      })
      .then((res) => {
        rezaPid = res.pid;
        rezaJar = res.rpJar;
        return Promise.all(orgs_type_info.map(el => createNewOrgType(el)))
      })
      .then(() => {
        return Promise.all(biz_type_info.map(el => createNewBizType(el)))
      })
      .then(() => {
        return Promise.all(position_type_info.map(el => createNewPositionType(el)))
      })
      .then(() => {
        return Promise.all(orgs_info.map(el => createNewOrg(el)))
      })
      .then(() => {
        return Promise.all(biz_info.map(el => createNewBusiness(el)))
      })
      .then(() => {
        return Promise.all(assoc_info.map(el => createNewAssociation(el)))
      })
      .then(() => {
        return Promise.all(mem_info.map(el => createNewMembership(el)))
      })
      .then(() => {
        done();
      })
      .catch(err => {
        console.log(err.message);
        done();
      });
  });

  it('admin should be able to delete a false representation request, convert him to a usual user', function (done) {
    sql.test.membership.get({mid: 11})
      .then(res => {
        expect(res[0].is_active).toBe(false);
        expect(res[0].is_representative).toBe(true);
        return rp({
          method: 'DELETE',
          uri: lib.helpers.apiTestURL(`joiner/deleteRep/11`),
          jar: adminJar,
          resolveWithFullResponse: true,
        })
      })
      .then(res => {
        expect(res.statusCode).toBe(200);
        return sql.test.membership.get({mid: 11})
      })
      .then((res) => {
        expect(res[0].is_active).toBe(true);
        expect(res[0].is_representative).toBe(false);
        done();
      })
      .catch(err => {
        this.fail(lib.helpers.parseServerErrorToString(err));
        done();
      });
  });

  it('admin should NOT be able to delete a representation request and  convert him to a usual user,with representative', function (done) {
    sql.test.membership.get({mid: 7})
      .then(res => {
        expect(res[0].is_active).toBe(true);
        expect(res[0].is_representative).toBe(false); //mid 7 is related to a biz/org with active representative
        return rp({
          method: 'DELETE',
          uri: lib.helpers.apiTestURL(`joiner/deleteRep/7`),
          jar: adminJar,
          resolveWithFullResponse: true,
        })
      })
      .then(() => {
        this.fail('this organization or business already has representative');
        done();
      })
      .catch(err => {
        expect(err.statusCode).toBe(500);
        done();
      });
  });

  it('admin should be able to delete a false representation request from all related tables except(maybe) association', function (done) {
    let temp_aid;
    sql.test.membership.get({mid: 3})
      .then(res => {
        temp_aid = res[0].assoc_id;
        expect(res[0].is_active).toBe(false);
        expect(res[0].is_representative).toBe(true);
        return rp({
          method: 'DELETE',
          uri: lib.helpers.apiTestURL(`joiner/deleteRepBizOrg/3`),
          jar: adminJar,
          resolveWithFullResponse: true,
        })
      })
      .then((res) => {
        expect(res.statusCode).toBe(200);
        return sql.test.membership.get({mid: 3})
      })
      .then(res => {
        expect(res.length).toBe(0);
        return sql.test.association.get({aid: temp_aid})
      })
      .then((res) => {
        expect(res.length).toBe(0);
        return sql.test.organization.get({name: 'IT Ministry'})
      })
      .then(res => {
        expect(res.length).toBe(0);
        done();
      })
      .catch(err => {
        this.fail(lib.helpers.parseServerErrorToString(err));
        done();
      });
  });

  it('admin should be able to delete a false representation request from all related tables, except association', function (done) {
    let temp_aid;
    sql.test.membership.get({mid: 6})
      .then(res => {
        temp_aid = res[0].assoc_id;
        expect(res[0].is_active).toBe(false);
        expect(res[0].is_representative).toBe(true);
        return rp({
          method: 'DELETE',
          uri: lib.helpers.apiTestURL(`joiner/deleteRepBizOrg/6`),
          jar: adminJar,
          resolveWithFullResponse: true,
        })
      })
      .then(res => {
        expect(res.statusCode).toBe(200);
        return sql.test.membership.get({mid: 6})
      })
      .then(res => {
        expect(res.length).toBe(0);
        return sql.test.association.get({aid: temp_aid}) //can not delete from association table because another membership record has this assoc_id too.
      })
      .then(res => {
        expect(res.length).not.toBe(0);
        done();
      })
      .catch(err => {
        this.fail(lib.helpers.parseServerErrorToString(err));
        done();
      });
  });
});