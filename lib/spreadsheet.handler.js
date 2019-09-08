const xlsx = require('xlsx');

class SpreadSheet {
  constructor() {}

  readFile(path, options) {
    this.workbook = xlsx.readFile(path, options);
  }

  getWorksheet(index) {
    this.worksheet = this.workbook.Sheets[this.workbook.SheetNames[index]];
  }

  getWorkSheetCount() {
    return this.workbook.SheetNames.length;
  }

  parseWorksheet(options) {
    this.loadedValue = xlsx.utils.sheet_to_json(this.worksheet, options);
  }

  getWorksheetName(index) {
    return this.workbook.SheetNames[index];
  }

  putToWorksheet(data) {
    let ws = xlsx.utils.json_to_sheet(data);
    this.workbook = { SheetNames:[], Sheets:{} };
    this.workbook.SheetNames.push('All Business Data');
    this.workbook.Sheets['All Business Data'] = ws;
  }

  writeFile(fileName, options){
    return xlsx.writeFile(this.workbook, fileName, options);
  }
}

module.exports = SpreadSheet;