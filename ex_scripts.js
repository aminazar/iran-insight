const externalData = require('./lib/externalData.model');
const args = process.argv.slice(2);

let exData = new externalData();

if(args[1].toLowerCase() === 'r' || args[1].toLowerCase() === 'read')
  exData.readSpreadSheet(args[0]);
else if(args[1].toLowerCase() === 'w' || args[1].toLowerCase() === 'write')
  exData.saveToSpreadSheet(args[0]);