const request = require("request-promise");
const lib = require('../../lib');
const sql = require('../../sql');
let req = request.defaults({jar: true});//enabling cookies

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
describe('Event APIs', () => {
  it('has an event API loading a single event with EID', function(done) {
    request.get(apiURL('event/1'))
      .then(res => {
        expect(res.status).not.toBe(404);
      })
      .catch(err => {
        this.fail(parseServerError(err));
        done();
      })
  });
});