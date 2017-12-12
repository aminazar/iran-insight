const rp = require('request-promise');
const lib = require('../../../lib/index');
const sql = require('../../../sql/index');
const error = require('../../../lib/errors.list');
const request = require("request");
let req = request.defaults({jar: true}); //enabling cookies


let adminObj = {
  pid: null,
  jar: null,
};
let userObj = {
  pid: null,
  jar: null,
};

let product_info = [{
  name: 'ball',
  name_fa: 'توپ',
  description:'football ball',
  description_fa:'توپ فوتبال',
  parent_product_id: null,
  tags: null,
},{
  name: 'bag',
  name_fa: 'کیف',
  description:'leather bag',
  description_fa:'کیف چرمی',
  parent_product_id: null,
  tags: null,
}];

let biz_info = [{
  bid: 1,
  name: 'snap',
  name_fa: 'اسنپ',
  ceo_pid: 3,
  biz_type_id: 201,
  address: 'Iran-Qom',
  address_fa: 'ایران - قم',
  tel: '025 77307730',
  url: null,
  general_stats: null,
  financial_stats: null
}, {
  bid: 2,
  name: 'tapsi',
  name_fa: 'تپسی',
  ceo_pid: 3,
  biz_type_id: 201,
  address: 'Iran-Tehran',
  address_fa: 'ایران - تهران',
  tel: '02188668866',
  url: null,
  general_stats: null,
  financial_stats: null
}];

let createNewProduct = (product_info) => {

  return sql.test.product.add(product_info);
};



describe('DELETE product API', () =>{

 beforeEach(done =>{
   lib.dbHelpers.create()
     .then(() => {
        return lib.dbHelpers.addAndLoginPerson('admin','test')
      })
     .then((res) => {
       adminObj.pid = res.pid;
       adminObj.jar = res.rpJar;
       return lib.dbHelpers.addAdmin(adminObj.pid);
     })
     .then(() =>{
       return Promise.all(product_info.map(el => createNewProduct(el)))
     })
     .then((res) => {
       done();
     })
     .catch(err => {
       console.log(err.message);
       done();
     });
 })

  it('admin should be able to delete a product(from product table!)', done =>{
    rp({
      method: 'DELETE',
      uri: lib.helpers.apiTestURL(`delete-product/1`),
      jar: adminObj.jar,
      resolveWithFullResponse: true,
    })
    .then((res)=>{
      expect(res.statusCode).toBe(200);
      return sql.test.product.getAll()
    })
    .then((res) =>{
      expect(res.length).toBe(1);
      done();
    })
    .catch(err => {
      console.log(err.message);
      done();
    });
  })

  it('admin should be able to delete a product(from product table and from bussiness_product table too)', done =>{

    rp({
      method: 'DELETE',
      uri: lib.helpers.apiTestURL(`delete-product/1`),
      jar: adminObj.jar,
      resolveWithFullResponse: true,
    })
      .then((res)=>{
        expect(res.statusCode).toBe(200);
        return sql.test.product.getAll()
      })
      .then((res) =>{
        expect(res.length).toBe(1);
        done();
      })
      .catch(err => {
        console.log(err.message);
        done();
      });
  })

  it('a normal user should not be able to delete a product', done =>{
    rp({
      method: 'DELETE',
      uri: lib.helpers.apiTestURL(`delete-product/1`),
      jar: userObj.jar,
      resolveWithFullResponse: true,
    })
      .then(res => {
        this.fail('regular user can not delete product, only admin can do this.');
        done();
      })
      .catch(err => {
        expect(err.statusCode).toBe(error.adminOnly.status);
        expect(err.error).toBe(error.adminOnly.message);
        console.log('=====>', err.statusCode);
        done();
      });
  })

})