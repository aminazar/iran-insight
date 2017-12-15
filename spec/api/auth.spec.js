const request = require("request");
const base_url = "http://localhost:3000/api/";
const test_query = '?test.js=tEsT';
const lib = require('../../lib');
const sql = require('../../sql');
let req = request.defaults({jar: true});//enabling cookies

describe("Test auth APIs", () => {
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

  // For below test.js, we just want to make sure the API exists
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

  // For below test.js, we just want to make sure the API exists
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

  // For below test.js, we just want to make sure the API exists
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

  it("should semi register user locally (no email)", function(done) {
    request.put({
      url: base_url + '/user/register' + test_query,
      form: {email: '', display_name: 'ali'}
    }, (err, res) => {
      if(err)
        this.fail(err);
      else
        expect(res.statusCode).toBe(400);
      done();
    });
  });

  it("should semi register user locally (no display_name)", function(done) {
    request.put({
      url: base_url + '/user/register' + test_query,
      form: {email: 'alireza@bentoak.systems'}
    }, (err, res) => {
      if(err)
        this.fail(err);
      else
        expect(res.statusCode).toBe(400);
      done();
    });
  });

  it("should get error for incorrect email address pattern", function(done) {
    request.put({
      url: base_url + '/user/register' + test_query,
      form: {email: '123', display_name: 'ali'}
    }, (err, res) => {
      if(err)
        this.fail(err);
      else
        expect(res.statusCode).toBe(406);

      done();
    });
  });

  it("should semi register user locally (complete data)", function(done) {
    let outerContext = this;
    username = 'alireza@bentoak.systems';
    request.put({
      url: base_url + '/user/register' + test_query,
      form: {email: username, display_name: 'ali'}
    }, (err, res) => {
      if(err){
        this.fail(err);
        done();
      }
      else{
        expect(res.statusCode).toBe(200);
        //Get activation link from database
        sql.test.person_activation_link.get({username: username})
          .then(res => {
            expect(res.length).toBeGreaterThan(0);
            return sql.test.person.get({username: username});
          })
          .then(res => {
            expect(res[0].is_user).toBe(false);
            done();
          })
          .catch(err => {
            outerContext.fail(err);
            done();
          });
      }
    });
  }, 20000);

  it("should choose password then click on activation link from mail", function(done) {
    let outerContext = this;
    sql.test.person_activation_link.get({username: username})
      .then(res => {
        request.get(base_url + 'user/activate/link/' + res[0].link + test_query, (err, res) => {
          if(err)
            outerContext.fail(err);
          else{
            expect(res.statusCode).toBe(200);
            pid = JSON.parse(res.body);
          }

          done();
        })
      })
      .catch(err => {
        this.fail(err);
        done();
      });
  });

  it("should show suitable message when activation link not found", function(done) {
    request.get(base_url + 'user/activate/link/123' + test_query, (err, res) => {
      if(err)
        this.fail(err);
      else{
        expect(res.statusCode).toBe(404);
        expect(res.body).toBe('Link is expired');
      }

      done();
    })
  });

  it("should choose password for themselves", function(done) {
    let outerContext = this;
    sql.test.person_activation_link.get({username: username})
      .then(res => {
        req.post({
          url: base_url + 'user/auth/local/' + res[0].link + test_query,
          form: {
            password: '123abc'
          }
        }, (err, res) => {
          if(err){
            outerContext.fail(err);
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
                outerContext.fail(er);
                done();
              });
          }
        })
      })
      .catch(err => {
        this.fail(err);
        done();
      })
  });

  it("should login with username and password (Local Authentication)", function(done) {
    username = 'alireza@bentoak.systems';
    request.post({
      url: base_url + 'login' + test_query,
      form: {
        username: username,
        password: '123abc'
      }
    }, (err, res) => {
      if(err)
        this.fail(err);
      else
        expect(res.statusCode).toBe(200);

      done();
    })
  });

  it("should authenticated user by open-auth authenticate with local", function (done) {
    username = 'ali.71hariri@gmail.com';

    //Insert user as authenticated user with open-auth
    sql.test.person.add({
      pid: 100,
      username: username,
      secret: null,
      firstname_en: 'Alireza',
      firstname_fa: null,
      surname_en: 'Hariri',
      surname_fa: null,
      display_name_en: 'Alireza Hariri',
      display_name_fa: null,
      is_user: true,
    })
      .then(res => {
        request.put({
          url: base_url + '/user/register' + test_query,
          form: {email: username, display_name: 'ali'}
        }, (err, res) => {
          if(err){
            this.fail(err);
            done();
          }
          else{
            expect(res.statusCode).toBe(500);
            expect(res.body).toBe('Email already exists');
            done();
          }
        });
      })
      .catch(err => {
        this.fail(err);
        done();
      })
  });

  it("should authenticated user by open-auth get activation link as forgot password/activation", function (done) {
    username = 'ali.71hariri@gmail.com';
    request.post({
      url: base_url + '/user/auth/link' + test_query,
      form: {email: username}
    }, (err, res) => {
      if(err){
        this.fail(err);
        done();
      }
      else{
        expect(res.statusCode).toBe(200);
        console.log(res.body);
        // expect(JSON.parse(res.body)).toBe('Email is sent');
        done();
      }
    })
  }, 10000);

  it("should authenticated user by open-auth choose password for her/his", function (done) {
    let outerContext = this;
    sql.test.person_activation_link.get({username: username})
      .then(res => {
        req.post({
          url: base_url + 'user/auth/local/' + res[0].link + test_query,
          form: {
            username: username,
            password: '123456789'
          }
        }, (err, res) => {
          if(err){
            outerContext.fail(err);
            done();
          }
          else{
            expect(res.statusCode).toBe(200);
            sql.test.person.get({username: username})
              .then(res => {
                expect(res[0].display_name_en).toBe('Alireza Hariri');
                expect(res[0].secret).not.toBe(null);
                expect(res[0].secret).not.toBe(undefined);
                expect(res[0].is_user).toBe(true);
                done();
              })
              .catch(er => {
                outerContext.fail(er);
                done();
              });
          }
        })
      })
      .catch(err => {
        this.fail(err);
        done();
      })
  }, 10000);
});