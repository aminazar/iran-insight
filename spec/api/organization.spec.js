const request = require("request");
const base_url = "http://localhost:3000/api/";
const test_query = '?test=tEsT';
const lib = require('../../lib');
const sql = require('../../sql');
let req = request.defaults({jar: true});//enabling cookies

let orgs_info = [{
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


describe("organization", () => {
  let org;

  let createNewOrg = (org_info) => {
    org = new lib.Organization(true);
    org.importData(org_info);
    return org.save();

  };

  beforeEach(done => {
    sql.test.organization_lce.drop()
      .then(sql.test.organization.drop)
      .then(sql.test.organization_type.drop)
      .then(sql.test.organization_type.create)
      .then(sql.test.organization.create)
      .then(() => {
        done();
      }).catch(err => {
      console.log('err ==> ', err.message);
      done();
    });
  });
  it("/Get list off all orgs", done => {

    createNewOrg(orgs_info[0]).then(createNewOrg(orgs_info[1])).then(id =>{
      request.get(base_url + `organization` + test_query, function (error, response) {
        let result = JSON.parse(response.body);
        expect(response.statusCode).toBe(200);
        expect(result.length).toBe(2);
        done();
      })
    }).catch(err =>{

      fail(err);
    });

  });

  it("/Get organization name, ceo_pid and org_type_id by oid", done => {

    createNewOrg(orgs_info[0]).then(id => {
      request.get(base_url + `organization/${id}` + test_query, function (error, response) {
        let result = JSON.parse(response.body);
        expect(response.statusCode).toBe(200);
        expect(result[0].name).toBe(orgs_info[0].name);
        expect(result[0].name_fa).toBe(orgs_info[0].name_fa);
        expect(result[0].ceo_pid).toBe(orgs_info[0].ceo_pid);
        expect(result[0].org_type_id).toBe(orgs_info[0].org_type_id);
        done();
      })
    });

  });

  it("/Put new organization", done => {

    request.put(base_url + 'organization' + test_query, {json: true, body: orgs_info[0]}, function (error, response) {
      expect(response.statusCode).toBe(200);
      expect(response.body.oid).toBeGreaterThan(0);
      done();
    });

  });


});