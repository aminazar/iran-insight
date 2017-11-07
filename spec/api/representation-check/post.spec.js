const request = require("request");
const base_url = "http://localhost:3000/api/";
const test_query = '?test=tEsT';
const lib = require('../../../lib');
const sql = require('../../../sql');
const rp = require("request-promise");
let req = request.defaults({jar: true});//enabling cookies

xdescribe('Representation-check, POST API', () => {
  let adminPid, aminPid, rezaPid, adminJar, aminJar, rezaJar;
  beforeEach(done => {
    lib.dbHelpers.create()
      .then(() => {
        return lib.dbHelpers.addAndLoginPerson('admin', 'test')
      })
      .then((res) => {
        adminPid = res.pid;
        adminJar = res.rpJar;
        return lib.dbHelpers.addAndLoginPerson('amin', '123456')
      })
      .then((res) => {
        aminPid = res.pid;
        aminJar = res.rpJar;
        return lib.dbHelpers.addAndLoginPerson('reza', '123456')
      })
      .then((res) => {
        rezaPid = res.pid;
        rezaJar = res.rpJar;
        done();
      })
      .catch(err => {
        console.log('===> ', err.message);
        done();
      });
  });

  it('true should be true', done => {
    expect(true).toBe(true);
    done();
  });

  it('admin should get all representation requests from users', done => {
    return rp({
      method: 'GET',
      uri: lib.helpers.apiTestURL(`user/getRepPendingList`),
      jar: adminJar,
      resolveWithFullResponse: true,
    })
    .then((res) =>{
        expect(res.statusCode).not.toBe(404);
        expect(res.statusCode).not.toBe(403);
        expect(res.statusCode).not.toBe(500);
        expect(res.statusCode).toBe(200);
        done();
    })
      .catch((err)=>{
        console.log(err);
        done();
      })

  })
})