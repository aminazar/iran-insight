/**
 * Created by Amin on 05/02/2017.
 */
function parseServerError(err) {
  try {
    let a;
    let dashPlace = err.message.indexOf('- ');
    let statusCode = err.message.substring(0, dashPlace);
    eval(`a=${err.message.substring(dashPlace + 2)}`);
    err = JSON.parse(a);
    err.statusCode = statusCode;
    return err;
  } catch(e) {
    console.log(e);
    return err;
  }
}
function parseServerErrorToString(err) {
  try {
    let err = parseServerError(err);
    return `\nStatus: ${err.statusCode}\nMessage: ${err.Message}\nServer stack:\n${err.Stack}`;
  } catch (e) {
    return err;
  }
}

function apiTestURL(api) {
  return ["http://localhost:3000/api/", api, '?test=tEsT'].join('');
}

module.exports = {
  isTestReq: function(req){return req.query.test==='tEsT'},
  adminCheck: function(username){return username==='admin'},
  parseServerError: parseServerError,
  parseServerErrorToString: parseServerErrorToString,
  apiTestURL: apiTestURL,
};