const request = require("request");
const base_url = "http://localhost:3000/api/";
const test_query = '?test=tEsT';
const lib = require('../../../lib');
const sql = require('../../../sql');
const error = require('../../../lib/errors.list');
let orgs_type_info = [{
  name: 'governmental',
  name_fa: 'دولتی'
}, {
  name: 'non-governmental',
  name_fa: 'غیر دولتی'
}];


describe("organization type", () => {

  let createNewOrgType = (org_type_info) => {
    let orgType = new lib.OrganizationType(true);
    return orgType.saveData(org_type_info);

  };

  beforeEach(done => {
    sql.test.organization_lce.drop()
      .then(sql.test.lce_type.drop)
      .then(sql.test.organization.drop)
      .then(sql.test.organization_type.drop)
      .then(sql.test.organization_type.create)
      .then(sql.test.organization.create)
      .then(sql.test.lce_type.create)
      .then(sql.test.organization_lce.create)
      .then(() => {
        done();
      }).catch(err => {
      console.log('err ==> ', err.message);
      done();
    });
  });

  it('/Put: create new organization type and return its id', done => {


    request.put(base_url + 'organization-type' + test_query, {
      json: true,
      body: orgs_type_info[0]
    }, function (err, res) {

      expect(res.statusCode).toBe(200);
      expect(res.body).toBeGreaterThan(0);

      done();
    });
  });

  it('/Put: create new organization type when name is null and expect error  ', done => {
    let new_org_type_info = Object.assign({}, orgs_type_info[0]);
    new_org_type_info['name'] = null;

    request.put(base_url + 'organization-type' + test_query, {
      json: true,
      body: new_org_type_info
    }, function (err, res) {
      expect(res.body).toBe(error.emptyOrgTypeName.message);
      expect(res.statusCode).toBe(error.emptyOrgTypeName.status);
      done();
    });


  });


  it('/Put: create new organization type when name (farsi) is null and expect error  ', done => {
    let new_org_type_info = Object.assign({}, orgs_type_info[0]);
    new_org_type_info['name_fa'] = null;

    request.put(base_url + 'organization-type' + test_query, {
      json: true,
      body: new_org_type_info
    }, function (err, res) {
      expect(res.body).toBe(error.emptyOrgTypeName.message);
      expect(res.statusCode).toBe(error.emptyOrgTypeName.status);
      done();
    });


  });




});