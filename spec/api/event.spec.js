const rp = require("request-promise");
const lib = require('../../lib');
const sql = require('../../sql');
let req = rp.defaults({jar: true});//enabling cookies

function apiURL(api) {
  return ["http://localhost:3000/api/", api, '?test=tEsT'].join('');
}

function parseServerError(err) {
  try {
    let a;
    let dashPlace   = err.message.indexOf('- ');
    let statusCode  = err.message.substring(0,dashPlace);
    eval(`a=${err.message.substring(dashPlace + 2)}`);
    err = JSON.parse(a);
    return `\nStatus: ${statusCode}\nMessage: ${err.Message}\nServer stack:\n${err.Stack}`;
  } catch(e) {
    return err;
  }
}

function drop() {
  return sql.test.event.drop()
    .then(sql.test.organization.drop)
    .then(sql.test.business.drop)
    .then(sql.test.person.drop);
}

describe('Event APIs', () => {
  let eid=0, pid=0, eventData = {title:'test event', title_fa:'همایش تست', start_date: '20171010'};
  beforeEach( function(done) {
      drop()
      .then(sql.test.person.create)
      .then(sql.test.business.create)
      .then(sql.test.organization.create)
      .then(sql.test.event.create)
      .then(() => {
        u = new lib.User(true);
        return u.saveData({username:'amin',password:'123456'})
      })
      .then(res => {
        pid = res;
        eventData.organizer_pid = pid;
        return sql.test.event.add(eventData);
      })
      .then(res => {
        eid = res.eid;
        done();
      })
      .catch(err => {
        console.error('Setup failure:', err);
        done();
      });
  });

  it('has an event API loading a single event with EID', function(done) {
    rp({
      method:                   'GET',
      uri:                      apiURL(`event/${eid}`),
      resolveWithFullResponse:  true,
    })
      .then(res => {
        expect(res.statusCode).toBe(200);
        let body = JSON.parse(res.body);
        expect(body.eid).toBe(eid);
        expect(body.organizer_pid).toBe(pid);
        expect(body.organizer_bid).toBeUndefined();
        expect(body.organizer_oid).toBeUndefined();
        expect(body.title).toBe(eventData.title);
        expect(body.title_fa).toBe(eventData.title_fa);
        expect(body.start_date).toBe(eventData.start_date);
        done();
      })
      .catch(err => {
        this.fail(parseServerError(err));
        done();
      })
  });
});