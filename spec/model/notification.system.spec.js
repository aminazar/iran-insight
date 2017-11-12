const notificationSystem = require('../../lib/notification.system');
const redis = require('../../redis');

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

    ns.pushNotification(10, {x: 1, y: {z: 2}});
  });

  it('should reuse the channel', function (done) {
    ns.subscribe(10,
      d => {
        expect(d.x).toBe(2);
        expect(d.y.z).toBe(3);
        ns.deleteChannel(10);
        done()
      }, err => console.log(err));

    ns.pushNotification(10, {x: 2, y: {z: 3}});
  });

  it('should queue messages for fetching', function (done) {
    ns.deleteChannel(10);
    let range = [];
    for (let i = 0; i < 100; i++)
      range.push(i);
    range.map(i => () => ns.pushNotification(10, {x: i})).reduce((x, y) => x.then(y), Promise.resolve())
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
      ns.pushNotification(10, {x: i++});
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
    ns.pushNotification(10, {})
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
    ns.pushNotification(10, {data: 11})
      .then(() => ns.pushNotification(11,{data:10}))
      .then(() => {
        setTimeout(() => {
          ns.deleteChannel(10);
          ns.deleteChannel(11);
          done();
        })
      });
  })
})
;