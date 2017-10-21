const request = require("request");
const base_url = "http://localhost:3000/api/";
const test_query = '?test=tEsT';
const lib = require('../../../lib/index');
const sql = require('../../../sql/index');
const error = require('../../../lib/errors.list');

let orgs_info = [{
  name: 'bent oak systems',
  name_fa: 'بنتوک سامانه',
  ceo_pid: 1,
  org_type_id: null
}, {
  name: 'Iran Insight',
  name_fa: 'ایران اینسایت',
  ceo_pid: 2,
  org_type_id: null
}];

let orgs_type_info = [{
  name: 'governmental',
  name_fa: 'دولتی'
}, {
  name: 'non-governmental',
  name_fa: 'غیر دولتی'
}];


describe("organization", () => {

  let createNewOrg = (org_info) => {
    let org = new lib.Organization(true);
    return org.saveData(org_info);

  };

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

  it("/Put : create new organization and return its id", done => {

    createNewOrgType(orgs_type_info[0]).then(id => {
      let new_org_info = Object.assign({}, orgs_info[0]);

      new_org_info.org_type_id = id;
      request.put(base_url + 'organization' + test_query, {json: true, body: new_org_info}, function (error, response) {
        expect(response.statusCode).toBe(200);
        expect(response.body).toBeGreaterThan(0);
        done();
      });

    });

  });


  it('/Put: create new organization when name is null and expect error  ', done => {

    createNewOrgType(orgs_type_info[0]).then(id => {

      let new_org_info = Object.assign({}, orgs_info[0]);
      new_org_info.org_type_id = id;
      new_org_info.name = null;

      request.put(base_url + 'organization' + test_query, {
        json: true,
        body: new_org_info
      }, function (err, res) {
        expect(res.body).toBe(error.emptyOrgName.message);
        expect(res.statusCode).toBe(error.emptyOrgName.status);
        done();
      });

    });


  });


  it('/Put: create new organization when name (farsi) is null and expect error  ', done => {
    createNewOrgType(orgs_type_info[0]).then(id => {

      let new_org_info = Object.assign({}, orgs_info[0]);
      new_org_info.org_type_id = id;
      new_org_info.name_fa = null;

      request.put(base_url + 'organization' + test_query, {
        json: true,
        body: new_org_info
      }, function (err, res) {
        expect(res.body).toBe(error.emptyOrgName.message);
        expect(res.statusCode).toBe(error.emptyOrgName.status);
        done();
      });

    });

  });



});
