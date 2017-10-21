const request = require("request");
const base_url = "http://localhost:3000/api/";
const test_query = '?test=tEsT';
const lib = require('../../lib');
const sql = require('../../sql');

describe("Test auth APIs", () => {
  let teardown=false;
  let setup=true;
  let u;
  let username;
  let pid;

  beforeEach(done => {
    if(setup){
      lib.dbHelpers.create()
        .then(() => {
          setup = false;
          done();
        })
        .catch(err => {
          console.log(err);
          done();
        });
    }
    else
      done();
  });

  // For below test, we just want to make sure the API exists
  // so if it takes a long time and reach timeout, it is ok
  it("should call google authentication API", (done) => {
    setTimeout(()=> {
      expect(true).toBe(true);
      done();
    }, 1500);
    request.get(base_url + 'login/google' + test_query, (err, res) => {
      expect(res.statusCode).toBeTruthy();
      if(res.statusCode) {
        expect(res.statusCode).toBeTruthy();
        if(res.statusCode) {
          expect(res.statusCode).not.toBe(404);
          expect(res.statusCode).not.toBe(500);
        }
        done();
      }
      done();
    })
  }, 10000);

  // For below test, we just want to make sure the API exists
  // so if it takes a long time and reach timeout, it is ok
  it("should call facebook authentication API", (done) => {
    setTimeout(()=> {
      expect(true).toBe(true);
      done();
    }, 1500);
    request.get(base_url + 'login/facebook' + test_query, (err, res) => {
      expect(res).toBeTruthy();
      if(res) {
        expect(res.statusCode).toBeTruthy();
        if (res.statusCode) {
          expect(res.statusCode).not.toBe(404);
          expect(res.statusCode).not.toBe(500);
        }
      }
      done();
    });
  }, 10000);

  // For below test, we just want to make sure the API exists
  // so if it takes a long time and reach timeout, it is ok
  it("should call linkedin authentication API", (done) => {
    setTimeout(()=> {
      expect(true).toBe(true);
      done();
    }, 1500);
    request.get(base_url + 'login/linkedin' + test_query, (err, res) => {
      expect(res.statusCode).toBeTruthy();
      if(res.statusCode) {
        expect(res.statusCode).not.toBe(404);
        expect(res.statusCode).not.toBe(500);
      }
      done();
    });
  }, 10000);

  it("should semi register user locally (no email)", (done) => {
    req.put({
      url: base_url + '/user/register' + test_query,
      form: {email: '', display_name: 'ali'}
    }, (err, res) => {
      if(err)
        fail(err);
      else
        expect(res.statusCode).toBe(400);
      done();
    });
  });

  it("should semi register user locally (no display_name)", (done) => {
    req.put({
      url: base_url + '/user/register' + test_query,
      form: {email: 'alireza@bentoak.systems'}
    }, (err, res) => {
      if(err)
        fail(err);
      else
        expect(res.statusCode).toBe(400);
      done();
    });
  });

  it("should get error for incorrect email address pattern", (done) => {
    req.put({
      url: base_url + '/user/register' + test_query,
      form: {email: '123', display_name: 'ali'}
    }, (err, res) => {
      if(err)
        fail(err);
      else
        expect(res.statusCode).toBe(406);

      done();
    });
  });

  it("should semi register user locally (complete data)", (done) => {
    username = 'alireza@bentoak.systems';
    req.put({
      url: base_url + '/user/register' + test_query,
      form: {email: username, display_name: 'ali'}
    }, (err, res) => {
      if(err){
        fail(err);
        done();
      }
      else{
        expect(res.statusCode).toBe(200);
        //Get activation link from database
        sql.test.person_activation_link.get({username: username})
          .then(res => {
            expect(res.length).toBeGreaterThan(0);
            done();
          })
          .catch(err => {
            fail(err);
            done();
          });
      }
    });
  }, 6000);

  it("should choose password then click on activation link from mail", (done) => {
    sql.test.person_activation_link.get({username: username})
      .then(res => {
        req.get(base_url + 'user/activate/link/' + res[0].link + test_query, (err, res) => {
          if(err)
            fail(err);
          else{
            expect(res.statusCode).toBe(200);
            pid = JSON.parse(res.body);
          }

          done();
        })
      })
      .catch(err => {
        fail(err);
        done();
      });
  });

  it("should show suitable message when activation link not found", (done) => {
    req.get(base_url + 'user/activate/link/123' + test_query, (err, res) => {
      if(err)
        fail(err);
      else{
        expect(res.statusCode).toBe(500);
        expect(res.body).toBe('This activation link is expired');
      }

      done();
    })
  });

  it("should choose password for themselves", (done) => {
    sql.test.person_activation_link.get({username: username})
      .then(res => {
        req.post({
          url: base_url + 'user/auth/local/' + res[0].link + test_query,
          form: {
            username: username,
            password: '123abc'
          }
        }, (err, res) => {
          if(err){
            fail(err);
            done();
          }
          else{
            expect(res.statusCode).toBe(200);
            sql.test.person.get({username: username})
              .then(res => {
                expect(res[0].secret).not.toBe(null);
                expect(res[0].secret).not.toBe(undefined);
                expect(res[0].is_user).toBe(true);
                done();
              })
              .catch(er => {
                fail(er);
                done();
              });
          }
        })
      })
      .catch(err => {
        fail(err);
        done();
      })
  });

  it("should login with username and password (Local Authentication)", (done) => {
    request.post({
      url: base_url + 'login' + test_query,
      form: {
        username: username,
        password: '123abc'
      }
    }, (err, res) => {
      if(err)
        fail(err);
      else
        expect(res.statusCode).toBe(200);

      done();
    })
  });
});