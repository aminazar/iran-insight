var express = require('express');
var router = express.Router();

/* Diverting unknown routes to Angular router */
router.all("*",function(req,res,next){
  /* Redirect http to https */
  if(req.originalUrl.indexOf('api') === -1) {
    console.log('[TRACE] Server 404 request: ' + req.originalUrl);
    var p = path.join(__dirname, '../public', 'index.html').replace(/\/routes\//, '/');
    res.status(200).sendFile(p);
  }
  else
    next();
});

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

module.exports = router;
