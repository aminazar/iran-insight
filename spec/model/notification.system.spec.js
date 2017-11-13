const notificationSystem = require('../../lib/notification.system');
const redis = require('../../redis');
const sql = require('../../sql');

let ns;
describe("Notification System", () => {
  beforeAll(function (done) {
    notificationSystem.setup(true)
      .then(() => {
        ns = notificationSystem.get();
        return redis.redis_client().keysAsync(`${ns.pattern}*`);
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
    let o = ns.getObservable(10).subscribe(
      d => {
        expect(d.x).toBe(1);
        expect(d.y.z).toBe(2);
        ns.deleteNotification(10, d.order)
          .then(()=>{
            o.unsubscribe();
            done();
          })

      }, err => console.log(err));

    ns.pushNotification({x: 1, y: {z: 2}}, {pid: 10});
  });

  it('should reuse the channel', function (done) {
    let o = ns.getObservable(10).subscribe(
      d => {
        expect(d.x).toBe(2);
        expect(d.y.z).toBe(3);
        ns.deleteNotification(10, d.order)
          .then(()=>{
            o.unsubscribe();
            done();
          })
      }, err => console.log(err));

    ns.pushNotification({x: 2, y: {z: 3}}, {pid: 10});
  });

  it('should queue messages for fetching', function (done) {
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
      })
      .then(() => ns.deleteNotification(10))
      .then(done)
      .catch(err => console.log(err));
  });

  it('should keep message even after publishing it', function (done) {
    let o = ns.getObservable(10).subscribe( d => {
      expect(d.x).toBeLessThan(6);
      if (d.x === 5) {
        o.unsubscribe();
      }
    });

    let i = 0;
    let s = setInterval(() => {
      ns.pushNotification({x: i++}, {pid: 10});
      if (i >= 10)
        clearInterval(s);
    }, 10);

    setTimeout(() => ns.fetchNotifications(10)
      .then(res => {
        expect(res.length).toBe(10);
        if (res[10]) {
          expect(res[4].x).toBe(6);
        }
      })
      .then(() => ns.deleteNotification(10))
      .then(done)
      , 1000);
  });

  it('should work with both queue and live subscription', function (done) {
    let o = ns.getObservable(10).subscribe( d => {
      expect(d.x).toBeLessThan(11);
      if (d.x === 10) {
        o.unsubscribe();
        ns.deleteNotification(10);
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
      })
      .then(() => ns.deleteNotification(10)), 2000);

    setTimeout(() => ns.fetchNotifications(10)
      .then(res => {
        expect(res.length).toBe(0);
        done();
      }), 3000);
  });

  it('should work with multiple channels', function (done) {
    let o1 = ns.getObservable(10).subscribe(d => {
        expect(d.data).toBe(11);
        o1.unsubscribe();
      }),
        o2 = ns.getObservable(11).subscribe(d => {
          expect(d.data).toBe(10);
          o2.unsubscribe();
        });

    ns.pushNotification({data: 11}, {pid: 10})
      .then(() => ns.pushNotification({data:10}, {pid: 11}))
      .then(() => ns.deleteNotification(10))
      .then(() => ns.deleteNotification(11))
      .then(done);
  });

  it('should send actionable notification to org rep', function (done) {
    spyOn(sql.test.membership, 'getOrgRep').and.returnValue(Promise.resolve(
      [{pid:12}]));

    let o = ns.getObservable(12).subscribe(d => {
      expect(d.isActionable).toBe(true);
      expect(d.data).toBe('xyz');
      expect(sql.test.membership.getOrgRep).toHaveBeenCalledWith({oid:2});
      o.unsubscribe();
      ns.deleteNotification(12)
        .then(done);
    });

    ns.pushNotification({data:'xyz'}, {oid:2})
      .then(() => {
        console.log('Message for org is pushed');
      })
  });

  it('should send actionable notification to biz rep', function (done) {
    spyOn(sql.test.membership, 'getBizRep').and.returnValue(Promise.resolve(
      [{pid:12}]));

    let o = ns.getObservable(12).subscribe(d => {
      expect(d.isActionable).toBe(true);
      expect(d.data).toBe('xyz');
      expect(sql.test.membership.getBizRep).toHaveBeenCalledWith({bid:2});
      o.unsubscribe();
      ns.deleteNotification(12)
        .then(done);
    });

    ns.pushNotification({data:'xyz'}, {bid:2})
      .then(() => {
        console.log('Message for biz is pushed');
      })
  });

  it('should send non-actionable notification to org followers', function (done) {
    spyOn(sql.test.subscription, 'getOrgSubscribers').and.returnValue(Promise.resolve(
      [{pid:12},{pid:15}]));

    let o = ns.getObservable(15).subscribe(d => {
      expect(d.isActionable).toBe(undefined);
      expect(d.data).toBe('xyz');
      expect(sql.test.subscription.getOrgSubscribers).toHaveBeenCalledWith({oid:2});
      o.unsubscribe();
      ns.deleteNotification(15)
        .then(done);
    });

    ns.pushNotification({data:'xyz', from: {oid:2}})
      .then(() => {
        console.log('Message for org is pushed');
      })
  });

  it('should send actionable notification to biz rep', function (done) {
    spyOn(sql.test.subscription, 'getBizSubscribers').and.returnValue(Promise.resolve(
      [{pid:12},{pid:15}]));

    let o = ns.getObservable(15).subscribe(d => {
      expect(d.isActionable).toBe(undefined);
      expect(d.data).toBe('xyz');
      expect(sql.test.subscription.getBizSubscribers).toHaveBeenCalledWith({bid:2});
      o.unsubscribe();
      ns.deleteNotification(15)
        .then(done);
    });

    ns.pushNotification({data:'xyz', from:{bid:2}})
      .then(() => {
        console.log('Message for biz is pushed');
      })
  });

  it('should send actionable notification to biz rep', function (done) {
    spyOn(sql.test.subscription, 'getPersonSubscribers').and.returnValue(Promise.resolve(
      [{pid:12},{pid:15}]));

    let o = ns.getObservable(15).subscribe(d => {
      expect(d.isActionable).toBe(undefined);
      expect(d.data).toBe('xyz');
      expect(sql.test.subscription.getPersonSubscribers).toHaveBeenCalledWith({pid:2});
      o.unsubscribe();
      ns.deleteNotification(15)
        .then(done);
    });

    ns.pushNotification({data:'xyz', from: {pid:2}})
      .then(() => {
        console.log('Message for person is pushed');
      })
  });

});
