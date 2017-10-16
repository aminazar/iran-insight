/**
 * Created by Amin on 05/02/2017.
 */
module.exports = {
  isTestReq: function(req){return req.query.test==='tEsT'},
  adminCheck: function(username){return username==='admin'},
};