const notificationSystem = require('../../lib/notification.system');
const redis = require('../../redis');
const sql = require('../../sql');

let ns;
describe("Notification System", () => {
  beforeAll(function (done) {
    notificationSystem.setup(true)
      .then(() => {
        ns = notificationSystem.get();
        return redis.redis_client().keysAsync(`${ns.pattern}:*`);
      })
      .then(keys => {
        return Promise.all(keys.map(k => redis.redis_client().delAsync(k)));
      })
      .then(() => {
        done()
      })
      .catch(err => {
        console.log('Setup failure: ', err);
      })
  });

  it('should publish/subscribe a notification', function (done) {
    ns.subscribe(10,
      d => {
        expect(d.x).toBe(1);
        expect(d.y.z).toBe(2);
        ns.deleteChannel(10);
        done();
      }, err => console.log(err));

    ns.pushNotification({x: 1, y: {z: 2}}, {pid: 10});
  });

  it('should reuse the channel', function (done) {
    ns.subscribe(10,
      d => {
        expect(d.x).toBe(2);
        expect(d.y.z).toBe(3);
        ns.deleteChannel(10);
        done()
      }, err => console.log(err));

    ns.pushNotification({x: 2, y: {z: 3}}, {pid: 10});
  });

  it('should queue messages for fetching', function (done) {
    ns.deleteChannel(10);
    let range = [];
    for (let i = 0; i < 100; i++)
      range.push(i);
    range.map(i => {return () => ns.pushNotification({x: i}, {pid: 10})}).reduce((x, y) => x.then(y), Promise.resolve())
      .then(() => ns.fetchNotifications(10))
      .then(res => {
        expect(res.length).toBe(100);
        if (res[10]) {
          expect(res[10].x).toBe(89)
        }
        done();
      })
      .catch(err => console.log(err));
  });

  it('should work with both queue and live subscription', function (done) {
    ns.subscribe(10, d => {
      expect(d.x).toBeLessThan(11);
      if (d.x === 10) {
        ns.deleteChannel(10);
      }
    });

    let i = 0;
    let s = setInterval(() => {
      ns.pushNotification({x: i++}, {pid: 10});
      if (i > 100)
        clearInterval(s);
    }, 10);


    setTimeout(() => ns.fetchNotifications(10)
      .then(res => {
        expect(res.length).toBe(90);
        if (res[10]) {
          expect(res[10].x).toBe(90);
        }
      }), 2000);

    setTimeout(() => ns.fetchNotifications(10)
      .then(res => {
        expect(res.length).toBe(0);
        done();
      }), 3000);
  });

  it('should unsubscribe all subscribtions after deleting channel', function (done) {
    ns.subscribe(10, d => fail('it did not unsubscribe'));
    ns.subscribe(10, d => fail('it did not unsubscribe this one too!'));

    ns.deleteChannel(10);
    ns.pushNotification({}, {pid: 10})
      .then(()=> ns.fetchNotifications(10))
      .then(res => {
        expect(res.length).toBe(1);
        expect(res[0]).toBeTruthy();
        expect(res[0].order).toBeTruthy();
        expect(res[0].timestamp).toBeTruthy();
        setTimeout(done, 100);
      })
  });

  it('should work with multiple channels', function (done) {
    ns.subscribe(10, d => expect(d.data).toBe(11));
    ns.subscribe(11, d => expect(d.data).toBe(10));
    ns.pushNotification({data: 11}, {pid: 10})
      .then(() => ns.pushNotification({data:10}, {pid: 11}))
      .then(() => {
        setTimeout(() => {
          ns.deleteChannel(10);
          ns.deleteChannel(11);
          done();
        })
      });
  });

  it('should send actionable notification to org rep', function (done) {
    spyOn(sql.test.membership, 'getOrgRep').and.returnValue(Promise.resolve(
      [{pid:12}]));

    ns.subscribe(12, d => {
      expect(d.isActionable).toBe(true);
      expect(d.data).toBe('xyz');
      expect(sql.test.membership.getOrgRep).toHaveBeenCalledWith({oid:2});
      ns.deleteChannel(12);
      done()
    });

    ns.pushNotification({data:'xyz'}, {oid:2})
      .then(() => {
        console.log('Message for org is pushed');
      })
  });

  it('should send actionable notification to biz rep', function (done) {
    spyOn(sql.test.membership, 'getBizRep').and.returnValue(Promise.resolve(
      [{pid:12}]));

    ns.subscribe(12, d => {
      expect(d.isActionable).toBe(true);
      expect(d.data).toBe('xyz');
      expect(sql.test.membership.getBizRep).toHaveBeenCalledWith({bid:2});
      ns.deleteChannel(12);
      done()
    });

    ns.pushNotification({data:'xyz'}, {bid:2})
      .then(() => {
        console.log('Message for biz is pushed');
      })
  });

  it('should send non-actionable notification to org followers', function (done) {
    spyOn(sql.test.subscription, 'getOrgSubscribers').and.returnValue(Promise.resolve(
      [{pid:12},{pid:15}]));

    ns.subscribe(15, d => {
      expect(d.isActionable).toBe(undefined);
      expect(d.data).toBe('xyz');
      expect(sql.test.subscription.getOrgSubscribers).toHaveBeenCalledWith({oid:2});
      ns.deleteChannel(15);
      done()
    });

    ns.pushNotification({data:'xyz', from: {oid:2}})
      .then(() => {
        console.log('Message for org is pushed');
      })
  });

  it('should send actionable notification to biz rep', function (done) {
    spyOn(sql.test.subscription, 'getBizSubscribers').and.returnValue(Promise.resolve(
      [{pid:12},{pid:15}]));

    ns.subscribe(15, d => {
      expect(d.isActionable).toBe(undefined);
      expect(d.data).toBe('xyz');
      expect(sql.test.subscription.getBizSubscribers).toHaveBeenCalledWith({bid:2});
      ns.deleteChannel(15);
      done()
    });

    ns.pushNotification({data:'xyz', from:{bid:2}})
      .then(() => {
        console.log('Message for biz is pushed');
      })
  });

  it('should send actionable notification to biz rep', function (done) {
    spyOn(sql.test.subscription, 'getPersonSubscribers').and.returnValue(Promise.resolve(
      [{pid:12},{pid:15}]));

    ns.subscribe(15, d => {
      expect(d.isActionable).toBe(undefined);
      expect(d.data).toBe('xyz');
      expect(sql.test.subscription.getPersonSubscribers).toHaveBeenCalledWith({pid:2});
      ns.deleteChannel(15);
      done()
    });

    ns.pushNotification({data:'xyz', from: {pid:2}})
      .then(() => {
        console.log('Message for person is pushed');
      })
  });

});
