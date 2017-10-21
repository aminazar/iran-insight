/**
 * Created by Amin on 05/02/2017.
 */
function parseServerError(err) {
  try {
    let a;
    let dashPlace = err.message.indexOf('- ');
    let statusCode = err.message.substring(0, dashPlace);
    eval(`a=${err.message.substring(dashPlace + 2)}`);

    try {
      err = JSON.parse(a);
    } catch(e) {
      if(a) {
        err.Message = a;
      } else {
        throw e;
      }
    }
    err.statusCode = statusCode;
    return err;
  } catch(e) {
    return err;
  }
}
function parseServerErrorToString(err) {
  try {
    err = parseServerError(err);
    return `SERVER ERROR:\nStatus: ${err.statusCode}\nMessage: ${err.Message}${err.Stack ? '\nServer stack:\n' + err.Stack: ''}`;
  } catch (e) {
    return err;
  }
}
function parseJasmineErrorToString(err) {
  return `TEST ERROR:\nMessage: ${err.message}\nStack:${err.stack}`;
}

function apiTestURL(api) {
  return ["http://localhost:3000/api/", api, '?test=tEsT'].join('');
}

function errorHandler(err){
  if(err.response)
    this.fail(parseServerErrorToString(err));
  else
    this.fail(parseJasmineErrorToString(err));
  this.done();
}

module.exports = {
  isTestReq: function(req){return req.query.test==='tEsT'},
  adminCheck: function(username){return username==='admin'},
  parseServerError: parseServerError,
  parseServerErrorToString: parseServerErrorToString,
  parseJasmineErrorToString: parseJasmineErrorToString,
  apiTestURL: apiTestURL,
  errorHandler: errorHandler,
};