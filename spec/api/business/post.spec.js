const rp = require("request-promise");
const lib = require('../../../lib/index');
const sql = require('../../../sql/index');

describe("POST Business API", () => {
  let adminObj = {
    pid: null,
    jar: null
  };
  let repObj = {
    pid: null,
    jar: null,
  };
  let normalUserObj = {
    pid: null,
    jar: null,
  };

  beforeEach(done => {
    lib.dbHelpers.create()
      .then(() => lib.dbHelpers.addAndLoginPerson('admin', 'admin123', {}))
      .then(res => {
        adminObj.pid = res.pid;
        adminObj.jar = res.rpJar;
        return lib.dbHelpers.addAndLoginPerson('rep', 'rep123', {});
      })
      .then(res => {
        repObj.pid = res.pid;
        repObj.jar = res.rpJar;
        return lib.dbHelpers.addAndLoginPerson('ali', 'ali123', {})
      })
      .then(res => {
        normalUserObj.pid = res.pid;
        normalUserObj.jar = res.rpJar;
        return sql.test.organization_type.add({
          org_type_id: 101,
          name: 'non-governmental',
          name_fa: 'غیر دولتی',
        });
      })
      .then(res => {
        console.log('====> adminObj: ', adminObj);
        console.log('====> repObj: ', repObj);
        console.log('====> normalUserObj: ', normalUserObj);
        done();
      })
      .catch(err => {
        console.error(err);
        done();
      })
  });

  it("representative should add business profile", function(done) {
    this.done = done;
    rp({
      method: 'post',
      form: {
        name: 'Snapp',
        name_fa: 'اسنپ',
        ceo_pid: repObj.pid,
        org_type_id: 101,
        address: 'Tehran - Iran',
        address_fa: 'ایران - تهران',
        // geo_location: '',
        tel: '+123-9876',
        url: 'https//snapp.com',
        general_stats: {},
        financial_stats: {},
      },
      uri: lib.helpers.apiTestURL(`business/profile`),
      jar: repObj.jar
    })
      .then(res => {
        expect(res.statusCode).toBe(200);
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });

  xit("admin should add/update business profile", function (done) {

  });

  xit("normal user have not access to change/set business profile", function (done) {

  });

  xit("representative should update business profile", function (done) {

  });
});