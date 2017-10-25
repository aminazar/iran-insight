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
  let businessId = null;
  let setup = true;

  beforeEach(done => {
    if(setup)
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
            id: 101,
            name: 'non-governmental',
            name_fa: 'غیر دولتی',
          });
        })
        .then(() => lib.dbHelpers.addOrganizationWithRep(repObj.pid, 'MTN'))
        .then(res => {
          setup = false;
          done();
        })
        .catch(err => {
          console.error(err);
          done();
        });
    else
      done();
  });

  it("representative should add business profile", function(done) {
    this.done = done;
    rp({
      method: 'post',
      form: {
        name: 'ZoodFood',
        name_fa: 'زودفود',
        ceo_pid: repObj.pid,
        biz_type_id: 101,
        address: 'Tehran - Iran',
        address_fa: 'ایران - تهران',
        tel: '+123-9876',
        url: 'https//snapp.com'
      },
      uri: lib.helpers.apiTestURL('business/profile'),
      jar: repObj.jar,
      resolveWithFullResponse: true
    })
      .then(res => {
        expect(res.statusCode).toBe(200);
        businessId = res.body;
        return sql.test.business.select()
      })
      .then(res => {
        if(res.length === 0)
          this.fail('No business added');
        else
          expect(res).toBeTruthy();
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });

  it("admin should add/update business profile", function (done) {
    this.done = done;
    rp({
      method: 'post',
      form: {
        bid: businessId,
        name: 'SnappFood',
        name_fa: 'اسنپ فود'
      },
      uri: lib.helpers.apiTestURL('business/profile'),
      jar: adminObj.jar,
      resolveWithFullResponse: true
    })
      .then(res => {
        expect(res.statusCode).toBe(200);
        return sql.test.business.get({bid: businessId});
      })
      .then(res => {
        if(res.length < 1)
          this.fail('No business added');
        else{
          expect(res[0].name).toBe('SnappFood');
          expect(res[0].name_fa).toBe('اسنپ فود');
          expect(res[0].tel).toBe('+123-9876');
        }

        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });

  it("normal user have not access to change/set business profile", function (done) {
    rp({
      method: 'post',
      form: {
        bid: businessId,
        name: 'SnappFood',
        name_fa: 'اسنپ فود'
      },
      uri: lib.helpers.apiTestURL('business/profile'),
      jar: normalUserObj.jar,
      resolveWithFullResponse: true
    })
      .then(res => {
        this.fail('Permitted not representative user to update business info');
        done();
      })
      .catch(err => {
        expect(err.statusCode).toBe(403);
        expect(err.error).toBe('You cannot access to this functionality');
        done();
      });
  });
});