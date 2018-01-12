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
}, {
  aid: 6,
  pid: 3,
  bid: null,
  oid: 51,
  start_date: null,
  end_date: null
}];

let mem_info = [{
  assoc_id: 1,
  is_active: true,
  is_representative: true,
  position_id: 301
}, {
  assoc_id: 2,
  is_active: true,
  is_representative: true,
  position_id: 302
}, {
  assoc_id: 3,
  is_active: true,
  is_representative: true,
  position_id: 300
}, {
  assoc_id: 4,
  is_active: true,
  is_representative: false,
  position_id: 303
}, {
  assoc_id: 5,
  is_active: true,
  is_representative: false,
  position_id: 302
}, {
  assoc_id: 6,
  is_active: false,
  is_representative: true,
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

describe('Upsert/Delete membership, POST API', () => {
  let adminPid, repPid, userPid1, userPid2, adminJar, repJar, userJar1, userJar2;
  beforeEach(done => {
    lib.dbHelpers.create()
      .then(() => {
        return lib.dbHelpers.addAndLoginPerson('admin','admin');
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
        })
      })
      .then((res) => {
        repPid = res.pid;
        repJar = res.rpJar;
        return lib.dbHelpers.addAndLoginPerson('RegularUser1', '123456',
          {
          firstname_en: 'MrUser1',
          surname_en: 'KarbarPoor1',
        })
      })
      .then((res) => {
        userPid1 = res.pid;
        userJar1 = res.rpJar;
        return lib.dbHelpers.addAndLoginPerson('RegularUser2', '123456',
          {
          firstname_en: 'MrUser2',
          surname_en: 'KarbarPoor2',
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

  it("admin should be able to update a confirmed rep membership", done => {
    rp({
      method: 'post',
      form: {
        aid: 1,
        position_id: 300,
        end_time: moment(new Date()).add(20, 'day').format()
      },
      uri: lib.helpers.apiTestURL('joiner/updateMembershipForUser/1'),
      jar: adminJar,
      resolveWithFullResponse: true
    })
      .then((res) => {
        expect(res.statusCode).toBe(200);
        return sql.test.membership.get({mid: 1})
      })
      .then(res => {
        expect(res[0].end_time).not.toBe(null);
        return sql.test.membership.get({mid: 7})
      })
      .then(res => {
        expect(res[0].assoc_id).toBe(1);
        expect(res[0].position_id).toBe(300);
        done();
      })
      .catch(err => {
        expect(err.statusCode).not.toBe(500);
        console.log('error:', err.message);
        done();
      });
  });

  it("admin should be able to update a confirmed regular user membership", done => {
    rp({
      method: 'post',
      form: {
        aid: 5,
        position_id: 303,
        start_time: moment(new Date()).add(5, 'day').format()
      },
      uri: lib.helpers.apiTestURL('joiner/updateMembershipForUser/5'),
      jar: adminJar,
      resolveWithFullResponse: true
    })
      .then((res) => {
        expect(res.statusCode).toBe(200);
        return sql.test.membership.get({mid: 5})
      })
      .then(res => {
        expect(res[0].end_time).not.toBe(null);
        return sql.test.membership.get({mid: 7})
      })
      .then(res => {
        expect(res[0].assoc_id).toBe(5);
        expect(res[0].position_id).toBe(303);
        done();
      })
      .catch(err => {
        expect(err.statusCode).not.toBe(500);
        console.log('error:', err.message);
        done();
      });
  });

  it("a representative should be able to update a her/his membership", done => {
    sql.test.membership.update({end_time: moment(new Date()).add(7, 'day')}, 2)
      .then((res) => {
        return sql.test.membership.get({mid: 2})
      })
      .then((res) => {
        expect(res[0].is_active).toBe(true);
        expect(res[0].is_representative).toBe(true);
        expect(res[0].position_id).toBe(302);
        expect(res[0].end_time).not.toBe(null);
        return rp({
          method: 'post',
          form: {
            aid: res[0].assoc_id,
            position_id: 301,
          },
          uri: lib.helpers.apiTestURL('joiner/updateMembershipForUser/2'),
          jar: repJar,
          resolveWithFullResponse: true
        })
      })
      .then((res) => {
        expect(res.statusCode).toBe(200);
        return sql.test.membership.get({mid: 2})
      })
      .then(res => {
        expect(res[0].end_time).not.toBe(moment(new Date()).add(7, 'day'));
        expect(res[0].end_time).not.toBe(null);
        return sql.test.membership.get({mid: 7})
      })
      .then(res => {
        expect(res[0].assoc_id).toBe(2);
        expect(res[0].position_id).toBe(301);
        done();
      })
      .catch(err => {
        expect(err.statusCode).not.toBe(500);
        console.log('error:', err.message);
        done();
      });
  });

  it("a representative should be able to update a her/his joiner membership", done => {
    rp({
      method: 'post',
      form: {
        aid: 4,
        position_id: 300,
        end_time: moment(new Date()).add(10, 'day').format()
      },
      uri: lib.helpers.apiTestURL('joiner/updateMembershipForUser/4'),
      jar: repJar,
      resolveWithFullResponse: true
    })
      .then((res) => {
        expect(res.statusCode).toBe(200);
        return sql.test.membership.get({mid: 4})
      })
      .then(res => {
        expect(res[0].end_time).not.toBe(null);
        return sql.test.membership.get({mid: 7})
      })
      .then(res => {
        expect(res[0].assoc_id).toBe(4);
        expect(res[0].position_id).toBe(300);
        expect(res[0].end_time).not.toBe(null);
        done();
      })
      .catch(err => {
        expect(err.statusCode).not.toBe(500);
        console.log('error:', err.message);
        done();
      });
  });

  it("a regular user should be able to update a her/his membership", done => {
    rp({
      method: 'post',
      form: {
        aid: 5,
        position_id: 300,
      },
      uri: lib.helpers.apiTestURL('joiner/updateMembershipForUser/5'),
      jar: userJar2,
      resolveWithFullResponse: true
    })
      .then((res) => {
        expect(res.statusCode).toBe(200);
        return sql.test.membership.get({mid: 5})
      })
      .then(res => {
        expect(res[0].end_time).not.toBe(null);
        return sql.test.membership.get({mid: 7})
      })
      .then(res => {
        expect(res[0].assoc_id).toBe(5);
        expect(res[0].position_id).toBe(300);
        expect(res[0].end_time).toBe(null);
        done();
      })
      .catch(err => {
        expect(err.statusCode).not.toBe(500);
        console.log('error:', err.message);
        done();
      });
  });

  it("a representative should NOT be able to update another rep's joiner membership", function (done) {
    sql.test.membership.update({is_representative: false}, 2)
      .then((res) => {
        return rp({
          method: 'post',
          form: {
            aid: 5,
            position_id: 300,
            end_time: moment(new Date()).add(10, 'day').format()
          },
          uri: lib.helpers.apiTestURL('joiner/updateMembershipForUser/5'),
          jar: repJar,
          resolveWithFullResponse: true
        })
      })
      .then(() => {
        this.fail('you are not allowed to update this membership.');
        done();
      })
      .catch(err => {
        expect(err.statusCode).toBe(403);
        console.log(err.message);
        done();
      });
  });

  it("a regular user should NOT be able to update a another regular user membership", function (done) {
    rp({
      method: 'post',
      form: {
        aid: 5,
        position_id: 300,
      },
      uri: lib.helpers.apiTestURL('joiner/updateMembershipForUser/5'),
      jar: userJar1,
      resolveWithFullResponse: true
    })
    .then(() => {
      this.fail('you are not allowed to update this membership.');
      done();
    })
    .catch(err => {
      expect(err.statusCode).toBe(403);
      console.log(err.message);
      done();
    });
  });

});

