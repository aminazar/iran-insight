const rp = require('request-promise');
const lib = require('../../../lib/index');
const sql = require('../../../sql/index');
const error = require('../../../lib/errors.list');
const moment = require('moment');

describe('Search System', () => {
  let needSetup = true;
  let pJar = null;
  let pId = null;

  let personList = [{
    pid: 10,
    firstname_fa: 'علی',
    surname_fa: 'علوی',
    username: 'a@gmail.com',
    display_name_en: 'Ali Alavi',
  }, {
    pid: 20,
    display_name_en: 'Asghar Taraghe',
    address_fa: 'کوچه شیرزاد، منتهی علیه سمت چپ - درب مشکی',
    username: 'asghar@taraghe.com',
  }, {
    pid: 30,
    firstname_en: 'John',
    surname_en: 'Smith',
    display_name_en: 'JS',
    username: 'JohnSmith@hotmail.com',
  }, {
    pid: 40,
    firstname_fa: 'امیر',
    surname_en: 'Mir',
    mobile_no: '09999991234',
    phone_no: '+2188997766',
    username: 'mir@yahoo.com',
    display_name_en: 'Mir Amir',
  }];

  let businessTypeList = [{
    id: 1,
    name: 'Transportation',
    active: true,
  }, {
    id: 2,
    name: 'Creative',
    name_fa: 'خلاق',
  }];

  let businessList = [{
    bid: 1,
    name: 'Snapp',
    name_fa: 'اسنپ',
    biz_type_id: 1,
    tags: ['transportation', 'online transportation'],
  }, {
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
    tags: ['communication'],
  }];

  let associationList = [{
    aid: 1,
    pid: 10,
    bid: 2,
    start_time: moment(new Date()),
    end_time: moment(new Date(2020, 10, 5)),
    oid: null,
  }, {
    aid: 2,
    pid: 10,
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
    pid: 10,
    bid: null,
    oid: 2,
  }, {
    aid: 6,
    pid: 20,
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
    id1: 1,
    aid: 6,
    start_date: '2016-10-10',
    end_date: '2016-10-11',
    description: 'Assign CEO',
    lce_type_id: 1,
    is_confirmed: true,
  }, {
    id1: 2,
    id2: 3,
    start_date: '2017-08-10',
    description_fa: 'همایش خصوصی سلامت و خلاقیت',
    lce_type_id: 2,
    is_confirmed: true,
  }];

  let productList = [{
    business_id: 1,
    product_id: 1,
    name: 'Candy',
    name_fa: 'آبنبات',
    tags: ['sweet']
  }, {
    business_id: 1,
    product_id: 2,
    name: 'Choocolate',
    name_fa: 'شکلات'
  }, {
    business_id: 3,
    product_id: 3,
    name: 'Milky way traveling'
  }, {
    business_id: 2,
    product_id: 4,
    name: 'Server Distributed Debugging tools'
  }, {
    business_id: 3,
    product_id: 5,
    name: 'Barbari Bread',
    name_fa: 'نان بربری'
  }, {
    business_id: 1,
    product_id: 6,
    name: 'product 6',
  }, {
    business_id: 3,
    product_id: 7,
    name: 'product 7',
  }, {
    business_id: 2,
    product_id: 8,
    name: 'product 8',
  }, {
    business_id: 2,
    product_id: 9,
    name: 'product 9',
  }, {
    business_id: 3,
    product_id: 10,
    name: 'product 10',
  }, {
    business_id: 3,
    product_id: 11,
    name: 'product 11',
  }, {
    business_id: 1,
    product_id: 12,
    name: 'product 12',
  }, {
    business_id: 2,
    product_id: 13,
    name: 'product 13',
  }, {
    business_id: 3,
    product_id: 14,
    name: 'product 14',
  }, {
    business_id: 1,
    product_id: 15,
    name: 'product 15',
  }, {
    business_id: 2,
    product_id: 16,
    name: 'product 16',
  }];

  let expertiseList = [{
    expertise_id: 1,
    name_en: 'Javascript programmer',
    name_fa: 'برنامه نویس جاوااسکریپت',
    is_education: false,
  }, {
    expertise_id: 2,
    name_en: 'Musician',
    name_fa: 'نوازنده',
    is_education: false,
  }, {
    expertise_id: 3,
    name_en: 'Researcher',
    name_fa: 'محقق',
    is_education: true,
  }, {
    expertise_id: 4,
    name_en: 'unemployed',
    name_fa: 'بیکار',
    is_education: false,
  }, {
    expertise_id: 5,
    name_en: 'Italian Chef',
    name_fa: 'آشپز ایتالیایی',
    is_education: false,
  }];

  let investmentList = [{
    assoc_id: 1,
    amount: 200,
    currency: 'USD',
    is_lead: true,
    claimed_by: 10,
    is_confirmed: true,
  }, {
    assoc_id: 3,
    amount: 30,
    currency: 'EUR',
    investment_cycle: 10,
    claimed_by: 30,
    is_confirmed: true,
  }];

  let consultancyList = [{
    assoc_id: 2,
    subject_fa: 'چگونگی ساخت شیشه',
    claimed_by: 20,
    is_mentor: true,
    is_confirmed: true,
  }, {
    assoc_id: 4,
    subject: 'Increasing marketing',
    subject_fa: 'افزایش فروش',
    claimed_by: 30,
    is_confirmed: true,
  }, {
    assoc_id: 6,
    subject: 'Learning business marketing',
    subject_fa: 'آموزش بازاریابی',
    claimed_by: 10,
  }];

  let eventList = [{
    organizer_pid: 20,
    title: 'Shake well before using',
    title_fa: 'قبل از مصرف خوب تکان دهید',
    description_fa: 'چرا باید تکان داد',
    address: 'Online event course',
    start_date: moment({years: 2010, month: 2, date: 9}),
    end_date: moment({years: 2010, month: 2, date: 12}),
    saved_by: 30,
  }, {
    organizer_bid: 3,
    title: 'Be Creative',
    title_fa: 'خلاق باش',
    address: 'not set',
    start_date: moment({years: 2018, month: 3, date: 5}),
    saved_by: 40,
  }, {
    organizer_oid: 2,
    title: 'ICT in world',
    title_fa: 'ICT در دنیا',
    description: 'An analysis on ICT effeteness',
    start_date: new Date(),
    saved_by: 10,
  }];

  let tagList = [
    {
      name: 'transportation',
      active: true,
    },
    {
      name: 'online transportation',
      active: false,
    },
    {
      name: 'sweet food',
      active: false,
    },
    {
      name: 'taxi',
      active: true,
    },
    {
      name: 'traveling',
      active: true,
    },
  ];

  beforeEach(done => {
    let expertise1_id, expertise2_id;
    if (needSetup)
      lib.dbHelpers.create()
        .then(() => lib.dbHelpers.addAndLoginPerson('e3', '123'))
        .then(res => {
          pId = res.pid;
          pJar = res.rpJar;
          return Promise.all(personList.map(el => sql.test.person.add(el)))
        })
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
        .then(() => Promise.all(tagList.map(el => sql.test.tag.add(el))))
        .then(() => {
          // needSetup = false;
          done();
        })
        .catch(err => {
          console.log(err);
          done();
        });
    else
      done();
  });

  // Searching and filtering
  it("(searching) should get first page when offset is invalid", function (done) {
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
      uri: lib.helpers.apiTestURL('search/a/0'),
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

  it("(searching) should search person", function (done) {
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
      uri: lib.helpers.apiTestURL('search/null/null'),
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

  it("(searching) should search business", function (done) {
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
      uri: lib.helpers.apiTestURL('search/0/10'),
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

  it("(searching) should search business (search on tags)", function (done) {
    this.done = done;
    rp({
      method: 'post',
      body: {
        phrase: '   transportation',
        options: {
          target: {
            business: true,
          }
        }
      },
      uri: lib.helpers.apiTestURL('search/0/10'),
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

  it("(searching) should search on product (should trimming)", function (done) {
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
      uri: lib.helpers.apiTestURL('search/0/10'),
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

  it("(searching) should search on product (search on tags)", function (done) {
    this.done = done;
    rp({
      method: 'post',
      body: {
        phrase: ' SwEEt ',
        options: {
          target: {
            product: true,
          }
        }
      },
      uri: lib.helpers.apiTestURL('search/0/10'),
      jar: pJar,
      json: true,
      resolveWithFullResponse: true
    })
      .then(res => {
        expect(res.statusCode).toBe(200);
        expect(res.body.product).not.toBeTruthy();
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });

  it("(searching) should search on consultancy", function (done) {
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
      uri: lib.helpers.apiTestURL('search/0/10'),
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

  it("(searching) should search on investment (without comparison type)", function (done) {
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
      uri: lib.helpers.apiTestURL('search/0/10'),
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

  it("(searching) should search on investment (with comparison type)", function (done) {
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
      uri: lib.helpers.apiTestURL('search/0/10'),
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

  it("(searching) should search on event", function (done) {
    this.done = done;
    rp({
      method: 'post',
      body: {
        phrase: 'on ',
        options: {
          target: {
            event: true,
          },
          start_date: moment(new Date(2010, 10, 10)).format('YYYY-MM-DD'),
        }
      },
      uri: lib.helpers.apiTestURL('search/0/10'),
      jar: pJar,
      json: true,
      resolveWithFullResponse: true
    })
      .then(res => {
        console.log(res.body);
        expect(res.statusCode).toBe(200);
        expect(res.body.event).toBeTruthy();
        expect(res.body.event.length).toBe(1);
        expect(res.body.event.map(el => el.title.toLowerCase())).toContain('ict in world');
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });

  it("(searching) should search on expertise", function (done) {
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
      uri: lib.helpers.apiTestURL('search/0/10'),
      jar: pJar,
      json: true,
      resolveWithFullResponse: true
    })
      .then(res => {
        expect(res.statusCode).toBe(200);
        expect(res.body.expertise).toBeTruthy();
        expect(res.body.expertise.map(el => parseInt(el.total))).toContain(1);
        expect(res.body.expertise.length).toBe(1);
        expect(res.body.expertise[0].name_en.toLowerCase()).toContain('researcher');
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });

  //Below test is ignored because lce not using search system now
  xit("(searching) should search on lce", function (done) {
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
      uri: lib.helpers.apiTestURL('search/0/10'),
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

  it("(searching) should search on multi targets", function (done) {
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
      uri: lib.helpers.apiTestURL('search/0/10'),
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

  it("(searching) should search without setting target", function (done) {
    this.done = done;
    rp({
      method: 'post',
      body: {
        phrase: 'Choocolate',
        options: {

        }
      },
      uri: lib.helpers.apiTestURL('search/0/10'),
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

  it("(searching) should get another page of product", function (done) {
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
      uri: lib.helpers.apiTestURL('search/10/10'),
      jar: pJar,
      json: true,
      resolveWithFullResponse: true
    })
      .then(res => {
        expect(res.statusCode).toBe(200);
        expect(res.body.product).toBeTruthy();
        expect(res.body.product.map(el => parseInt(el.total))).toContain(11);
        expect(res.body.product.length).toBe(1);
        expect(res.body.product[0].name.toLowerCase()).toBe('product 6');
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });

  it("(searching) should get all products if show_all is set", function (done) {
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
      uri: lib.helpers.apiTestURL('search/10/10'),
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

  it("(searching) should get search on type", function (done) {
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
      uri: lib.helpers.apiTestURL('search/0/10'),
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

  it("(searching) should get all data when page size is bigger than results number", function (done) {
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
      uri: lib.helpers.apiTestURL('search/0/20'),
      jar: pJar,
      json: true,
      resolveWithFullResponse: true
    })
      .then(res => {
        expect(res.statusCode).toBe(200);
        expect(res.body.product).toBeTruthy();
        expect(res.body.product.length).toBe(11);
        expect(res.body.product.map(el => el.name.toLowerCase())).toContain('product 6');
        expect(res.body.product.map(el => el.name.toLowerCase())).toContain('product 16');
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });

  it("(searching) should get all tags with specific constraints", function (done) {
    this.done = done;
    rp({
      method: 'post',
      body: {
        phrase: ' tranSPORtation   ',
        options: {
          target: {
            tag: true,
          },
          is_active: true,
        }
      },
      uri: lib.helpers.apiTestURL('search/0/10'),
      jar: pJar,
      json: true,
      resolveWithFullResponse: true
    })
      .then(res => {
        console.log(res.body);
        expect(res.statusCode).toBe(200);
        expect(res.body.tag).toBeTruthy();
        expect(res.body.tag.length).toBe(1);
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });

  it("(searching) should get all tags (no matter activation)", function (done) {
    this.done = done;
    rp({
      method: 'post',
      body: {
        phrase: ' tranSPORtation   ',
        options: {
          target: {
            tag: true,
          },
          is_active: null,
        }
      },
      uri: lib.helpers.apiTestURL('search/0/10'),
      jar: pJar,
      json: true,
      resolveWithFullResponse: true
    })
      .then(res => {
        console.log(res.body);
        expect(res.statusCode).toBe(200);
        expect(res.body.tag).toBeTruthy();
        expect(res.body.tag.length).toBe(2);
        expect(res.body.tag.map(el => el.name.toLowerCase())).toContain('online transportation');
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });

  it("(searching) should get all tags", function (done) {
    this.done = done;
    rp({
      method: 'post',
      body: {
        phrase: null,
        options: {
          target: {
            tag: true,
          },
        }
      },
      uri: lib.helpers.apiTestURL('search/0/10'),
      jar: pJar,
      json: true,
      resolveWithFullResponse: true
    })
      .then(res => {
        console.log(res.body);
        expect(res.statusCode).toBe(200);
        expect(res.body.tag).toBeTruthy();
        expect(res.body.tag.length).toBe(5);
        expect(res.body.tag.map(el => el.name.toLowerCase())).toContain('sweet food');
        expect(res.body.tag.map(el => el.name.toLowerCase())).toContain('taxi');
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });

  it("(searching) should get all events related to specific person", function (done) {
    this.done = done;
    rp({
      method: 'post',
      body: {
        phrase: null,
        options: {
          target: {
            event: true,
          },
          relatedTo: {
            id: 20,
            name: 'person',
          },
        }
      },
      uri: lib.helpers.apiTestURL('search/0/10'),
      jar: pJar,
      json: true,
      resolveWithFullResponse: true
    })
      .then(res => {
        console.log(res.body);
        expect(res.statusCode).toBe(200);
        expect(res.body.event).toBeTruthy();
        expect(res.body.event.length).toBe(1);
        expect(res.body.event.map(el => el.title.toLowerCase())).toContain('shake well before using');
        expect(res.body.event.map(el => el.title_fa.toLowerCase())).toContain('قبل از مصرف خوب تکان دهید');
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });



  //Suggesting
  it('(suggestion) should get all expertise match phrase except expertise that specific user has', function (done) {
    this.done = done;
    sql.test.person_expertise.add({
      pid: pId,
      expertise_id: 1,
    })
      .then(res => {
        return sql.test.person_expertise.add({
          pid: pId,
          expertise_id: 5,
        })
      })
      .then(res => {
        return rp({
          method: 'post',
          body: {
            table: 'expertise',
            phrase: 'نو',
            fieldName: 'name_fa',
            otherFieldName: 'name_en',
            idColumn: 'expertise_id',
            currentIds: [1, 5]
          },
          json: true,
          uri: lib.helpers.apiTestURL('suggest'),
          resolveWithFullResponse: true
        });
      })
      .then(res => {
        expect(res.statusCode).toBe(200);
        expect(res.body.length).toBe(1);
        expect(res.body[0].name_fa).toBe('نوازنده');
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });

  it("(suggestion) should get error when idColumn not defined in object", function (done) {
    rp({
      method: 'post',
      body: {
        table: 'expertise',
        phrase: 'web',
        fieldName: 'name_en',
        otherFieldName: 'name_fa',
      },
      json: true,
      uri: lib.helpers.apiTestURL('suggest'),
      resolveWithFullResponse: true
    })
      .then(res => {
        this.fail('Accept body without pid');
        done();
      })
      .catch(err => {
        expect(err.statusCode).toBe(error.noIdColumn.status);
        expect(err.error).toBe(error.noIdColumn.message);
        done();
      });
  });

  it("(suggestion) should get all result when no phrase defined", function (done) {
    this.done = done;
    sql.test.person_expertise.add({
      pid: pId,
      expertise_id: 1,
    })
      .then(() => rp({
        method: 'post',
        body: {
          table: 'expertise',
          pid: pId,
          fieldName: 'name_en',
          otherFieldName: 'name_fa',
          idColumn: 'expertise_id',
          currentIds: [1],
        },
        json: true,
        uri: lib.helpers.apiTestURL('suggest'),
        resolveWithFullResponse: true
      }))
      .then(res => {
        expect(res.statusCode).toBe(200);
        expect(res.body.length).toBe(4);
        expect(res.body.map(el => el.name_en)).not.toContain('Javascript programmer');
        done();
      })
      .catch(lib.helpers.errorHandler.bind(this));
  });
});