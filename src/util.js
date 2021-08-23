const { csv } = require('csvtojson/v2');

exports.delay = (timeout) => new Promise((resolve) => setTimeout(() => resolve(), timeout));

exports.csvToJson = async function csvToJson(csvStream) {
  return csv().fromStream(csvStream);
};
