const request = require("request");
const base_url = "http://localhost:3000/api/";
const test_query = '?test=tEsT';
const lib = require('../../lib');
const sql = require('../../sql');
let req = request.defaults({jar: true});//enabling cookies

describe("organization", () => {
  let org;
  let org_info = {
    name :'bent oak systems',
    ceo_pid: 1,
    org_type_id: 1
  };
  let org_type;
  let lce_type;
  beforeEach(done => {
    lib.dbHelpers.create(['organization_type', 'business', 'organization', 'event'])
      .then(() => {
        org = new lib.Organization(true);
        org.name = org_info.name;
        org.ceo_pid = org_info.ceo_pid;
        org.org_type_id = org_info.org_type_id;

        org.save()
          .then(id => {
            org_info.oid = id;
            done();
          }).catch(err => {
          done();
        });
      }).catch(err => {
      console.log('err ==> ', err.message);
      done();
    });
  });

  it("/Get organization name, ceo_pid and org_type_id by oid", done => {
    request.get(base_url + `organization/${org_info.oid}` + test_query, function (error, response) {
      let result = JSON.parse(response.body);

      expect(response.statusCode).toBe(200);
      expect(result[0].name).toBe(org_info.name);
      expect(result[0].ceo_pid).toBe(org_info.ceo_pid);
      expect(result[0].org_type_id).toBe(org_info.org_type_id);

      done();
    })
  });

});