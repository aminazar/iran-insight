const request = require("request");
const base_url = "http://localhost:3000/api/";
const test_query = '?test=tEsT';
const lib = require('../../../lib/index');
const sql = require('../../../sql/index');
const error = require('../../../lib/errors.list');

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
    ceo_pid: 1,
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


xdescribe("organization", () => {

  let createNewOrg = (org_info) => {

    return sql.test.organization.add(org_info);
  };

  let createNewOrgType = (org_type_info) => {

    return sql.test.organization_type.add(org_type_info);
  };


  beforeEach(done => {
    lib.dbHelpers.create()
      .then(() => {
        done();
      }).catch(err => {
      console.log('err ==> ', err.message);
      done();
    });
  });


  it("/Get : get an existing organization joined with its type", done => {

    createNewOrgType(orgs_type_info[0])
      .then(() => createNewOrg(orgs_info[0]))
      .then(() => {
        request.get(base_url + `organization/${orgs_info[0].oid}` + test_query, function (error, response) {
          let result = JSON.parse(response.body);
          expect(response.statusCode).toBe(200);
          expect(result.length).toBe(1);
          expect(result[0]['org_type']).toBe(orgs_type_info[0].name);
          expect(result[0]['org_type_fa']).toBe(orgs_type_info[0].name_fa);
          done();
        });
      }).catch(err => {
      throw new Error(err);

    });


  });

  it("/Get : get an existing organization with null org_type_id and expect null (farsi) name for org type in result", function(done) {

    let new_org_info = Object.assign({}, orgs_info[0]);
    new_org_info.org_type_id = null;

      createNewOrg(new_org_info)
      .then(() => {
        request.get(base_url + `organization/${new_org_info.oid}` + test_query, function (error, response) {
          let result = JSON.parse(response.body);
          expect(response.statusCode).toBe(200);
          expect(result.length).toBe(1);
          expect(result[0]['org_type']).toBeNull();
          expect(result[0]['org_type_fa']).toBeNull();
          done();
        });
      }).catch(err => {
      throw new Error(err);
      done();

    });


  });


  // it("/Get list off all orgs", done => {
  //
  //
  //   createNewOrgType(orgs_type_info[0])
  //     .then(createNewOrgType(orgs_type_info[1]))
  //     .then(createNewOrg(orgs_info[0]))
  //     .then(createNewOrg(orgs_info[1]))
  //     .then(createNewOrg(orgs_info[2]))
  //     .then(() => {
  //       request.get(base_url + `organization` + test_query, function (error, response) {
  //         let result = JSON.parse(response.body);
  //         expect(response.statusCode).toBe(200);
  //         expect(result.length).toBe(2);
  //         done();
  //       });
  //     });
  //
  //
  // });
  //
  // it("/Get organization name, ceo_pid and org_type_id by oid", done => {
  //
  //   createNewOrg(orgs_info[0]).then(id => {
  //     request.get(base_url + `organization/${id}` + test_query, function (error, response) {
  //       let result = JSON.parse(response.body);
  //       expect(response.statusCode).toBe(200);
  //       expect(result[0].name).toBe(orgs_info[0].name);
  //       expect(result[0].name_fa).toBe(orgs_info[0].name_fa);
  //       expect(result[0].ceo_pid).toBe(orgs_info[0].ceo_pid);
  //       expect(result[0].org_type_id).toBe(orgs_info[0].org_type_id);
  //       done();
  //     })
  //   });
  //
  // });


});