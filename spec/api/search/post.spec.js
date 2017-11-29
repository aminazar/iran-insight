const rp = require('request-promise');
const lib = require('../../../lib/index');
const sql = require('../../../sql/index');
const error = require('../../../lib/errors.list');
const moment = require('moment');

describe("Search System", () => {
  let needSetup = true;
  let pJar = null;

  let personList = [{
    pid: 1,
    firstname_fa: 'علی',
    surname_fa: 'علوی',
    username: 'a@gmail.com',
  },{
    pid: 2,
    display_name_en: 'Asghar Taraghe',
    address_fa: 'کوچه شیرزاد، منتهی علیه سمت چپ - درب مشکی',
    username: 'asghar@taraghe.com',
  },{
    pid: 3,
    firstname_en: 'John',
    surname_en: 'Smith',
    display_name_en: 'JS',
    username: 'JohnSmith@hotmail.com',
  },{
    pid: 4,
    firstname_fa: 'امیر',
    surname_en: 'Mir',
    mobile_no: '09999991234',
    phone_no: '+2188997766',
    username: 'mir@yahoo.com',
  }];

  let businessTypeList = [{
    id: 1,
    name: 'Transportation',
    active: true,
  },{
    id: 2,
    name: 'Creative',
    name_fa: 'خلاق',
  }];

  let businessList = [{
    bid: 1,
    name: 'Snapp',
    name_fa: 'اصنپ',
    biz_type_id: 1,
  },{
    bid: 2,
    name_fa: 'تک ماکارون',
    tel: '+7110203040',
    address_fa: 'خیابان - کوچه - سر کوچه'
  }, {
    bid: 3,
    name: 'Willy Wonka Choocolate',
    url: 'willy.wonka.cho.com',
    address: 'Charlie and the Chocolate Factory book',
    biz_type_id: 2,
  }];

  let organizationList = [{
    oid: 1,
    name: 'Managing Crisis',
    name_fa: 'مدیریت بحران',
  }, {
    oid: 2,
    name: 'MTN',
  }];

  let associationList = [{
    aid: 1,
    pid: 1,
    bid: 2,
    start_date: moment(new Date()),
    end_date: moment(new Date(2020, 10, 5)),
    oid: null,
  }, {
    aid: 2,
    pid: 1,
    bid: 2,
    oid: null,
  }, {
    aid: 3,
    pid: null,
    bid: 1,
    oid: 1,
  }, {
    aid: 4,
    pid: null,
    bid: 2,
    oid: 2,
  }, {
    aid: 5,
    pid: 1,
    bid: null,
    oid: 2,
  }, {
    aid: 6,
    pid: 2,
    bid: 2,
    oid: null,
  }];

  let lceTypeList = [{
    id: 1,
    name: 'LCE 1',
    active: true,
  }, {
    id: 2,
    name: 'LCE 2',
    active: true,
  }];

  let businessLCEList = [{
    bid1: 1,
    aid: 6,
    start_date: '2016-10-10',
    end_date: '2016-10-11',
    description: 'Assign CEO',
    lce_type_id: 1,
    is_confirmed: true,
  }, {
    bid1: 2,
    bid2: 3,
    start_date: '2017-08-10',
    description_fa: 'همایش خصوصی سلامت و خلاقیت',
    lce_type_id: 2,
    is_confirmed: true,
  }];

  let productList = [{
    product_id: 1,
    name: 'Candy',
    name_fa: 'آبنبات'
  }, {
    product_id: 2,
    name: 'Choocolate',
    name_fa: 'شکلات'
  },{
    product_id: 3,
    name: 'Milky way traveling'
  }, {
    product_id: 4,
    name: 'Server Distributed Debugging tools'
  }, {
    product_id: 5,
    name: 'Barbari Bread',
    name_fa: 'نان بربری'
  }, {
    product_id: 6,
    name: 'product 6',
  },{
    product_id: 7,
    name: 'product 7',
  }, {
    product_id: 8,
    name: 'product 8',
  }, {
    product_id: 9,
    name: 'product 9',
  }, {
    product_id: 10,
    name: 'product 10',
  }, {
    product_id: 11,
    name: 'product 11',
  }, {
    product_id: 12,
    name: 'product 12',
  }, {
    product_id: 13,
    name: 'product 13',
  }, {
    product_id: 14,
    name: 'product 14',
  }, {
    product_id: 15,
    name: 'product 15',
  }, {
    product_id: 16,
    name: 'product 16',
  }];

  let expertiseList = [{
    name_en: 'Javascript programmer',
    name_fa: 'برنامه نویس جاوااسکریپت',
    is_education: false,
  }, {
    name_en: 'Musician',
    name_fa: 'نوازنده',
    is_education: false,
  }, {
    name_en: 'Researcher',
    name_fa: 'محقق',
    is_education: true,
  }, {
    name_en: 'unemployed',
    name_fa: 'بیکار',
    is_education: false,
  }, {
    name_en: 'Italian Chef',
    name_fa: 'آشپز ایتالیایی',
    is_education: false,
  }];

  let investmentList = [{
    assoc_id: 1,
    amount: 200,
    currency: 'USD',
    is_lead: true,
    claimed_by: 1,
    is_confirmed: true,
  }, {
    assoc_id: 3,
    amount: 30,
    currency: 'EUR',
    investment_cycle: 10,
    claimed_by: 3,
    is_confirmed: true,
  }];

  let consultancyList = [{
    assoc_id: 2,
    subject_fa: 'چگونگی ساخت شیشه',
    claimed_by: 2,
    is_mentor: true,
    is_confirmed: true,
  }, {
    assoc_id: 4,
    subject: 'Increasing marketing',
    subject_fa: 'افزایش فروش',
    claimed_by: 3,
    is_confirmed: true,
  }, {
    assoc_id: 6,
    subject: 'Learning business marketing',
    subject_fa: 'آموزش بازاریابی',
    claimed_by: 1,
  }];

  let eventList = [{
    organizer_pid: 2,
    title: 'Shake well before using',
    title_fa: 'قبل از مصرف خوب تکان دهید',
    description_fa: 'چرا باید تکان داد',
    address: 'Online event course',
    start_date: moment({years: 2010, month: 2, date: 9}),
    end_date: moment({years: 2010, month: 2, date: 12}),
    saved_by: 3,
  }, {
    organizer_bid: 3,
    title: 'Be Creative',
    title_fa: 'خلاق باش',
    address: 'not set',
    start_date: moment({years: 2018, month: 3, date: 5}),
    saved_by: 4,
  }, {
    organizer_oid: 2,
    title: 'ICT in world',
    title_fa: 'ICT در دنیا',
    description: "An analysis on ICT effeteness",
    start_date: new Date(),
    saved_by: 1,
  }];

  beforeEach(done => {
    let expertise1_id, expertise2_id;
    if (needSetup)
      lib.dbHelpers.create()
        .then(() => Promise.all(personList.map(el => sql.test.person.add(el))))
        .then(() => Promise.all(businessTypeList.map(el => sql.test.business_type.add(el))))
        .then(() => Promise.all(businessList.map(el => sql.test.business.add(el))))
        .then(() => Promise.all(organizationList.map(el => sql.test.organization.add(el))))
        .then(() => Promise.all(associationList.map(el => sql.test.association.add(el))))
        .then(() => Promise.all(lceTypeList.map(el => sql.test.lce_type.add(el))))
        .then(() => Promise.all(businessLCEList.map(el => sql.test.business_lce.add(el))))
        .then(() => Promise.all(productList.map(el => sql.test.product.add(el))))
        .then(() => Promise.all(expertiseList.map(el => sql.test.expertise.add(el))))
        .then(() => Promise.all(investmentList.map(el => sql.test.investment.add(el))))
        .then(() => Promise.all(consultancyList.map(el => sql.test.consultancy.add(el))))
        .then(() => Promise.all(eventList.map(el => sql.test.event.add(el))))
        .then(() => lib.dbHelpers.addAndLoginPerson('e3', '123', {pid: 50}))
        .then(res => {
          pJar = res.rpJar;
          needSetup = false;
          done()
        })
        .catch(err => {
          console.log(err);
          done();
        });
    else
      done();
  });

  it("should get first page when offset is invalid", function (done) {
    this.done = done;
    rp({
      method: 'post',
      body: {
        phrase: 'ap',
        options: {
          target: {
            business: true
          }
        }
      },
      uri: lib.helpers.apiTestURL('search/a'),
      jar: pJar,
      json: true,
      resolveWithFullResponse: true,
    })
      .then(res => {
        expect(res.statusCode).toBe(200);
        expect(res).toBeTruthy();
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });

  it("should search person", function (done) {
    this.done = done;
    rp({
      method: 'post',
      body: {
        phrase: 'MI',
        options: {
          target: {
            person: true,
            business: false,
          }
        }
      },
      uri: lib.helpers.apiTestURL('search/null'),
      jar: pJar,
      json: true,
      resolveWithFullResponse: true
    })
      .then(res => {
        console.log(res.body);
        expect(res.statusCode).toBe(200);
        expect(res.body.person).toBeTruthy();
        expect(res.body.business).not.toBeTruthy();
        expect(res.body.product).not.toBeTruthy();
        expect(res.body.person.length).toBe(2);
        expect(res.body.person.map(el => el.surname_en)).toContain('Smith');
        expect(res.body.person.map(el => el.surname_en)).toContain('Mir');
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });

  it("should search business", function (done) {
    this.done = done;
    rp({
      method: 'post',
      body: {
        phrase: 'ap',
        options: {
          target: {
            business: true,
          }
        }
      },
      uri: lib.helpers.apiTestURL('search/0'),
      jar: pJar,
      json: true,
      resolveWithFullResponse: true
    })
      .then(res => {
        expect(res.statusCode).toBe(200);
        expect(res.body.person).not.toBeTruthy();
        expect(res.body.business).toBeTruthy();
        expect(res.body.product).not.toBeTruthy();
        expect(res.body.business.length).toBe(1);
        expect(res.body.business[0].name.toLowerCase()).toBe('snapp');
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });

  it("should search on product (should trimming)", function (done) {
    this.done = done;
    rp({
      method: 'post',
      body: {
        phrase: ' oo   ',
        options: {
          target: {
            product: true,
          }
        }
      },
      uri: lib.helpers.apiTestURL('search/0'),
      jar: pJar,
      json: true,
      resolveWithFullResponse: true
    })
      .then(res => {
        expect(res.statusCode).toBe(200);
        expect(res.body.product).toBeTruthy();
        expect(res.body.product.length).toBe(2);
        expect(res.body.product.map(el => el.name.toLowerCase())).toContain('choocolate');
        expect(res.body.product.map(el => el.name.toLowerCase())).toContain('server distributed debugging tools');
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });

  it("should search on consultancy", function (done) {
    this.done = done;
    rp({
      method: 'post',
      body: {
        phrase: 'ش',
        options: {
          target: {
            consultancy: true,
          },
          is_mentor: false,
        }
      },
      uri: lib.helpers.apiTestURL('search/0'),
      jar: pJar,
      json: true,
      resolveWithFullResponse: true
    })
      .then(res => {
        expect(res.statusCode).toBe(200);
        expect(res.body.consultancy).toBeTruthy();
        expect(res.body.consultancy.length).toBe(1);
        expect(res.body.consultancy.map(el => el.subject && el.subject.toLowerCase())).toContain('increasing marketing');
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });

  it("should search on investment (without comparison type)", function (done) {
    this.done = done;
    rp({
      method: 'post',
      body: {
        phrase: ' GBP ',
        options: {
          target: {
            investment: true,
          },
          amount: 200,
          is_lead: true,
        }
      },
      uri: lib.helpers.apiTestURL('search/0'),
      jar: pJar,
      json: true,
      resolveWithFullResponse: true
    })
      .then(res => {
        expect(res.statusCode).toBe(200);
        expect(res.body.investment).toBeTruthy();
        expect(res.body.investment.length).toBe(1);
        expect(res.body.investment[0].person_firstname_fa).toBe('علی');
        expect(res.body.investment[0].person_surname_fa).toBe('علوی');
        expect(res.body.investment[0].business_name_fa).toBe('تک ماکارون');
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });

  it("shoule search on investment (with comparison type)", function (done) {
    this.done = done;
    rp({
      method: 'post',
      body: {
        phrase: ' GBP ',
        options: {
          target: {
            investment: true,
          },
          amount: 200,
          is_lead: false,
          comparison_type: {
            lt: true,
            gt: false,
          }
        }
      },
      uri: lib.helpers.apiTestURL('search/0'),
      jar: pJar,
      json: true,
      resolveWithFullResponse: true
    })
      .then(res => {
        expect(res.statusCode).toBe(200);
        expect(res.body.investment).toBeTruthy();
        expect(res.body.investment.length).toBe(1);
        expect(res.body.investment[0].organization_name).toBe('Managing Crisis');
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });

  it("should search on event", function (done) {
    this.done = done;
    rp({
      method: 'post',
      body: {
        phrase: 'on ',
        options: {
          target: {
            event: true,
          },
          start_date: new Date(2010, 1, 1),
        }
      },
      uri: lib.helpers.apiTestURL('search/0'),
      jar: pJar,
      json: true,
      resolveWithFullResponse: true
    })
      .then(res => {
        console.log(res.body);
        expect(res.statusCode).toBe(200);
        expect(res.body.event).toBeTruthy();
        expect(res.body.event.length).toBe(2);
        expect(res.body.event.map(el => el.title.toLowerCase())).toContain('shake well before using');
        expect(res.body.event.map(el => el.title.toLowerCase())).toContain('ict in world');
        expect(res.body.event.map(el => el.person_display_name_en && el.person_display_name_en.toLowerCase())).toContain('asghar taraghe');
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });

  it("should search on expertise", function (done) {
    this.done = done;
    rp({
      method: 'post',
      body: {
        phrase: null,
        options: {
          target: {
            expertise: true,
          },
          is_education: true,
        }
      },
      uri: lib.helpers.apiTestURL('search/0'),
      jar: pJar,
      json: true,
      resolveWithFullResponse: true
    })
      .then(res => {
        expect(res.statusCode).toBe(200);
        expect(res.body.expertise).toBeTruthy();
        expect(res.body.expertise.length).toBe(1);
        expect(res.body.expertise[0].name_en.toLowerCase()).toContain('researcher');
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });

  it("should search on lce", function (done) {
    this.done = done;
    rp({
      method: 'post',
      body: {
        phrase: '',
        options: {
          target: {
            lce: true,
          },
          start_date: '2015-09-09',
        }
      },
      uri: lib.helpers.apiTestURL('search/0'),
      jar: pJar,
      json: true,
      resolveWithFullResponse: true
    })
      .then(res => {
        expect(res.statusCode).toBe(200);
        expect(res.body.lce).toBeTruthy();
        expect(res.body.lce.length).toBe(2);
        expect(res.body.lce.map(el => el.description && el.description.toLowerCase())).toContain('assign ceo');
        expect(res.body.lce.map(el => el.description_fa && el.description_fa.toLowerCase())).toContain('همایش خصوصی سلامت و خلاقیت');
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });

  it("should search on multi targets", function (done) {
    this.done = done;
    rp({
      method: 'post',
      body: {
        phrase: 'Choocolate',
        options: {
          target: {
            product: true,
            business: true,
            person: true,
            organization: true,
          },
        }
      },
      uri: lib.helpers.apiTestURL('search/0'),
      jar: pJar,
      json: true,
      resolveWithFullResponse: true
    })
      .then(res => {
        console.log(res.body);
        expect(res.statusCode).toBe(200);
        expect(res.body.person).not.toBeTruthy();
        expect(res.body.organization).not.toBeTruthy();
        expect(res.body.business).toBeTruthy();
        expect(res.body.product).toBeTruthy();
        expect(res.body.business.length).toBe(1);
        expect(res.body.product.length).toBe(0);
        expect(res.body.business[0].name.toLowerCase()).toBe('willy wonka choocolate');
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });

  it("should search without setting target", function (done) {
    this.done = done;
    rp({
      method: 'post',
      body: {
        phrase: 'Choocolate',
        options: {

        }
      },
      uri: lib.helpers.apiTestURL('search/0'),
      jar: pJar,
      json: true,
      resolveWithFullResponse: true
    })
      .then(res => {
        expect(res.statusCode).toBe(200);
        expect(res.body.business).toBeTruthy();
        expect(res.body.product).toBeTruthy();
        expect(res.body.business.length).toBe(1);
        expect(res.body.product.length).toBe(0);
        expect(res.body.business[0].name.toLowerCase()).toBe('willy wonka choocolate');
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });

  it("should get another page of product", function (done) {
    this.done = done;
    rp({
      method: 'post',
      body: {
        phrase: 'product',
        options: {
          target: {
            product: true,
          }
        }
      },
      uri: lib.helpers.apiTestURL('search/10'),
      jar: pJar,
      json: true,
      resolveWithFullResponse: true
    })
      .then(res => {
        expect(res.statusCode).toBe(200);
        expect(res.body.product).toBeTruthy();
        expect(res.body.product.length).toBe(1);
        expect(res.body.product[0].name.toLowerCase()).toBe('product 6');
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });

  it("should get all products if show_all is set", function (done) {
    this.done = done;
    rp({
      method: 'post',
      body: {
        phrase: 'product',
        options: {
          target: {
            product: true,
          },
          show_all: true,
        }
      },
      uri: lib.helpers.apiTestURL('search/10'),
      jar: pJar,
      json: true,
      resolveWithFullResponse: true
    })
      .then(res => {
        expect(res.statusCode).toBe(200);
        expect(res.body.product).toBeTruthy();
        expect(res.body.product.length).toBe(6);
        expect(res.body.product.map(el => el.name.toLowerCase())).toContain('candy');
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });

  it("should get search on type", function (done) {
    this.done = done;
    rp({
      method: 'post',
      body: {
        phrase: ' e',
        options: {
          target: {
            type: true,
          },
          is_active: true,
        }
      },
      uri: lib.helpers.apiTestURL('search/0'),
      jar: pJar,
      json: true,
      resolveWithFullResponse: true
    })
      .then(res => {
        console.log(res.body);
        expect(res.statusCode).toBe(200);
        expect(res.body.type).toBeTruthy();
        expect(res.body.type.length).toBe(2);
        expect(res.body.type.map(el => el.name && el.name.toLowerCase())).toContain('lce 2');
        expect(res.body.type.map(el => el.table_name.toLowerCase())).toContain('lce');
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });
});