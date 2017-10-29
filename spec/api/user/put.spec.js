const rp = require("request-promise");
const lib = require('../../../lib/index');
const sql = require('../../../sql/index');

describe("PUT user API", () => {
  let adminObj = {
    pid: null,
    jar: null
  };

  beforeEach(done => {
    lib.dbHelpers.create()
      .then(() => lib.dbHelpers.addAndLoginPerson('admin', 'admin123'))
      .then(res => {
        adminObj.pid = res.pid;
        adminObj.jar = res.rpJar;
        return lib.dbHelpers.addAdmin(res.pid);
      })
      .then(() => {
        done();
      })
      .catch(err => {
        console.error(err);
        done();
      })
  });

  it("admin should be able to add an expertise (object)", function (done) {
    this.done = done;
    rp({
      method: 'put',
      body: {
        name_en: 'Web Programming',
        name_fa: 'برنامه نویسی وب',
        is_education: false,
      },
      json:true,
      uri: lib.helpers.apiTestURL('expertise'),
      jar: adminObj.jar,
      resolveWithFullResponse: true,
    })
      .then(res => {
        expect(res.statusCode).toBe(200);
        return sql.test.expertise.select();
      })
      .then(res => {
        expect(res.length).toBe(1);
        expect(res[0].name_en).toBe('Web Programming');
        expect(res[0].name_fa).toBe('برنامه نویسی وب');
        expect(res[0].is_education).toBe(false);
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });

  it("admin should add two expertise (array)", function (done) {
    this.done = done;
    let data = [];
    data.push({
      name_en: 'Graphic Design',
      name_fa: 'طراحی گرافیکی',
      is_education: false,
    });
    data.push({
      name_en: 'Computer Science - Artificial Intelligence',
      name_fa: 'علوم کامپیوتر - هوش مصنوعی',
      is_education: true,
    });
    rp({
      method: 'put',
      body: data,
      uri: lib.helpers.apiTestURL('expertise'),
      jar: adminObj.jar,
      json: true,
      resolveWithFullResponse: true,
    })
      .then(res => {
      expect(res.statusCode).toBe(200);
      return sql.test.expertise.select();
    })
      .then(res => {
        expect(res.length).toBe(2);
        expect(res[0].name_en).toBe('Graphic Design');
        expect(res[0].name_fa).toBe('طراحی گرافیکی');
        expect(res[0].is_education).toBe(false);
        expect(res[1].name_en).toBe('Computer Science - Artificial Intelligence');
        expect(res[1].name_fa).toBe('علوم کامپیوتر - هوش مصنوعی');
        expect(res[1].is_education).toBe(true);
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  })


});