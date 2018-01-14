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
}

module.exports = SpreadSheet;