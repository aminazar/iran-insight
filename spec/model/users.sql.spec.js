/**
 * Created by Amin on 01/02/2017.
 */
const env = require("../../env");
const sql = require('../../sql');

describe("Test 'users' table",()=>{
  let uid;
  beforeAll(done=>{
      sql.test.users.create()
        .then(() => {
          done();
        })
        .catch(err => {
          console.log(err.message);
          done();
        });
  });

  it("should add a row to table", done=>{
    sql.test.users.add({name:'Ali Alavi'})
      .then(res=>{
        expect(typeof res.uid).toBe('number');
        uid = res.uid;
        done();
      })
      .catch(err=>{
        fail(err.message);
        done();
      });
  });

  it("should get the row in table", done=>{
    if(uid){
      sql.test.users.get({name:'Ali Alavi'})
        .then(res=>{
          expect(res[0].uid).toBe(uid);
          done();
        })
        .catch(err=>{
          fail(err.message);
          done();
        });
    }
  });

  it("should update a row in table", done=>{
    if(uid){
      sql.test.users.update({name:'Hadi Alavi'},uid)
        .then(res=> {
          expect(res).toBeTruthy();
          done()
        })
        .catch(err=>{
          fail(err.message);
          done();
        })
      }
  });

  it("should get the row in table", done=>{
    if(uid){
      sql.test.users.get({name:'Hadi Alavi'})
        .then(res=>{
          expect(res[0].uid).toBe(uid);
          done();
        })
        .catch(err=>{
          fail(err.message);
          done();
        });
    }
  });

  afterAll((done)=>{
    if(uid)
      sql.test.users.drop().then(res=>done()).catch(err=>{console.log(err.message);done()});
    else done();
  });
});