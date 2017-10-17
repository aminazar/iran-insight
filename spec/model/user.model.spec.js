/**
 * Created by Amin on 01/02/2017.
 */
const User = require('../../lib/user.model');
const sql  = require('../../sql');

describe("User model",()=>{
  let pid;
  let u = new User(true);
  let newU= new User(true);
  const username = 'a_alavi';
  const pwd = 'testPwd';

  beforeAll(done=>{
    sql.test.person.drop().then(()=>{}).catch(()=>{});
    sql.test.person.create()
      .then(() => {
        sql.test.person.add({username: username.toLowerCase(), secret: pwd})
          .then(res=>{
            pid = res.pid;
            done();
          })
          .catch(err => {
            console.log(err.message);
            done();
          });
      })
      .catch(err => {
        console.log(err.message);
        done();
      });
  });

  it("should load from db",done=>{
    u.load(username,pwd)
      .then(res=> {
        expect(res.pid).toBe(pid);
        expect(u.pid).toBe(pid);
        done()
      })
      .catch(err=> {
        fail(err.message);
        done();
      });
  });

  it("should fail on password check initially",done=>{
    u.secret = undefined;
    u.checkPassword()
      .then(()=>{
        fail("succeeded!");
        done();
      })
      .catch(err=>{
        expect(err.message).toBe("No password is set up");
        done()
      });
  });

  it("should save user",done=>{
    u.exportData()
      .then((data)=>{
        expect(data.username).toBe(username.toLowerCase());
        expect(data.secret).toBeTruthy();
        expect(data.secret===pwd).toBeFalsy();
        done();
      })
      .catch(err=>{
        fail(err.message);
        done();
      });
  });

  it("should matches password after hashing",done=>{
    u.checkPassword()
      .then(()=>{
        done();
      })
      .catch(err=>{
        fail(err);
        done()
      });
  });
  it("should exports name and hashed password",done=>{
    u.username += '.x';
    u.save()
      .then(data=>{
        expect(data).toBe(pid);
        done();
      })
      .catch(err=>{
        fail(err.message);
        done();
      });
  });

  it("should reload the user after saving",done=>{
    newU.load(username.toUpperCase()+'.X',pwd)
      .then(()=>{
        expect(newU.pid).toBe(pid);
        done();
      })
      .catch(err=>{
        fail(err.message);
        done();
      })
  });

  it("should match password after hashing",done=>{
    newU.checkPassword()
      .then(()=>{
        done();
      })
      .catch(err=>{
        fail(err);
        done()
      });
  });

  it("should mismatch wrong password",done=>{
    newU.password+='x';
    newU.checkPassword()
      .then(()=>{
        fail('It matches!');
        done();
      })
      .catch(err=>{
        expect(err.message).toBe('Incorrect password');
        done();
      });
  });

  it("should login with different letter case of username",done=>{
    newU = new User(true);
    newU.loginCheck(username.toLowerCase()+'.X',pwd)
      .then(()=>{
        expect(true).toBeTruthy();
        done();
      })
      .catch(err=>{
        fail(err.message);
        done();
      })
  });

  it("should login with correct password",done=>{
    newU = new User(true);
    newU.loginCheck(username+'.x',pwd)
      .then(()=>{
        expect(true).toBeTruthy();
        done();
      })
      .catch(err=> {
        fail(err.message);
        done();
      })
  });

  it("should maintain unique name",done=>{
    u = new User(true);
    u.username = username.toLowerCase() + '.x';
    u.password = '123';
    u.save()
      .then(()=>{
        fail('inserted the same name twice');
        done();
      })
      .catch((err)=>{
        expect(err.message).toContain('duplicate key value');
        done();
      });
  });
});