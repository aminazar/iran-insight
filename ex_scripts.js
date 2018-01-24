const externalData = require('./lib/externalData.model');
const args = process.argv.slice(2);

let exData = new externalData();
exData.readSpreadSheet(args[0]);
