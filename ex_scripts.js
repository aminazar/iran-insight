const externalData = require('./lib/externalData.model');
const args = process.argv.slice(2);

let exData = new externalData();

if(args[0].toLowerCase() === 'r' || args[0].toLowerCase() === 'read')
  exData.readSpreadSheet(args[0]);
else if(args[0].toLowerCase() === 'w' || args[0].toLowerCase() === 'write')
  exData.saveToSpreadSheet(args[0]);