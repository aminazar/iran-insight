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
    ceo_pid: 2,
    org_type_id: 101
  }, {
    oid: 52,
    name: 'Iran Insight',
    name_fa: 'ایران اینسایت',
    ceo_pid: 3,
    org_type_id: null
  }];

let biz_info = [{
  bid: 1,
  name: 'burgista app',
  name_fa: 'برگیستا',
  ceo_pid : 2,
  biz_type_id: 200,
  address: null,
  address_fa: null,
  tel: null,
  url: null,
  general_stats: null,
  financial_stats: null
},{
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
  ceo_pid : 2,
  biz_type_id: 201,
  address: null,
  address_fa: null,
  tel: null,
  url: null,
  general_stats: null,
  financial_stats: null
},{
  bid: 4,
  name: 'fara-dars',
  name_fa: 'فرادرس',
  ceo_pid : 2,
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
    aid : 1,
    pid : 3,
    bid : 1,
    oid : null,
    start_date : null,
    end_date : null
  },{
    aid : 2,
    pid : 2,
    bid : 2,
    oid : null,
    start_date : null,
    end_date : null
  },{
    aid : 3,
    pid : 2,
    bid : null,
    oid : 50,
    start_date : null,
    end_date : null
  },{
    aid : 4,
    pid : 3,
    bid : null,
    oid : 51,
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
    aid : 6,
    pid : null,
    bid : 2,
    oid : 52,
    start_date : null,
    end_date : null
  },{
    aid : 7,
    pid : 2,
    bid : 3,
    oid : null,
    start_date : null,
    end_date : null
  }, {
    aid : 8,
    pid : 2,
    bid : 1,
    oid : null,
    start_date : null,
    end_date : null
  }, {
    aid : 9,
    pid : 2,
    bid : 4,
    oid : null,
    start_date : null,
    end_date : null
  },{
    aid : 10,
    pid : 3,
    bid : 4,
    oid : null,
    start_date : null,
    end_date : null
  },{
    aid : 11,
    pid : 3,
    bid : null,
    oid : 52,
    start_date : null,
    end_date : null
  },{
    aid : 12,
    pid : 3,
    bid : 2,
    oid : null,
    start_date : null,
    end_date : null
  },{
    aid : 13,
    pid : 3,
    bid : 4,
    oid : null,
    start_date : null,
    end_date : null
  }];

let mem_info = [{
  mid : 1,
  assoc_id : 1,
  is_active : false,
  is_representative : true,
  position_id : 300
},{
  mid : 2,
  assoc_id : 2,
  is_active : false,
  is_representative : true,
  position_id : null
},{
  mid : 3,
  assoc_id : 3,
  is_active : false,
  is_representative : true,
  position_id : 305
},{
  mid : 4,
  assoc_id : 4,
  is_active : false,
  is_representative : true,
  position_id : 302
},{
  mid : 5,
  assoc_id : 5,
  is_active : false,
  is_representative : true,
  position_id : null
},{
  mid : 6,
  assoc_id : 1,
  is_active : false,
  is_representative : true,
  position_id : 301
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
},{
  mid : 9,
  assoc_id : 4,
  is_active : false,
  is_representative : true,
  position_id : 304
},{
  mid : 10,
  assoc_id : 4,
  is_active : false,
  is_representative : false,
  position_id : 300
},{
  mid : 11,
  assoc_id : 8,
  is_active : false,
  is_representative : true,
  position_id : 300
},{
  mid : 12,
  assoc_id : 9,
  is_active : false,
  is_representative : false,
  position_id : 300
},{
  mid : 13,
  assoc_id : 10,
  is_active : false,
  is_representative : false,
  position_id : 304
},{
  mid : 14,
  assoc_id : 11,
  is_active : false,
  is_representative : false,
  position_id : 301
},{
  mid : 15,
  assoc_id : 12,
  is_active : false,
  is_representative : false,
  position_id : 300
},{
  mid : 16,
  assoc_id : 13,
  is_active : false,
  is_representative : false,
  position_id : 303
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

describe('Representation-check, GET API', () => {
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
        return lib.dbHelpers.addAndLoginPerson('amin', '123456',extraData = {firstname_en : 'Mr Amin', firstname_fa:'امین', surname_en:'Amini', surname_fa:'امینی'})
      })
      .then((res) => {
        aminPid = res.pid;
        aminJar = res.rpJar;
        return lib.dbHelpers.addAndLoginPerson('reza', '123456')
      })
      .then((res) => {
        rezaPid = res.pid;
        rezaJar = res.rpJar;
      })
      .then(() => { return Promise.all(orgs_type_info.map(el => createNewOrgType(el))) })
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

  it('a normal user() except admin should not be able to get representation requests', done =>{
    return rp({
      method: 'GET',
      uri: lib.helpers.apiTestURL(`user/getRepPendingList`),
      jar: aminJar,
      resolveWithFullResponse: true,
    })
      .then((res) =>{
        expect(res.statusCode).toBe(403);
        done();
      })
      .catch((err)=>{
        console.log(err);
        done();
      })
  })

  it('admin should get all representation requests from users', done => {
    return sql.test.membership.select()
    .then((res) => {
      expect(res.length).toBe(16);  //all membership record numbers
      return rp({
        method: 'GET',
        uri: lib.helpers.apiTestURL(`user/getRepPendingList`),
        jar: adminJar,
        resolveWithFullResponse: true,
      })
      })
      .then((res) =>{
        expect(res.statusCode).toBe(200);
        let data = JSON.parse(res.body); //data is array of pending requests group by different users : data = [ {person : {}, business : [{}], organization : [{}]},... ]
        if(typeof data !== "string") {
          let repPendingLength = 0;        //number of all pending requests from users for orgs & businesses
          let tapsiReps = [];              //number of rep requests(from all users) for tapsi
          data.forEach(el => {
            repPendingLength = repPendingLength + el.business.length + el.organization.length;
          })
          data.forEach(el => {
            el.business.forEach(a => {
              if (a.bizname === "tapsi") tapsiReps.push(a);
            })
          });
          expect(data.length).toBe(2);
          expect(repPendingLength).toBe(10);
          expect(data[0].person.username).toBe('amin');
          expect(data[0].business.length).toBe(4);
          expect(data[1].organization.length).toBe(2);
          expect(tapsiReps.length).toBe(3);
          done();
        }
        else {
          console.log("No new representation request");
          done();
        }
      })
      .catch((err)=>{
        console.log(err);
        done();
      })
  })

});