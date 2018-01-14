const externalData = require('./lib/externalData.model');

let exData = new externalData();

//Should declared the excel file path
exData.readSpreadSheet('c://users//ali71//desktop//t.xlsx');