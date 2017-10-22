const request = require("request");
const base_url = "http://localhost:3000/api/";
const test_query = '?test=tEsT';
const lib = require('../../lib');
const sql = require('../../sql');
let req = request.defaults({jar: true});//enabling cookies

let resExpect = (res, statusCode) => {
  if (res.statusCode !== statusCode) {
    let jres = JSON.parse(res.body);
    let msg = jres.Message ? jres.Message : jres;
    expect(res.statusCode).toBe(statusCode, `Expected response code ${statusCode}, received ${res.statusCode}. Server response: ${msg}`);
    if (jres.Stack) {
      let err = new Error();
      err.message = jres.Message;
      err.stack = jres.Stack;
      console.log(`Server responds with unexpected error:`, err);
    }
    return false;
  }
  return true;
};

describe("Representation-check API", () => {
  describe("root", () => {
    it("returns 'respond with a resource'", done => {
      request.get(base_url, function (error, response) {
        expect(response.body).toBe("respond with a resource");
        done();
      })
    });
  });
  describe("Admin can get all representation requests from users and send them activation E-mail if they are right.", () => {
    let uid;
    let adminUid;
    let u;
    let a;
    let teardown = false;
    let setup = true;
    beforeEach(done => {
      if (setup) {
        sql.test.person.drop().then(() => {
        }).catch(() => {
        });
        u = new lib.User(true);
        u.username = 'amin';
        u.password = 'test';
        sql.test.person.create()
          .then(() => {
            u.save()
              .then(id => {
                uid = id;
                setup = false;
                a = new lib.User(true);
                a.username = 'Admin';
                a.password = 'atest';
                a.save()
                  .then(aid => {
                    adminUid = aid;
                    done();
                  })
              })
          })
          .catch(err => {
            console.log(err.message);
            done();
          });
      }
      else {
        done();
      }
    });

    // it("should loginCheck for user correctly", done =>{
    //   request.post({
    //     url: base_url + 'loginCheck' + test_query,
    //     form: {username: 'amin', password: 'test'}
    //   } ,(err, res) => {
    //     expect(res.statusCode).toBe(200);
    //     done();
    // })
    // });

    it("logins as amin", done => {
      req.post({
        url: base_url + 'login' + test_query,
        form: {username: 'amin', password: 'test'}
      }, (err, res) => {
        expect(res.statusCode).toBe(200);
        done();
      })
    });

    it("amin (a user exept admin) should not be able to get representation requests", done =>{
      req.get(base_url + 'user/checkifrep' +test_query , (err, res) => {
        expect(res.statusCode).toBe(403);
        done();
      })
    });

    it("logs out a user(amin)", done => {
      req.get(base_url + 'logout' + test_query, (err, res) => {
        expect(res.statusCode).toBe(200);
        done();
      });
    });

    it("logins as admin", done => {
      req.post({
        url: base_url + 'login' + test_query,
        form: {username: 'admin', password: 'atest'}
      }, (err, res) => {
        expect(res.statusCode).toBe(200);
        done();
      })
    });

    it("admin should get all representation requests from users and send activation E-mail to them if they are right", done =>{
      req.get(base_url + 'user/checkifrep' + test_query, (err, res) => {
        expect(res.statusCode).not.toBe(404);
        expect(res.statusCode).not.toBe(500);
        expect(res.statusCode).toBe(200);
        if (resExpect(res, 200)) {
          let data = JSON.parse(res.body);
          expect(data.length).toBe(1);
          expect(data[0].pid).toBe(uid);
          expect(data[0].username).toBe('amin');
          console.log('==>',typeof data);
          console.log(data);
          console.log('==>',typeof res.body);

        }
        done();
      })
    });

    it("logs out a user(admin)", done => {
      req.get(base_url + 'logout' + test_query, (err, res) => {
        expect(res.statusCode).toBe(200);
        done();
      });
    });

    it("logs out a user(admin) - checking it happened", done => {
      req.get(base_url + 'user/checkifrep' + test_query, (err, res) => {
        expect(res.statusCode).toBe(403);
        done();
      });
    });

    it("tears down", () => {
      teardown = true;
      expect(teardown).toBeTruthy();
    });
    afterEach((done) => {
      if (uid && teardown)
        sql.test.person.drop().then(() => done()).catch(err => {
          console.log(err.message);
          done()
        });
      else done();
    });
  });

});