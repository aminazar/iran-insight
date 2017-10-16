const request = require("request");
const base_url = "http://localhost:3000/api/";
const test_query = '?test=tEsT';
const lib = require('../lib');
const sql = require('../sql');
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

describe("REST API", ()=>{
  describe("root", ()=>{
    it("returns 'respond with a resource'", done => {
      request.get(base_url, function (error, response) {
        expect(response.body).toBe("respond with a resource");
        done();
      })
    });
  });
  describe("user", ()=>{
    let uid;
    let adminUid;
    let u;
    let a;
    let teardown=false;
    let setup=true;
    beforeEach(done=>{
      if(setup) {
        sql.test.users.drop().then(()=>{}).catch(()=>{});
        u = new lib.User(true);
        u.username = 'amin';
        u.password = 'test';
        sql.test.users.create()
          .then(() => {
            u.save()
              .then(id => {
                uid = id;
                setup=false;
                a = new lib.User(true);
                a.username = 'Admin';
                a.password = 'atest';
                a.save()
                  .then(aid=>{
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
      else{
        done();
      }
    });
    it("responds to 'loginCheck'", done => {
      request.post({url: base_url + 'loginCheck' + test_query, form:{username:'amin',password:'test'}}, function (error, response) {
        expect(response.statusCode).toBe(200);
        done();
      });
    });
    it("responds to incorrect login user", done => {
      request.post({url: base_url + 'loginCheck' + test_query, form:{username:'ami',password:'tes'}}, function (error, response) {
        expect(response.statusCode).toBe(400);
        done();
      });
    });
    it("responds to incorrect login password", done => {
      request.post({
        url: base_url + 'loginCheck' + test_query,
        form: {username: 'amin', password: 'tes'}
      }, function (error, response) {
        expect(response.statusCode).toBe(401);
        done();
      })
    });
    it("doesn't save a new user if it is not admin", done => {
      request.put({url: base_url + 'user' + test_query, form:{username:'amin',password:'tes'}}, function(err,res){
        expect(res.statusCode).toBe(403);
        done();
      });
    });

    it("logins as admin", done => {
      req.post({url: base_url + 'login' + test_query, form:{username:'admin',password:'atest'}}, (err,res)=>{
        expect(res.statusCode).toBe(200);
        done();
      })
    });
   it("allows admin to list all users",done => {
     req.get(base_url + 'user' + test_query, (err,res)=>{
       expect(res.statusCode).toBe(200);
       let data = JSON.parse(res.body);
       expect(data.length).toBe(2);
       expect(data.map(r=>r.uid)).toContain(adminUid);
       expect(data.map(r=>r.name)).toContain('admin');
       done();
     })
   });
   it("allows admin to update a username", done => {
     req.post({url: base_url + 'user/' + uid + test_query, form:{username:'aminazar'}}, (err,res)=>{
       expect(res.statusCode).toBe(200);
       done();
     })
   });
   it("allows admin to update a username - checking that update happened", done =>{
     req.post({url: base_url + 'loginCheck' + test_query, form:{username:'aminazar',password:'test'}}, (err,res)=>{
       expect(res.statusCode).toBe(200);
       done();
     })
    });
    it("allows admin to update a password", done => {
      req.post({url: base_url + 'user/' + uid + test_query, form:{password:'test2'}}, (err,res)=>{
        expect(res.statusCode).toBe(200);
        done();
      })
    });
    it("allows admin to update a password - checking that update happened", done =>{
      req.post({url: base_url + 'loginCheck' + test_query, form:{username:'aminazar',password:'test2'}}, (err,res)=>{
        expect(res.statusCode).toBe(200);
        done();
      })
    });
    it("allows admin to update both username and password", done => {
      req.post({url: base_url + 'user/' + uid + test_query, form:{username:'amin2', password:'test3'}}, (err,res)=>{
        expect(res.statusCode).toBe(200);
        done();
      })
    });
    it("allows admin to update both username and password - checking that update happened", done =>{
      req.post({url: base_url + 'loginCheck' + test_query, form:{username:'amin2',password:'test3'}}, (err,res)=>{
        expect(res.statusCode).toBe(200);
        done();
      })
    });
    it("allows admin to delete a user", done => {
      req.delete({url: base_url + 'user/' + uid + test_query, form:{username:'amin2',password:'test3'}}, (err,res)=> {
        expect(res.statusCode).toBe(200);
        done();
      });
    });
    it("allows admin to delete a user - check it happened", done => {
      req.get(base_url + 'user' + test_query, (err,res)=>{
        if(resExpect(res,200)) {
          let data = JSON.parse(res.body);
          expect(data.length).toBe(1);
          expect(data[0].uid).toBe(adminUid);
          expect(data[0].name).toBe('admin');
        }
        done();
      })
    });
    it("allows admin to add a new user", done => {
      req.put({url: base_url + 'user' + test_query, form:{username:'ali',password:'tes'}}, function(err,res){
        if(resExpect(res,200)) {
          uid = JSON.parse(res.body);
          expect(uid).toBeTruthy();
        }
        done();
      });
    });
    it("allows admin to add a new user - checking it happened", done => {
      req.get(base_url + 'user' + test_query, (err,res)=>{
        if(resExpect(res,200)){
          let data = JSON.parse(res.body);
          expect(data.length).toBe(2);
          expect(data.map(r => r.name)).toContain('ali');
          expect(data.map(r => r.uid)).toContain(uid);
        }
        done();
      });
    });
    it("logs out a user", done => {
      req.get(base_url + 'logout' + test_query, (err,res) => {
        expect(res.statusCode).toBe(200);
        done();
      });
    });
    it("logs out a user - checking it happened", done => {
      req.get(base_url + 'user' + test_query, (err,res)=>{
        expect(res.statusCode).toBe(403);
        done();
      });
    });
    it("tears down",()=>{
      teardown=true;
      expect(teardown).toBeTruthy();
    });
    afterEach((done)=>{
      if(uid&&teardown)
        sql.test.users.drop().then(()=>done()).catch(err=>{console.log(err.message);done()});
      else done();
    });
  })
});