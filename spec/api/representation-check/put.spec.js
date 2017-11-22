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
},{
  id: 102,
  name: 'half-governmental',
  name_fa: 'نیمه دولتی',
  active: true
}];

let biz_type_info = [{
  id: 200,
  name: 'start_up',
  name_fa: 'استارت آپ',
  active : true
}, {
  id: 201,
  name: 'sicence_base',
  name_fa: 'دانش بنیان',
  active : true
},{
  id: 202,
  name: 'research_base',
  name_fa: 'تحقیقاتی',
  active : true
}];

let position_type_info = [{
  id: 300,
  name: 'CEO',
  name_fa: 'مدیر عامل',
  active : true
},{
  id: 301,
  name: 'programmer',
  name_fa: 'برنامه نویس',
  active : true
},{
  id: 302,
  name: 'tester',
  name_fa: 'تستر نرم افزار',
  active : true
},{
  id: 303,
  name: 'accountant',
  name_fa: 'حسابدار',
  active : true
},{
  id: 304,
  name: 'operator',
  name_fa: 'اپراتور',
  active : true
},{
  id: 305,
  name: 'minister',
  name_fa: 'وزیر',
  active : true
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
  bid: 2,
  name: 'snap',
  name_fa: 'اسنپ',
  ceo_pid : 3,
  biz_type_id: 201,
  address: null,
  address_fa: null,
  tel: null,
  url: null,
  general_stats: null,
  financial_stats: null
},{
  bid: 3,
  name: 'tapsi',
  name_fa: 'تپسی',
  ceo_pid : 3,
  biz_type_id: 201,
  address: null,
  address_fa: null,
  tel: null,
  url: null,
  general_stats: null,
  financial_stats: null
}];

let assoc_info = [{
    aid : 2,
    pid : 2,
    bid : 2,
    oid : null,
    start_date : null,
    end_date : null
  },{
    aid : 5,
    pid : 3,
    bid : 3,
    oid : null,
    start_date : null,
    end_date : null
  },{
    aid : 7,
    pid : 2,
    bid : 3,
    oid : null,
    start_date : null,
    end_date : null
  }];

let mem_info = [{
  mid : 2,
  assoc_id : 2,
  is_active : false,
  is_representative : true,
  position_id : null
},{
  mid : 5,
  assoc_id : 5,
  is_active : false,
  is_representative : true,
  position_id : null
},{
  mid : 7,
  assoc_id : 7,
  is_active : false,
  is_representative : true,
  position_id : 300
},{
  mid : 8,
  assoc_id : 7,
  is_active : false,
  is_representative : true,
  position_id : 304
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

describe('Representation-check, PUT API', () => {
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
      .then(() => { return Promise.all(biz_type_info.map(el => createNewBizType(el))) })
      .then(() => { return Promise.all(position_type_info.map(el => createNewPositionType(el))) })
      .then(() => { return Promise.all(orgs_info.map(el => createNewOrg(el))) })
      .then(() => { return Promise.all(biz_info.map(el => createNewBusiness(el))) })
      .then(() => { return Promise.all(assoc_info.map(el => createNewAssociation(el))) })
      .then(() => { return Promise.all(mem_info.map(el => createNewMembership(el))) })
      .then(() => {
        done();
      })
      .catch(err => {
        console.log(err.message);
        done();
      });
  });

  it('admin should be able to activate a right representation request', done => {
    sql.test.membership.get({mid:2})
    .then((res) => {
      expect(res[0].is_active).toBe(false);
      expect(res[0].is_representative).toBe(true);
      return rp({
        method: 'PUT',
        uri: lib.helpers.apiTestURL(`user/confirmRep/2/2`),
        jar: adminJar,
        resolveWithFullResponse: true,
      })
    })
    .then((res) =>{
      expect(res.statusCode).not.toBe(404);
      expect(res.statusCode).not.toBe(403);
      expect(res.statusCode).toBe(200);
      return sql.test.membership.get({mid:2})
    })
    .then((res) =>{
      expect(res[0].is_representative).toBe(true);
      expect(res[0].is_active).toBe(true);
      done();
    })
    .catch((err)=>{
      console.log(err);
      done();
    })
  });

  it('admin should be able to activate another right representation request for a biz/org,and deactive other rep requests for that biz/org', function (done) {
    let temp_aid = 0;
    sql.test.membership.get({mid:8})
      .then(res => {
        temp_aid = res[0].assoc_id;
        expect(res[0].is_active).toBe(false);
        expect(res[0].is_representative).toBe(true);
        return rp({
          method: 'PUT',
          uri: lib.helpers.apiTestURL(`user/confirmRep/8/${temp_aid}`),
          jar: adminJar,
          resolveWithFullResponse: true,
        })
      })
      .then(res => {
        expect(res.statusCode).toBe(200);
        return sql.test.membership.get({mid: 8})
      })
      .then(res => {
        expect(res.length).toBe(1);
        expect(res[0].is_active && res[0].is_representative).toBe(true);  //activate the right representative request for a biz/org
        // let temp_aid = res.aid;
        return sql.test.membership.get({mid:7})
      })
      .then((res) =>{
        expect(res[0].is_representative && res[0].is_active).toBe(false); //deactivate other requests for that activated biz/org
        return sql.test.membership.get({mid:5})
      })
      .then((res) =>{
        expect(res[0].is_representative && res[0].is_active).toBe(false); //deactivate other requests for that activated biz/org
        done();
      })
      .catch(err => {
        this.fail(lib.helpers.parseServerErrorToString(err));
        done();
      });
  });

  it('admin should NOT be able to activate a rep request for a biz/org with representative', function (done) {
    rp({
      method: 'PUT',
      uri: lib.helpers.apiTestURL(`user/confirmRep/8/7`),
      jar: adminJar,
      resolveWithFullResponse: true,
    })
    .then(res => {
      return rp({
        method: 'PUT',
        uri: lib.helpers.apiTestURL(`user/confirmRep/7/7`), //this membership's biz/org already has rep.
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

});