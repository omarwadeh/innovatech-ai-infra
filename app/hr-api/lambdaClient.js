// app/hr-api/lambdaClient.js
const https = require('https');

const urlStr = process.env.LAMBDA_ONBOARD_URL;

function invokeOnboardLambda(event) {
  return new Promise((resolve, reject) => {
    if (!urlStr) {
      console.log('[Lambda] LAMBDA_ONBOARD_URL not set, skipping invoke');
      return resolve();
    }

    const url = new URL(urlStr);
    const body = JSON.stringify(event);

    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const json = data ? JSON.parse(data) : {};
            console.log('[Lambda] hr-onboard response:', json);
            resolve(json);
          } catch (err) {
            console.error('[Lambda] Failed to parse response JSON:', err);
            resolve({});
          }
        } else {
          console.error('[Lambda] HTTP error', res.statusCode, data);
          // Voor demo: niet je hele portal om laten vallen
          resolve({});
        }
      });
    });

    req.on('error', (err) => {
      console.error('[Lambda] HTTPS error while calling hr-onboard:', err);
      // Voor demo: gewoon loggen en doorgaan
      resolve({});
    });

    req.write(body);
    req.end();
  });
}

module.exports = { invokeOnboardLambda };
