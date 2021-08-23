const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const qs = require('qs');
const { delay } = require('./util');
const { PERFIX, COOKIE, URL_PERFIX } = require('../config');
const { csvToJson } = require('./util');

// Get ID
async function requestID(keyword) {
  const {
    data: {
      list: [item]
    }
  } = await axios
    .post(`${URL_PERFIX}/merchantsearch.json`, qs.stringify({ merchantName: keyword }), {
      withCredentials: true,
      headers: {
        Cookie: COOKIE,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })
    .catch((e) => console.log(`💊获取 ${keyword} ID错误`));
  console.log(` 🚀获取到 ${item.merchant_name}的ID为 ${item.merchant_id}`);
  return item.merchant_id;
}

// Get data
async function request(id) {
  const {
    data: { data }
  } = await axios
    .get(`${URL_PERFIX}/getEditMerchantInfo.json?merchantId=${id}`, {
      withCredentials: true,
      headers: {
        Cookie: COOKIE
      }
    })
    .catch((e) => console.log(`💊获取数据错误 ${id}`));
  console.log(`✨${data.merchantName} 处理完成`);
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
  await response.data.pipe(writer);
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
  const file = await fs.createReadStream(path.resolve(__dirname, '../resource/data.csv'));
  const jsonArray = await csvToJson(file);
  const arr = jsonArray.map((item) => item.name);
  for (let i = 0; i < arr.length; i += 1) {
    handle(arr[i]);
  }
}

main().catch((e) => console.error(e));
