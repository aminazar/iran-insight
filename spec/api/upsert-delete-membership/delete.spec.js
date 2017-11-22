const request = require("request");
const lib = require('../../../lib');
const sql = require('../../../sql');
const rp = require("request-promise");
const moment = require('moment');
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
  name: 'assistant',
  name_fa: 'معاون',
  active: true
}, {
  id: 303,
  name: 'minister',
  name_fa: 'وزیر',
  active: true
}];

let orgs_info = [{
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
}];

let biz_info = [{
  bid: 1,
  name: 'snap',
  name_fa: 'اسنپ',
  ceo_pid: 3,
  biz_type_id: 201,
  address: 'Iran-Qom',
  address_fa: 'ایران - قم',
  tel: '025 77307730',
  url: null,
  general_stats: null,
  financial_stats: null
}, {
  bid: 2,
  name: 'tapsi',
  name_fa: 'تپسی',
  ceo_pid: 3,
  biz_type_id: 201,
  address: 'Iran-Tehran',
  address_fa: 'ایران - تهران',
  tel: '02188668866',
  url: null,
  general_stats: null,
  financial_stats: null
}];

let assoc_info = [{
  aid: 1,
  pid: 2,
  bid: 1,
  oid: null,
  start_date: null,
  end_date: null
}, {
  aid: 2,
  pid: 2,
  bid: 2,
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
  aid: 4,
  pid: 3,
  bid: 1,
  oid: null,
  start_date: null,
  end_date: null
}, {
  aid: 5,
  pid: 4,
  bid: 2,
  oid: null,
  start_date: null,
  end_date: null
}];

let mem_info = [{
  mid: 1,
  assoc_id: 1,
  is_active: true,
  is_representative: true,
  position_id: 301
}, {
  mid: 2,
  assoc_id: 2,
  is_active: true,
  is_representative: true,
  position_id: 302
}, {
  mid: 3,
  assoc_id: 3,
  is_active: true,
  is_representative: true,
  position_id: 300
}, {
  mid: 4,
  assoc_id: 4,
  is_active: true,
  is_representative: false,
  position_id: 303
}, {
  mid: 5,
  assoc_id: 5,
  is_active: true,
  is_representative: false,
  position_id: 302
}];

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

describe('Upsert/Delete membership, DELETE API', () => {
  let adminPid, repPid, userPid1, userPid2, adminJar, repJar, userJar1, userJar2;
  beforeEach(done => {
    lib.dbHelpers.create()
      .then(() => {
        return lib.dbHelpers.addAndLoginPerson('admin', 'admin');
      })
      .then((res) => {
        adminPid = res.pid;
        adminJar = res.rpJar;
        return lib.dbHelpers.addAdmin(adminPid);
      })
      .then(() => {
        return lib.dbHelpers.addAndLoginPerson('RepUser', '123456',
          {
          firstname_en: 'MrRep',
          surname_en: 'NamayandePoor ',
        });
      })
      .then((res) => {
        repPid = res.pid;
        repJar = res.rpJar;
        return lib.dbHelpers.addAndLoginPerson('RegularUser1', '123456',
          {
          firstname_en: 'MrUser1',
          surname_en: 'KarbarPoor1'
        })
      })
      .then((res) => {
        userPid1 = res.pid;
        userJar1 = res.rpJar;
        return lib.dbHelpers.addAndLoginPerson('RegularUser2', '123456',
          {
          firstname_en: 'MrUser2',
          surname_en: 'KarbarPoor2'
        })
      })
      .then((res) => {
        userPid2 = res.pid;
        userJar2 = res.rpJar;
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

  it("admin should be able to finish reresentative's membership ONLY,(other regular users are related to their reps, not admin)", done => {
    sql.test.membership.update({end_time: moment(new Date()).add(7, 'day')}, 1)
      .then(() => {
        return rp({
          method: 'DELETE',
          uri: lib.helpers.apiTestURL(`user/deleteUserOrRepAfterConfirm/1`),
          jar: adminJar,
          resolveWithFullResponse: true,
        })
      })
      .then(res => {
        expect(res.statusCode).toBe(200);
        return sql.test.membership.get({mid: 1})
      })
      .then(res => {
        expect(res[0].end_time).not.toBe(null); // this membership is finished now.
        done();
      })
      .catch(err => {
        console.log(err.message);
        done();
      });
  });

  it('should threw an error when admin is going to finish regular users', function (done) {
    rp({
      method: 'DELETE',
      uri: lib.helpers.apiTestURL(`user/deleteUserOrRepAfterConfirm/5`),
      jar: adminJar,
      resolveWithFullResponse: true,
    })
      .then(() => {
        this.fail('admin is not allowed to finish regular user membership.');
        done();
      })
      .catch(err => {
        expect(err.statusCode).toBe(403);
        console.log(err.message);
        done();
      });
  });

  it('admin should NOT be able to finish a finished membership of a rep', function (done) {
    sql.test.membership.update({start_time: moment(new Date()).add(-7, 'day')}, 1)
      .then((res) => {
        return sql.test.membership.update({end_time: moment(new Date()).add(-3, 'day')}, 1)
      })
      .then(res => {
        expect(res[0].end_time).not.toBe(null);
        return rp({
          method: 'DELETE',
          uri: lib.helpers.apiTestURL(`user/deleteUserOrRepAfterConfirm/1`),
          jar: adminJar,
          resolveWithFullResponse: true,
        })
      })
      .then(() => {
        this.fail('Thiss membership has finished before.');
        done();
      })
      .catch(err => {
        expect(err.statusCode).toBe(500);
        console.log(err.message);
        done();
      });
  });

  it('rep should be able to finish her/his membership', done => {
    rp({
      method: 'DELETE',
      uri: lib.helpers.apiTestURL(`user/deleteUserOrRepAfterConfirm/3`),
      jar: repJar,
      resolveWithFullResponse: true,
    })
      .then(res => {
        expect(res.statusCode).toBe(200);
        return sql.test.membership.get({mid: 3})
      })
      .then(res => {
        expect(res[0].end_time).not.toBe(null); // this membership is finished now.
        done();
      })
      .catch(err => {
        console.log(err.message);
        done();
      });
  });

  it('rep should be able to finish her/his-joiners membership ONLY', done => {
    rp({
      method: 'DELETE',
      uri: lib.helpers.apiTestURL(`user/deleteUserOrRepAfterConfirm/5`),
      jar: repJar,
      resolveWithFullResponse: true,
    })
      .then(res => {
        expect(res.statusCode).toBe(200);
        return sql.test.membership.get({mid: 5})
      })
      .then(res => {
        expect(res[0].end_time).not.toBe(null); // this membership is finished now.
        done();
      })
      .catch(err => {
        console.log(err.message);
        done();
      });
  });

  it('should threw an error when a rep-user is going to finish another rep membership', function (done) {
    sql.test.association.update({pid: 3}, 3)
      .then(res => {
        return rp({
          method: 'DELETE',
          uri: lib.helpers.apiTestURL(`user/deleteUserOrRepAfterConfirm/3`),
          jar: repJar,
          resolveWithFullResponse: true,
        })
      })
      .then(() => {
        this.fail('you are not allowed to finish other rep membership.');
        done();
      })
      .catch(err => {
        expect(err.statusCode).toBe(403);
        console.log(err.message);
        done();
      });
  });

  it('should threw an error when a rep-user is going to finish other rep joiners membership', function (done) {
    sql.test.association.update({pid: 3}, 2)   // make user1 to be rep of biz2 and user2 is joiner of user1...//rep user is rep of biz1,user1 is also joiner of repuser
      .then(res => {
        return rp({
          method: 'DELETE',
          uri: lib.helpers.apiTestURL(`user/deleteUserOrRepAfterConfirm/5`),
          jar: repJar,
          resolveWithFullResponse: true,

        })
      })
      .then(() => {
        this.fail('you are not allowed to finish other rep membership.');
        done();
      })
      .catch(err => {
        expect(err.statusCode).toBe(403);
        console.log(err.message);
        done();
      });
  });

  it('regular user should be able to finish his/her membership ONLY', done => {
    rp({
      method: 'DELETE',
      uri: lib.helpers.apiTestURL(`user/deleteUserOrRepAfterConfirm/4`),
      jar: userJar1,
      resolveWithFullResponse: true,
    })
      .then(res => {
        expect(res.statusCode).toBe(200);
        return sql.test.membership.get({mid: 4})
      })
      .then(res => {
        expect(res[0].end_time).not.toBe(null);
        done();
      })
      .catch(err => {
        console.log(err.message);
        done();
      });
  });

  it('should threw an error when a regular user is going to finish another user except her/himself', function (done) {
    rp({
      method: 'DELETE',
      uri: lib.helpers.apiTestURL(`user/deleteUserOrRepAfterConfirm/5`),
      jar: userJar1,
      resolveWithFullResponse: true,
    })
      .then(() => {
        this.fail('you are not allowed to finish this membership.');
        done();
      })
      .catch(err => {
        expect(err.statusCode).toBe(403);
        console.log(err.message);
        done();
      });
  });

});

