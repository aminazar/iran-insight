/**
 * Created by user on 8/13/2017.
 */
const jmoment = require('jalali-moment');
const moment = require('moment');


getTimeNow =()=>{

  return moment().format('HH-mm-ss');

};

getGregorianNow = () => {

    return moment().utc().format();
};


getJalaliNow = () => {
    let gNow = jmoment();
    return jmoment(gNow.format('YYYY-MM-DD'), 'YYYY-MM-DD').format('jYYYY-jMM-jDD');
};



convertGregorianToJalali = (gregorian) => {
    try {
        return jmoment(gregorian).format('jYYYY/jMM/jDD');
    }
    catch (err) {
        return '';

    }
};


convertJalaliToUTCGregorian = (jalali) => {

    return jmoment(jalali, 'jYYYY-jMM-jDD').format('YYYY-MM-DD');
};

module.exports = {
    getTimeNow,
    getGregorianNow,
    getJalaliNow,
    convertGregorianToJalali,
    convertJalaliToUTCGregorian

};