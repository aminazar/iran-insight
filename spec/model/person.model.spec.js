/**
 * Created by Amin on 01/02/2017.
 */
const Person = require('../../lib/person.model');
const sql  = require('../../sql');
const lib = require('../../lib');

describe("Person model",()=>{
  let pid;
  let u = new Person(true);
  let newU= new Person(true);
  const username = 'a_alavi';
  const pwd = 'testPwd';

  beforeAll(done=>{
    // sql.test.person.drop().then(()=>{}).catch(()=>{});
    lib.dbHelpers.create()
      .then(() => sql.test.person.add({username: username.toLowerCase(), secret: pwd}))
      .then(res=>{
        pid = res.pid;
        done();
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

  it("should save person",done=>{
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

  it("should reload the person after saving",done=>{
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
    newU = new Person(true);
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
    newU = new Person(true);
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
    u = new Person(true);
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

  it("should save data received from google/facebook/linkedin", done => {
    //Create simple object like google callback passport object
    let profile = { id: '111478276625076148179',
      displayName: 'Alireza Hariri',
      name: { familyName: 'Hariri', givenName: 'Alireza' },
      emails: [ { value: 'ali.71hariri@gmail.com', type: 'account' } ],
      photos: [ { value: 'https://lh4.googleusercontent.com/-o05725655m4/AAAAAAAAAAI/AAAAAAAAAYM/dImmjGwBIUk/photo.jpg?sz=50' } ],
      gender: 'male',
      provider: 'google',
      _raw: '{\n "kind": "plus#person",\n "etag": "\\"Sh4n9u6EtD24TM0RmWv7jTXojqc/4OzzjG0pQyz3JMfT493j9oeLWXw\\"",\n "gender": "male",\n "emails": [\n  {\n   "value": "ali.71hariri@gmail.com",\n   "type": "account"\n  }\n ],\n "objectType": "person",\n "id": "111478276625076148179",\n "displayName": "Alireza Hariri",\n "name": {\n  "familyName": "Hariri",\n  "givenName": "Alireza"\n },\n "url": "https://plus.google.com/111478276625076148179",\n "image": {\n  "url": "https://lh4.googleusercontent.com/-o05725655m4/AAAAAAAAAAI/AAAAAAAAAYM/dImmjGwBIUk/photo.jpg?sz=50",\n  "isDefault": false\n },\n "organizations": [\n  {\n   "name": "Alavi high school",\n   "type": "school",\n   "primary": false\n  },\n  {\n   "name": "shahid beheshti university(SBU)",\n   "title": "computer engineering at software",\n   "type": "school",\n   "primary": false\n  }\n ],\n "placesLived": [\n  {\n   "value": "Tehran",\n   "primary": true\n  }\n ],\n "isPlusUser": true,\n "language": "en",\n "ageRange": {\n  "min": 21\n },\n "circledByCount": 89,\n "verified": false\n}\n',
      _json:
        { kind: 'plus#person',
          etag: '"Sh4n9u6EtD24TM0RmWv7jTXojqc/4OzzjG0pQyz3JMfT493j9oeLWXw"',
          gender: 'male',
          emails: [ {value: 'ali.71hariri@gmail.com', type: 'account'}],
          objectType: 'person',
          id: '111478276625076148179',
          displayName: 'Alireza Hariri',
          name: { familyName: 'Hariri', givenName: 'Alireza' },
          url: 'https://plus.google.com/111478276625076148179',
          image:
            { url: 'https://lh4.googleusercontent.com/-o05725655m4/AAAAAAAAAAI/AAAAAAAAAYM/dImmjGwBIUk/photo.jpg?sz=50',
              isDefault: false },
          organizations: [ {value: 'Bent Oak Systems'}],
          placesLived: [ {value: 'Tehran, Iran'} ],
          isPlusUser: true,
          language: 'en',
          ageRange: { min: 21 },
          circledByCount: 89,
          verified: false } };
    let token = 'kjlh123012SDF@$!@5DFGsdfg92134SZ+SAdf-234ASDF';
    let refreshToken = null;
    let req = {query: {
      test: 'tEsT',
    }};
    Person.passportOAuthStrategy(req, token, refreshToken, profile, (err, person) => {
      if(err)
        fail(err);
      else{
        expect(person).toBeTruthy();
        pid = person.pid;
      }

      done();
    });
  });

  it("should get received data from google/facebook/linkedin from database", done => {
    u = new Person(true);
    u.load('ali.71hariri@gmail.com', null)
      .then(res => {
        expect(res.pid).toBe(pid);
        done();
      })
      .catch(err => {
        fail(err);
        done();
      })
  });

  it("should update person data when received data from google/facebook/linkedin for existence person email", done => {
    //Create simple object like google callback object
    let profile = { id: '111478276625076148179',
      displayName: 'John Smith',
      name: { familyName: 'Smith', givenName: 'John' },
      emails: [ { value: 'ali.71hariri@gmail.com', type: 'account' } ],
      photos: [ { value: 'https://lh4.googleusercontent.com/-o05725655m4/AAAAAAAAAAI/AAAAAAAAAYM/dImmjGwBIUk/photo.jpg?sz=50' } ],
      gender: 'male',
      provider: 'google',
      _raw: '{\n "kind": "plus#person",\n "etag": "\\"Sh4n9u6EtD24TM0RmWv7jTXojqc/4OzzjG0pQyz3JMfT493j9oeLWXw\\"",\n "gender": "male",\n "emails": [\n  {\n   "value": "ali.71hariri@gmail.com",\n   "type": "account"\n  }\n ],\n "objectType": "person",\n "id": "111478276625076148179",\n "displayName": "Alireza Hariri",\n "name": {\n  "familyName": "Hariri",\n  "givenName": "Alireza"\n },\n "url": "https://plus.google.com/111478276625076148179",\n "image": {\n  "url": "https://lh4.googleusercontent.com/-o05725655m4/AAAAAAAAAAI/AAAAAAAAAYM/dImmjGwBIUk/photo.jpg?sz=50",\n  "isDefault": false\n },\n "organizations": [\n  {\n   "name": "Alavi high school",\n   "type": "school",\n   "primary": false\n  },\n  {\n   "name": "shahid beheshti university(SBU)",\n   "title": "computer engineering at software",\n   "type": "school",\n   "primary": false\n  }\n ],\n "placesLived": [\n  {\n   "value": "Tehran",\n   "primary": true\n  }\n ],\n "isPlusUser": true,\n "language": "en",\n "ageRange": {\n  "min": 21\n },\n "circledByCount": 89,\n "verified": false\n}\n',
      _json:
        { kind: 'plus#person',
          etag: '"Sh4n9u6EtD24TM0RmWv7jTXojqc/4OzzjG0pQyz3JMfT493j9oeLWXw"',
          gender: 'male',
          emails: [ {value: 'ali.71hariri@gmail.com', type: 'account'}],
          objectType: 'person',
          id: '111478276625076148179',
          displayName: 'Alireza Hariri',
          name: { familyName: 'Hariri', givenName: 'Alireza' },
          url: 'https://plus.google.com/111478276625076148179',
          image:
            { url: 'https://lh4.googleusercontent.com/-o05725655m4/AAAAAAAAAAI/AAAAAAAAAYM/dImmjGwBIUk/photo.jpg?sz=50',
              isDefault: false },
          organizations: [ {value: 'Bent Oak Systems'}],
          placesLived: [ {value: 'Tehran, Iran'} ],
          isPlusUser: true,
          language: 'en',
          ageRange: { min: 21 },
          circledByCount: 89,
          verified: false } };
    let token = 'kjlh123012SDF@$!@5DFGsdfg92134SZ+SAdf-234ASDF';
    let refreshToken = null;
    let req = {query: {
      test: 'tEsT',
    }};
    Person.passportOAuthStrategy(req, token, refreshToken, profile, (err, person) => {
      if(err)
        fail(err);
      else{
        expect(person).toBeTruthy();
        pid = person.pid;
      }

      done();
    });
  });

  it("should update person data (received data from google/facebook/linkedin callback)", done => {
    u = new Person(true);
    u.load('ali.71hariri@gmail.com', null)
      .then(res => {
        expect(res.pid).toBe(pid);
        expect(res.display_name_en).toBe('John Smith');
        expect(res.display_name_fa).toBe(undefined);
        expect(res.firstname_en).toBe('John');
        expect(res.surname_en).toBe('Smith');
        expect(res.firstname_fa).toBe(undefined);
        expect(res.surname_fa).toBe(undefined);
        done();
      })
      .catch(err => {
        fail(err);
        done();
      })
  });

  it("should save data received from google/facebook/linkedin without all data", done => {
    //Create simple object like google callback passport object
    let profile = { id: '111478276625076148179',
      displayName: undefined,
      name: { familyName: 'Sparrow', givenName: 'Jack' },
      emails: [ { value: 'js@k.com', type: 'account' } ],
      photos: [ { value: 'https://lh4.googleusercontent.com/-o05725655m4/AAAAAAAAAAI/AAAAAAAAAYM/dImmjGwBIUk/photo.jpg?sz=50' } ],
      gender: 'male'
    };
    let token = 'kjlh123012SDF@$!@5DFGsdfg92134SZ+SAdf-234ASDF';
    let refreshToken = null;
    let req = {query: {
      test: 'tEsT',
    }};
    Person.passportOAuthStrategy(req, token, refreshToken, profile, (err, person) => {
      if(err)
        fail(err);
      else{
        expect(person).toBeTruthy();
        pid = person.pid;
      }

      done();
    });
  });

  it("should get received data from google/facebook/linkedin from database", done => {
    u = new Person(true);
    u.load('js@k.com', null)
      .then(res => {
        expect(res.pid).toBe(pid);
        expect(res.display_name_en).toBe('Jack Sparrow');
        expect(res.display_name_fa).toBe(undefined);
        expect(res.firstname_en).toBe('Jack');
        expect(res.surname_en).toBe('Sparrow');
        expect(res.firstname_fa).toBe(undefined);
        expect(res.surname_fa).toBe(undefined);
        done();
      })
      .catch(err => {
        fail(err);
        done();
      })
  });

  afterAll(done => {
    if(pid)
      sql.test.person.drop()
        .then(() => done())
        .catch((err) => {
          console.log(err);
          done();
        });
    else
      done();
  })
});