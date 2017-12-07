const SearchSystem = require('../../lib/search.system');
const sql  = require('../../sql');
const lib = require('../../lib');

describe("Search System",()=> {
  let pid;

  beforeEach(done => {
    lib.dbHelpers.create()
      .then(() => done())
      .catch(err => {
        console.log('Cannot drop and create tables. ', err);
        done();
      })
  });

  it("should return search result", function (done) {
    sql.test.person.add({
      username: 'a.alavi1far',
      display_name_en: 'AA',
    })
      .then(res => {
        let s = new SearchSystem(true);
        return s.search({
          phrase: 'alavi',
          options: {
            target: {
              person: true,
            },
          }
        });
      })
      .then(res => {
        console.log('Get result: ', res);
        expect(res.person.length).toBe(1);
        done();
      })
      .catch(err => {
        fail(err);
        done();
      });
  });
});