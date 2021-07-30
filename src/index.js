const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const qs = require('qs');
const { arr } = require('../config/data');
const { delay } = require('./util');
const { PERFIX, COOKIE, URL_PERFIX } = require('../config');

// Get ID
async function requestID(keyword) {
  const {
    data: {
      list: [item]
    }
  } = await axios.post(`${URL_PERFIX}/merchantsearch.json`, qs.stringify({ merchantName: keyword }), {
    withCredentials: true,
    headers: {
      Cookie: COOKIE,
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });

  console.log(` 🚀开始处理${item.merchant_name} ${item.merchant_id}`);
  return item.merchant_id;
}

// Get data
async function request(id) {
  const {
    data: { data }
  } = await axios.get(`${URL_PERFIX}/getEditMerchantInfo.json?merchantId=${id}`, {
    withCredentials: true,
    headers: {
      Cookie: COOKIE
    }
  });
  console.log(`${data.merchantName} 处理完成✨`);
  return data;
}

// Download File
async function downloadFile(url, filepath, name) {
  if (!fs.existsSync(filepath)) {
    fs.mkdirSync(filepath);
  }
  const mypath = path.resolve(filepath, name);
  const writer = fs.createWriteStream(mypath);
  const response = await axios.get(url, {
    responseType: 'stream'
  });
  response.data.pipe(writer);
  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
}

// Handle Data
async function handle(name) {
  await requestID(name).then(async (id) => {
    await request(id).then(({ merchantName = '', licenceList: [medic, need] }) => {
      const { licenceImageUrl: yaopin } = medic;
      const { licenceImageUrl: jingying, licenceNo } = need;
      // eslint-disable-next-line camelcase
      const str = `${merchantName} ---- ${licenceNo}\n`;
      fs.appendFileSync('./code.txt', str);

      downloadFile(`${PERFIX}${yaopin}`, `./data/${merchantName}`, `${merchantName}药品经营许可证.jpg`);
      downloadFile(`${PERFIX}${jingying}`, `./data/${merchantName}`, `${merchantName}营业执照.jpg`);
    });
  });
}

// main
async function main() {
  for (let i = 0; i < arr.length; i += 1) {
    handle(arr[i]);
    delay(2000);
  }
}

main();
