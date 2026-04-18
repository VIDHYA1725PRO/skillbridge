const https = require('https');
const urls = [
  'https://skillbridge-hrjin3bn2-vidhyamz23-4355s-projects.vercel.app',
  'https://skillbridge-ten-steel.vercel.app',
];

urls.forEach((url) => {
  https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    res.on('end', () => {
      console.log(url, res.statusCode, data.slice(0, 300).length);
    });
  }).on('error', (e) => {
    console.log(url, 'ERROR', e.message);
  });
});
