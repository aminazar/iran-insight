const rp = require("request-promise");
const lib = require('../../../lib/index');
const sql = require('../../../sql/index');
const error = require('../../../lib/errors.list');
const env = require('../../../env');

describe("Get expertise API", () => {
  let normalUser = {
    pid: null,
    jar: null,
  };

  let addExpertise = (newExpertise) => {
    return sql.test.expertise.add(newExpertise)
  };

  beforeEach(done => {
    lib.dbHelpers.create()
      .then(() => lib.dbHelpers.addAndLoginPerson('nu'))
      .then(res => {
        normalUser.pid = res.pid;
        normalUser.jar = res.rpJar;

        let promiseList = [];
        [{
          expertise_id: 1,
          name_en: 'Graphic Design',
          name_fa: 'طراحی گرافیکی',
          is_education: false,
        },{
          expertise_id: 2,
          name_en: 'Computer Science - Artificial Intelligence',
          name_fa: 'علوم کامپیوتر - هوش مصنوعی',
          is_education: true,
        },{
          expertise_id: 3,
          name_en: 'Web Programming',
          name_fa: 'برنامه نویسی وب',
          is_education: false,
        }].forEach(el => promiseList.push(addExpertise(el)));
        return Promise.all(promiseList);
      })
      .then(res => {
        done();
      })
      .catch(err => {
        console.error('before each => ', err);
        done();
      })
  });

  it("should get all expertise", function (done) {
    this.done = done;
    rp({
      method: 'get',
      uri: lib.helpers.apiTestURL('expertise'),
      jar: normalUser.jar,
      resolveWithFullResponse: true,
    })
      .then(res => {
        let data = JSON.parse(res.body);
        expect(res.statusCode).toBe(200);
        expect(data.length).toBe(3);
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this))
  });

  it('should get specific expertise', function (done) {
    this.done = done;
    rp({
      method: 'get',
      uri: lib.helpers.apiTestURL('expertise/1'),
      jar: normalUser.jar,
      resolveWithFullResponse: true,
    })
      .then(res => {
        let data = JSON.parse(res.body);
        expect(res.statusCode).toBe(200);
        expect(data.length).toBe(1);
        expect(data[0].name_en.toLowerCase()).toBe('graphic design');
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });
});