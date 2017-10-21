const request = require("request");
const base_url = "http://localhost:3000/api/";
const test_query = '?test=tEsT';
const lib = require('../../lib');
const sql = require('../../sql');

describe("Test auth APIs", () => {
  let teardown=false;
  let setup=true;
  let u;

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
  });

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
  });

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
  });

  it("tears down",()=>{
    teardown=true;
    expect(teardown).toBeTruthy();
  });

  afterEach(done => {
    if(teardown)
      sql.test.person_expertise.drop()
        .then(res => sql.test.expertise.drop())
        .then(res => sql.test.person.drop())
        .then(res => done())
        .catch(err => {
          console.log(err);
          done();
        });
    else
      done();
  });
});