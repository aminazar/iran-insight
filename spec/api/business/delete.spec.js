const rp = require('request-promise');
const lib = require('../../../lib/index');
const sql = require('../../../sql/index');

describe("GET Business API", () => {
  let adminObj = {
    pid: null,
    jar: null,
  };
  let repObj = {
    pid: null,
    jar: null,
  };
  let normalUserObj = {
    pid: null,
    jar: null,
  };

  let addProduct = (product, businessId, marketShare = null) => {
    return new Promise((resolve, reject) => {
      sql.test.product.add(product)
        .then(res => {
          return sql.test.business_product.add({
            bid: businessId,
            product_id: res.product_id,
            market_share: marketShare,
          });
        })
        .then(res => resolve())
        .catch(err =>  reject(err));
    });
  };

  beforeEach(done => {
    lib.dbHelpers.create()
      .then(() => lib.dbHelpers.addAndLoginPerson('admin'))
      .then(res => {
        adminObj.pid = res.pid;
        adminObj.jar = res.rpJar;
        return lib.dbHelpers.addAdmin(adminObj.pid);
      })
      .then(res => {
        return lib.dbHelpers.addAndLoginPerson('rep');
      })
      .then(res => {
        repObj.pid = res.pid;
        repObj.jar = res.rpJar;
        return sql.test.organization_type.add({
          id: 101,
          name: 'non-governmental',
          name_fa: 'غیر دولتی',
        });
      })
      .then(() => lib.dbHelpers.addOrganizationWithRep(repObj.pid, 'MTN'))
      .then(() => done())
      .catch(err => {
        console.log('err');
        done();
      });
  });
});