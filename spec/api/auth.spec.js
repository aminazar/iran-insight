const request = require("request");
const base_url = "http://localhost:3000/api/";
const test_query = '?test=tEsT';
const lib = require('../../lib');
const sql = require('../../sql');
let req = request.defaults({jar: true});//enabling cookies

let resExpect = (res, statusCode) => {
  if(res.statusCode !== statusCode){
    let jres = JSON.parse(res.body);
    let msg = jres.Message ? jres.Message : jres;
    expect(res.statusCode).toBe(statusCode,`Expected response code ${statusCode}, received ${res.statusCode}. Server response: ${msg}`);
    if(jres.Stack) {
      let err = new Error();
      err.message = jres.Message;
      err.stack = jres.Stack;
      console.log(`Server responds with unexpected error:`, err);
    }
    return false;
  }
  return true;
};

describe("Test auth APIs", () => {
  let teardown=false;
  let setup=true;
  let u;

  beforeEach(done => {
    if(setup){
      sql.test.person.drop().then(() => {}).catch(() => {});
      sql.test.person.create()
        .then(() => sql.test.expertise.create())
        .then(() => sql.test.person_expertise.create())
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

  it("should call google authentication API", (done) => {
    req.get(base_url + 'login/google' + test_query, (err, res) => {
      expect(res.statusCode).toBe(200);
      done();
    })
  });

  it("should call facebook authentication API", (done) => {
    req.get(base_url + 'login/facebook' + test_query, (err, res) => {
      expect(res.statusCode).toBe(200);
      done();
    });
  });

  it("should call linkedin authentication API", (done) => {
    req.get(base_url + 'login/linkedin' + test_query, (err, res) => {
      expect(res.statusCode).toBe(200);
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