const request = require("request");
const base_url = "http://localhost:3000/api/";
const test_query = '?test=tEsT';
const lib = require('../../lib');
const sql = require('../../sql');
const rp = require("request-promise");
let req = request.defaults({jar: true});//enabling cookies


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

let biz_info = [{
  bid: 1,
  name: 'burgista app',
  name_fa: 'برگیستا',
  ceo_pid : 1,
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
},{
  bid: 4,
  name: 'fara-dars',
  name_fa: 'فرادرس',
  ceo_pid : 1,
  biz_type_id: 202,
  address: null,
  address_fa: 'تهران - هفت تیر',
  tel: '02188888888',
  url: null,
  general_stats: null,
  financial_stats: null
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
}]

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
  },{
    aid : 7,
    pid : 1,
    bid : 3,
    oid : null,
    start_date : null,
    end_date : null
  }, {
    aid : 8,
    pid : 1,
    bid : 1,
    oid : null,
    start_date : null,
    end_date : null
  }, {
    aid : 9,
    pid : 1,
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
}];



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

  let createNewPositionType = (position_type_info) => {

    return sql.test.position_type.add(position_type_info);
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
        .then(() => createNewOrgType(orgs_type_info[2]))
        .then(() =>createNewOrg(orgs_info[1]))
        .then(() => createNewOrg(orgs_info[2]))
        .then(() => createNewBizType(biz_type_info[0]))
        .then(() => createNewBusiness(biz_info[0]))
        .then(() => createNewBizType(biz_type_info[1]))
        .then(() => createNewBizType(biz_type_info[2]))
        .then(() => createNewBusiness(biz_info[1]))
        .then(() => createNewBusiness(biz_info[2]))
        .then(() => createNewBusiness(biz_info[3]))
        .then(() =>  createNewAssociation(assoc_info[0]))
        .then(() =>  createNewAssociation(assoc_info[1]))
        .then(() =>  createNewAssociation(assoc_info[2]))
        .then(() =>  createNewAssociation(assoc_info[3]))
        .then(() =>  createNewAssociation(assoc_info[4]))
        .then(() =>  createNewAssociation(assoc_info[5]))
        .then(() =>  createNewAssociation(assoc_info[6]))
        .then(() =>  createNewAssociation(assoc_info[7]))
        .then(() =>  createNewAssociation(assoc_info[8]))
        .then(() =>  createNewAssociation(assoc_info[9]))
        .then(() =>  createNewAssociation(assoc_info[10]))
        .then(() =>  createNewAssociation(assoc_info[11]))
        .then(() =>  createNewPositionType(position_type_info[0]))
        .then(() =>  createNewPositionType(position_type_info[1]))
        .then(() =>  createNewPositionType(position_type_info[2]))
        .then(() =>  createNewPositionType(position_type_info[3]))
        .then(() =>  createNewPositionType(position_type_info[4]))
        .then(() =>  createNewPositionType(position_type_info[5]))
        .then(() =>  createNewMembership(mem_info[0]))
        .then(() =>  createNewMembership(mem_info[1]))
        .then(() =>  createNewMembership(mem_info[2]))
        .then(() =>  createNewMembership(mem_info[3]))
        .then(() =>  createNewMembership(mem_info[4]))
        .then(() =>  createNewMembership(mem_info[5]))
        .then(() =>  createNewMembership(mem_info[6]))
        .then(() =>  createNewMembership(mem_info[7]))
        .then(() =>  createNewMembership(mem_info[8]))
        .then(() =>  createNewMembership(mem_info[9]))
        .then(() =>  createNewMembership(mem_info[10]))
        .then(() =>  createNewMembership(mem_info[11]))
        .then(() =>  createNewMembership(mem_info[12]))
        .then(() =>  createNewMembership(mem_info[13]))
        .then(() =>  createNewMembership(mem_info[14])
        )
        .then(() => {
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

  it("no one should be able to get list of rep requests before login ", done =>{
    req.get(base_url + 'user/getRepPendingList' + test_query, (err, res) => {
      expect(res.statusCode).toBe(403);
      done();
    })
  });

  it("amin logins, as representative of a business", done => {
    req.post({
      url: base_url + 'login' + test_query,
      form: {username: 'amin', password: 'test'}
    }, (err, res) => {
      expect(res.statusCode).toBe(200);
      done();
    })
  });

  it("amin (a user exept admin) should not be able to get representation requests", done =>{
    req.get(base_url + 'user/getRepPendingList' +test_query , (err, res) => {
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

  it("logins as admin", done => {
    req.post({
      url: base_url + 'login' + test_query,
      form: {username: 'admin', password: 'atest'}
    }, (err, res) => {
      expect(res.statusCode).toBe(200);
      done();
    })
  });

  it("admin should get all representation requests from users", done =>{
    req.get(base_url + 'user/getRepPendingList' + test_query, (err, res) => {
      expect(res.statusCode).not.toBe(404);
      expect(res.statusCode).not.toBe(403);
      expect(res.statusCode).not.toBe(500);
      expect(res.statusCode).toBe(200);
      let data = JSON.parse(res.body);
      expect(data.length).toBe(2);
      let x = (data[0].person.pid === 1 ? data[0] : data[1]);
      let y = (data[0].person.pid === 3 ? data[0] : data[1]);
      expect(x.business.length).toBe(4);
      expect(x.organization.length).toBe(1);
      expect(y.business.length).toBe(3);
      expect(y.organization.length).toBe(2);
      done();
    })
  });

  it('admin should be able to activate a right representation request, and send activation E-mail to him if he is right', function (done) {
    let jar;
    sql.test.membership.get({mid:2})
      .then(res => {
        expect(res[0].is_active).toBe(false);
        jar = rp.jar();
        return rp({
          method: 'POST',
          uri: lib.helpers.apiTestURL('login'),
          form:{username: 'admin', password :'atest'},
          withCredentials: true,
          jar : jar,
        })
      })
      .then(() =>{
        return rp({
          method: 'PUT',
          uri: lib.helpers.apiTestURL(`user/confirmRep/2/2`),
          jar: jar,
          resolveWithFullResponse: true,
        })
      })
      .then(res => {
        expect(res.statusCode).toBe(200);
        sql.test.membership.get({mid:2})
          .then(res => {
            expect(res[0].is_active).toBe(true);
            req.get(base_url + 'user/getRepPendingList' + test_query, (err, res) => {
              expect(res.statusCode).toBe(200);
              let data = JSON.parse(res.body);
              expect(data.length).toBe(2);
              let x = (data[0].person.pid === 1 ? data[0] : data[1]);
              let y = (data[0].person.pid === 3 ? data[0] : data[1]);
              expect(x.business.length).toBe(3);
              expect(x.organization.length).toBe(1);
              expect(y.business.length).toBe(3);
              expect(y.organization.length).toBe(2);
              done();
            })
          });
      })
      .catch(err => {
        this.fail(lib.helpers.parseServerErrorToString(err));
        done();
      });
  });

  it('admin should be able to activate another right representation request for a biz/org,and deactive other rep requests for that biz/org', function (done) {
    let jar;
    sql.test.membership.get({mid:8})
      .then(res => {
        expect(res[0].is_active).toBe(false);
        jar = rp.jar();
        return rp({
          method: 'POST',
          uri: lib.helpers.apiTestURL('login'),
          form:{username: 'admin', password :'atest'},
          withCredentials: true,
          jar : jar,
        })
      })
      .then(() =>{
        return rp({
          method: 'PUT',
          uri: lib.helpers.apiTestURL(`user/confirmRep/8/7`),
          jar: jar,
          resolveWithFullResponse: true,
        })
      })
      .then(res => {
        expect(res.statusCode).toBe(200);
        sql.test.membership.get({mid:8})
          .then(res => {
            expect(res.length).toBe(1);
            expect(res[0].is_active).toBe(true);
            req.get(base_url + 'user/getRepPendingList' + test_query, (err, res) => {
              expect(res.statusCode).toBe(200);
              let data = JSON.parse(res.body);
              expect(data.length).toBe(2);
              let x = (data[0].person.pid === 1 ? data[0] : data[1]);
              let y = (data[0].person.pid === 3 ? data[0] : data[1]);
              expect(x.business.length).toBe(1);
              expect(x.organization.length).toBe(1);
              expect(y.business.length).toBe(2);
              expect(y.organization.length).toBe(2);
              done();
            })
          })
          .then(() =>{
            sql.test.membership.get({mid:5})
              .then(res => {
                expect(res.length).toBe(1);
                expect(res[0].is_active).toBe(false);
                expect(res[0].is_representative).toBe(false);
                done();
              })
            })
       })
      .catch(err => {
        this.fail(lib.helpers.parseServerErrorToString(err));
        done();
      });
  });

  it('admin should NOT be able to activate a rep request for a biz/org with representative', function (done) {
    let jar;
    sql.test.membership.get({mid:5})
      .then(res => {
        expect(res[0].is_active).toBe(false);
        expect(res[0].is_representative).toBe(false);
        jar = rp.jar();
        return rp({
          method: 'POST',
          uri: lib.helpers.apiTestURL('login'),
          form:{username: 'admin', password :'atest'},
          withCredentials: true,
          jar : jar,
        })
      })
      .then(() =>{
        return rp({
          method: 'PUT',
          uri: lib.helpers.apiTestURL(`user/confirmRep/5/5`),
          jar: jar,
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
  });//

  it('admin should be able to delete a false representation request, convert him to a usual user', function (done) {
    let jar;
    sql.test.membership.get({mid:11})
      .then(res => {
        jar = rp.jar();
        return rp({
          method: 'POST',
          uri: lib.helpers.apiTestURL('login'),
          form:{username: 'admin', password :'atest'},
          withCredentials: true,
          jar : jar,
        })
      })
      .then(() =>{
        return rp({
          method: 'DELETE',
          uri: lib.helpers.apiTestURL(`user/deleteRep/11`),
          jar: jar,
          resolveWithFullResponse: true,
        })
      })
      .then(res => {
        expect(res.statusCode).toBe(200);
        done();
      })
      .catch(err => {
        this.fail(lib.helpers.parseServerErrorToString(err));
        done();
      });
  });

  it('admin should NOT be able to delete a representation request and  convert him to a usual user,with representative', function (done) {
    let jar;
    sql.test.membership.get({mid:7})
      .then(res => {
        jar = rp.jar();
        return rp({
          method: 'POST',
          uri: lib.helpers.apiTestURL('login'),
          form:{username: 'admin', password :'atest'},
          withCredentials: true,
          jar : jar,
        })
      })
      .then(() =>{
        return rp({
          method: 'DELETE',
          uri: lib.helpers.apiTestURL(`user/deleteRep/7`),
          jar: jar,
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
    let jar;
    sql.test.membership.get({mid:3})
      .then(res => {
        expect(res[0].is_active).toBe(false);
        expect(res[0].is_representative).toBe(true);
        jar = rp.jar();
        return rp({
          method: 'POST',
          uri: lib.helpers.apiTestURL('login'),
          form:{username: 'admin', password :'atest'},
          withCredentials: true,
          jar : jar,
        })
      })
      .then(() =>{
        return rp({
          method: 'DELETE',
          uri: lib.helpers.apiTestURL(`user/deleteRepBizOrg/3`),
          jar: jar,
          resolveWithFullResponse: true,
        })
      })
      .then(res => {
        expect(res.statusCode).toBe(200);
        sql.test.membership.get({mid:3})
        .then(res => {
          expect(res.length).toBe(0);
          done();
        });
      })
      .catch(err => {
        this.fail(lib.helpers.parseServerErrorToString(err));
        done();
      });
  });

  it('admin should be able to delete a false representation request from all related tables, except association', function (done) {
    let jar;
    sql.test.membership.get({mid:6})
      .then(res => {
        expect(res[0].is_active).toBe(false);
        expect(res[0].is_representative).toBe(true);
        jar = rp.jar();
        return rp({
          method: 'POST',
          uri: lib.helpers.apiTestURL('login'),
          form:{username: 'admin', password :'atest'},
          withCredentials: true,
          jar : jar,
        })
      })
      .then(() =>{
        return rp({
          method: 'DELETE',
          uri: lib.helpers.apiTestURL(`user/deleteRepBizOrg/6`),
          jar: jar,
          resolveWithFullResponse: true,
        })
      })
      .then(res => {
        expect(res.statusCode).toBe(200);
        sql.test.membership.get({mid:6})
          .then(res => {
            expect(res.length).toBe(0);
            done();
          });
      })
      .catch(err => {
        this.fail(lib.helpers.parseServerErrorToString(err));
        done();
      });
  });

  it('admin should be able to delete a false representation request from all related tables', function (done) {
    let jar;
    sql.test.membership.get({mid:1})
      .then(res => {
        expect(res[0].is_active).toBe(false);
        expect(res[0].is_representative).toBe(true);
        jar = rp.jar();
        return rp({
          method: 'POST',
          uri: lib.helpers.apiTestURL('login'),
          form:{username: 'admin', password :'atest'},
          withCredentials: true,
          jar : jar,
        })
      })
      .then(() =>{
        return rp({
          method: 'DELETE',
          uri: lib.helpers.apiTestURL(`user/deleteRepBizOrg/1`),
          jar: jar,
          resolveWithFullResponse: true,
        })
      })
      .then(res => {
        expect(res.statusCode).toBe(200);
        sql.test.membership.get({mid:1})
          .then(res => {
            expect(res.length).toBe(0);
            done();
          });
      })
      .catch(err => {
        this.fail(lib.helpers.parseServerErrorToString(err));
        done();
      });
  });

  it('admin should be able to delete a false representation request, convert him to a usual user/2', function (done) {
    let jar;
    sql.test.membership.get({mid:4})
      .then(res => {
        expect(res[0].is_active).toBe(false);
        expect(res[0].is_representative).toBe(true);
        jar = rp.jar();
        return rp({
          method: 'POST',
          uri: lib.helpers.apiTestURL('login'),
          form:{username: 'admin', password :'atest'},
          withCredentials: true,
          jar : jar,
        })
      })
      .then(() =>{
        return rp({
          method: 'DELETE',
          uri: lib.helpers.apiTestURL(`user/deleteRep/4`),
          jar: jar,
          resolveWithFullResponse: true,
        })
      })
      .then(res => {
        expect(res.statusCode).toBe(200);
        sql.test.membership.get({mid:4})
          .then(res => {
            expect(res[0].is_active).toBe(true);
            expect(res[0].is_representative).toBe(false);
            req.get(base_url + 'user/getRepPendingList' + test_query, (err, res) => {
              expect(res.statusCode).toBe(200);
              let data = JSON.parse(res.body);
              expect(data.length).toBe(1);
              let x = (data[0].person.pid === 3 ? data[0] : data[1]);
              expect(x.business.length).toBe(0);
              expect(x.organization.length).toBe(1);
              done();
            })
          });
      })
      .catch(err => {
        this.fail(lib.helpers.parseServerErrorToString(err));
        done();
      });
  });

  it('admin should be able to activate another right representation request/2', function (done) {
    let jar;
    sql.test.membership.get({mid:9})
      .then(res => {
        expect(res[0].is_active).toBe(false);
        jar = rp.jar();
        return rp({
          method: 'POST',
          uri: lib.helpers.apiTestURL('login'),
          form:{username: 'admin', password :'atest'},
          withCredentials: true,
          jar : jar,
        })
      })
      .then(() =>{
        return rp({
          method: 'PUT',
          uri: lib.helpers.apiTestURL(`user/confirmRep/9/4`),
          jar: jar,
          resolveWithFullResponse: true,
        })
      })
      .then(res => {
        expect(res.statusCode).toBe(200);
        sql.test.membership.get({mid:9})
          .then(res => {
            expect(res.length).toBe(1);
            expect(res[0].is_active).toBe(true);
            req.get(base_url + 'user/getRepPendingList' + test_query, (err, res) => {
              expect(res.statusCode).toBe(200);
              let data = JSON.parse(res.body);
              expect(data).toContain('No new representative request.');
              done();
            })
          });
      })
      .catch(err => {
        this.fail(lib.helpers.parseServerErrorToString(err));
        done();
      });
  });

  it("logs out a user(admin)", done => {
    req.get(base_url + 'logout' + test_query, (err, res) => {
      expect(res.statusCode).toBe(200);
      done();
    });
  });

  it("logs out a user(admin) - checking it happened", done => {
    req.get(base_url + 'user/getRepPendingList' + test_query, (err, res) => {
      expect(res.statusCode).toBe(403);
      done();
    });
  });

});