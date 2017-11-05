const Joiner = require('../../lib/joiner.model');
const sql = require('../../sql');

describe("Joiner Model", () => {
  it('should parse an empty list to nested object', () => {
    Joiner.test = true;
    spyOn(sql.test.membership, 'repPendingUsers').and.returnValue(Promise.resolve(
      []));
    Joiner.select(10)
      .then(res => {
        // console.log(JSON.stringify(res,null, 2));
        expect(sql.test.membership.repPendingUsers).toHaveBeenCalledWith({pid:10});
        expect(res.biz).toBeDefined();
        expect(res.org).toBeDefined();
        expect(res.biz.length).toBe(0);
        expect(res.org.length).toBe(0)
      })
      .catch(err => fail(err));
  });

  it('should parse an empty pending to nested object', () => {
    Joiner.test = true;
    spyOn(sql.test.membership, 'repPendingUsers').and.returnValue(Promise.resolve(
      [
        {
          oid: 1,
          org_name: 'org1',
        },
        {
          bid: 1,
          biz_name: 'biz1',
        }
      ]));
    Joiner.select(10)
      .then(res => {
        // console.log(JSON.stringify(res,null, 2));
        expect(sql.test.membership.repPendingUsers).toHaveBeenCalledWith({pid:10});
        expect(res.biz).toBeDefined();
        expect(res.org).toBeDefined();
        expect(res.biz.length).toBe(1);
        expect(res.org.length).toBe(1)
      })
      .catch(err => fail(err));
  });

  it('should error on null oid', () => {
    Joiner.test = true;
    spyOn(sql.test.membership, 'repPendingUsers').and.returnValue(Promise.resolve(
      [
        {
          oid: null,
          org_name: 'org1',
        },
        {
          bid: 1,
          biz_name: 'biz1',
        }
      ]));
    Joiner.select(10)
      .then(res => {
        fail('it did not error on null oid')
      })
      .catch(err => {
        expect(err).toBeTruthy();
        expect(err.status).toBe(500);
      });
  });

  it('should parse db rows into nested object', () => {
    Joiner.test = true;
    spyOn(sql.test.membership, 'repPendingUsers').and.returnValue(Promise.resolve(
      [
        {
          oid: 1,
          org_name: 'org1',
          org_a_firstname: 'amin',
        },
        {
          oid: 1,
          org_name: 'org1',
          org_a_firstname: 'ali',
        },
        {
          oid: 1,
          org_name: 'org1',
          org_a_firstname: 'hasan',
        },
        {
          oid: 1,
          org_name: 'org1',
          org_a_firstname: 'mahmood',
          org_a_lastname: 'ahmadi',
        },
        {
          oid: 2,
          org_name: 'org2',
          org_a_firstname: 'hasan',
          org_a_lastname: null,
        },
        {
          oid: 2,
          org_name: 'org2',
          org_a_firstname: 'mahmood',
          org_a_lastname: 'ahmadi',
        },
        {
          bid: 1,
          biz_name: 'biz1',
          biz_a_firstname: 'amin',
        },
        {
          bid: 1,
          biz_name: 'biz1',
          biz_a_firstname: 'ali',
        },
      ]));
    Joiner.select(10)
      .then(res => {
        // console.log(JSON.stringify(res,null, 2));
        expect(sql.test.membership.repPendingUsers).toHaveBeenCalledWith({pid:10});
        expect(res.biz).toBeDefined();
        if(res.biz) {
          expect(res.biz.length).toBe(1);
          if(res.biz[0]) {
            expect(res.biz[0].name).toBe('biz1');
            expect(res.biz[0].pending.length).toBe(2);
            if(res.biz[0].pending[0]){
              expect(res.biz[0].pending[0].firstname).toBe('amin');
            }
            if(res.biz[0].pending[1]){
              expect(res.biz[0].pending[1].firstname).toBe('ali');
            }
          }
        }
        expect(res.org).toBeDefined();
        if(res.org) {
          expect(res.org.length).toBe(2);
          if(res.org[0]) {
            expect(res.org[0].name).toBe('org1');
            expect(res.org[0].pending.length).toBe(4);
            if(res.org[0].pending[3]) {
              expect(res.org[0].pending[3].firstname).toBe('mahmood');
              expect(res.org[0].pending[3].lastname).toBe('ahmadi');
            }
          }
          if(res.org[1]) {
            expect(res.org[1].name).toBe('org2');
            expect(res.org[1].pending.length).toBe(2);
            if(res.org[1].pending[0]) {
              expect(res.org[1].pending[0].firstname).toBe('hasan');
              expect(res.org[1].pending[0].lastname).toBeUndefined();
            }
          }
        }
      })
      .catch(err => fail(err));
  })

});