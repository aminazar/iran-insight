const request = require("request");
const base_url = "http://localhost:3000/api/";
const test_query = '?test=tEsT';
const lib = require('../../lib');
const sql = require('../../sql');
let req = request.defaults({jar: true});//enabling cookies

let resExpect = (res, statusCode) => {
  if (res.statusCode !== statusCode) {
    let jres = JSON.parse(res.body);
    let msg = jres.Message ? jres.Message : jres;
    expect(res.statusCode).toBe(statusCode, `Expected response code ${statusCode}, received ${res.statusCode}. Server response: ${msg}`);
    if (jres.Stack) {
      let err = new Error();
      err.message = jres.Message;
      err.stack = jres.Stack;
      console.log(`Server responds with unexpected error:`, err);
    }
    return false;
  }
  return true;
};


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

let orgs_type_info = [{
  id: 100,
  name: 'governmental',
  name_fa: 'دولتی'
}, {
  id: 101,
  name: 'non-governmental',
  name_fa: 'غیر دولتی'
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
    pid : 1,
    bid : 2,
    oid : null,
    start_date : null,
    end_date : null
  },{
    aid : 3,
    pid : 1,
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
  ceo_pid : 3,
  biz_type_id: 201,
  address: null,
  address_fa: null,
  tel: null,
  url: null,
  general_stats: null,
  financial_stats: null
}];

let biz_type_info = [{
  id: 200,
  name: 'start_up',
  name_fa: 'استارت آپ'
}, {
  id: 201,
  name: 'sicence_base',
  name_fa: 'دانش بنیان'
}];

let mem_info = [{
  mid : 1,
  assoc_id : 1,
  is_active : false,
  is_representative : true,
  position_id : null
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
  position_id : null
},{
  mid : 4,
  assoc_id : 4,
  is_active : false,
  is_representative : true,
  position_id : null
},{
  mid : 5,
  assoc_id : 5,
  is_active : false,
  is_representative : true,
  position_id : null
}]

describe("Admin can get all representation requests from users and send them activation E-mail if they are right.", () => {
  let setup = true;

  let createNewOrg = (org_info) => {

    return sql.test.organization.add(org_info);
  };

  let createNewOrgType = (org_type_info) => {

    return sql.test.organization_type.add(org_type_info);
  };

  let createNewBizType = (biz_type_info) => {

    return sql.test.business_type.add(biz_type_info);
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


  beforeEach(done => {
    if (setup) {
      lib.dbHelpers.create()
        .then(() => lib.dbHelpers.addPerson('amin', 'test'))
        .then(id => {
          console.log('id', id);
          pid1 = id;
          setup = false;
          return lib.dbHelpers.addPerson('Admin', 'atest')
        })
        .then(aid => {
          adminPid = aid;
          return lib.dbHelpers.addAdmin(adminPid);
        })
        .then(res => {
          return lib.dbHelpers.addPerson('Reza', 'test');
        })
        .then(id =>{
          pid2 = id;
          createNewOrgType(orgs_type_info[0])
        })
        .then(() => createNewOrg(orgs_info[0]))
        .then(() => createNewOrgType(orgs_type_info[1]))
        .then(() =>createNewOrg(orgs_info[1]))
        .then(() => createNewOrg(orgs_info[2]))
        .then(() => createNewBizType(biz_type_info[0]))
        .then(() => createNewBusiness(biz_info[0]))
        .then(() => createNewBizType(biz_type_info[1]))
        .then(() => createNewBusiness(biz_info[1]))
        .then(() => createNewBusiness(biz_info[2]))
        .then(() =>  createNewAssociation(assoc_info[0]))
        .then(() =>  createNewAssociation(assoc_info[1]))
        .then(() =>  createNewAssociation(assoc_info[2]))
        .then(() =>  createNewAssociation(assoc_info[3]))
        .then(() =>  createNewAssociation(assoc_info[4]))
        .then(() =>  createNewAssociation(assoc_info[5]))
        .then(() =>  createNewMembership(mem_info[0]))
        .then(() =>  createNewMembership(mem_info[1]))
        .then(() =>  createNewMembership(mem_info[2]))
        .then(() =>  createNewMembership(mem_info[3]))
        .then(()=>{
          createNewMembership(mem_info[4])
          done();
        })
        .catch(err => {
          console.log('===> ',err.message);
          done();
        });
    }
    else {
      done();
    }
  });


  it("logins as amin", done => {
    req.post({
      url: base_url + 'login' + test_query,
      form: {username: 'amin', password: 'test'}
    }, (err, res) => {
      expect(res.statusCode).toBe(200);
      done();
    })
  });

  it("amin (a user exept admin) should not be able to get representation requests", done =>{
    req.get(base_url + 'user/checkifrep' +test_query , (err, res) => {
      expect(res.statusCode).toBe(403);
      done();
    })
  });

  it("logs out a user(amin)", done => {
    req.get(base_url + 'logout' + test_query, (err, res) => {
      expect(res.statusCode).toBe(200);
      done();
    });
  });

  it("should not be able to get list of rep requests bofore login ", done =>{
    req.get(base_url + 'user/checkifrep' + test_query, (err, res) => {
      expect(res.statusCode).toBe(403);
      done();
    })
  });

  it("should logins as representative of a business", done=>{
    req.post({
      url: base_url + 'login' + test_query,
      form: {username: 'amin', password: 'test'}
    }, (err, res) => {
      expect(res.statusCode).toBe(200);
      done();
    })
  })

  it("logins as admin", done => {
    req.post({
      url: base_url + 'login' + test_query,
      form: {username: 'admin', password: 'atest'}
    }, (err, res) => {
      expect(res.statusCode).toBe(200);
      done();
    })
  });

  it("admin should get all representation requests from users and send activation E-mail to them if they are right", done =>{
    req.get(base_url + 'user/checkifrep' + test_query, (err, res) => {
      expect(res.statusCode).not.toBe(404);
      expect(res.statusCode).not.toBe(500);
      expect(res.statusCode).toBe(200);
      console.log('========>res:aaa: ', res.body);
      let data = JSON.parse(res.body);
      expect(data.length).toBe(2);
      console.log(data);
      done();
    })
  });

  it("logs out a user(admin)", done => {
    req.get(base_url + 'logout' + test_query, (err, res) => {
      expect(res.statusCode).toBe(200);
      done();
    });
  });

  it("logs out a user(admin) - checking it happened", done => {
    req.get(base_url + 'user/checkifrep' + test_query, (err, res) => {
      expect(res.statusCode).toBe(403);
      done();
    });
  });

});