const http = require('http');
const os = require('os');

const PORT = 8081;
const CLOUD_URL = 'https://identixpay.onrender.com';

// Detect local LAN IPv4 address (e.g., 192.168.1.13)
function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return '127.0.0.1';
}

const localIP = getLocalIP();

const server = http.createServer(async (req, res) => {
    const timestamp = new Date().toLocaleTimeString();
    const url = req.url;
    const method = req.method;

    // Buffer incoming body from biometric terminal
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    
    req.on('end', async () => {
        const bodyBuffer = Buffer.concat(chunks);
        const bodyText = bodyBuffer.toString('utf8');

        console.log(`\n[${timestamp}] 📡 [INCOMING] ${method} ${url} (from ${req.socket.remoteAddress})`);

        // If punch payload is present, print it clearly
        if (bodyText && bodyText.includes('\t')) {
            console.log(`⚡ [LIVE PUNCH DETECTED]:`);
            const lines = bodyText.trim().split('\n');
            lines.forEach(l => console.log(`   👉 PIN/DATA: ${l.trim()}`));
        }

        try {
            // Normalize .aspx endpoints (some ZKTeco firmware appends .aspx)
            const normalizedUrl = url.replace('/iclock/cdata.aspx', '/iclock/cdata')
                                     .replace('/iclock/getrequest.aspx', '/iclock/getrequest');

            // Forward directly to Render Cloud Backend
            const targetUrl = `${CLOUD_URL}${normalizedUrl}`;
            const forwardOptions = {
                method: method,
                headers: {
                    'Content-Type': req.headers['content-type'] || 'text/plain',
                    'User-Agent': req.headers['user-agent'] || 'IdentixBridge/1.0',
                    'X-Forwarded-For': req.socket.remoteAddress
                }
            };

            if (method !== 'GET' && method !== 'HEAD' && bodyBuffer.length > 0) {
                forwardOptions.body = bodyBuffer;
            }

            // Set timeout of 4 seconds so biometric terminal never hangs
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 4000);
            forwardOptions.signal = controller.signal;

            const cloudRes = await fetch(targetUrl, forwardOptions);
            clearTimeout(timeoutId);

            const cloudResponseText = await cloudRes.text();
            console.log(`☁️  [CLOUD SYNC]: Status ${cloudRes.status} | Response: "${cloudResponseText.trim()}"`);

            res.writeHead(cloudRes.status, {
                'Content-Type': 'text/plain',
                'Connection': 'close'
            });
            res.end(cloudResponseText);

        } catch (err) {
            console.error(`⚠️  [CLOUD FORWARD FAILED / TIMEOUT]: ${err.message}`);
            // Fallback response so physical machine doesn't show ❌ cross
            if (url.includes('/iclock/cdata') && method === 'GET') {
                const snMatch = url.match(/SN=([^&]+)/);
                const sn = snMatch ? snMatch[1] : 'CGKK222862350';
                const defaultHandshake = `GET OPTION FROM: ${sn}\nStamp=9999\nOpStamp=9999\nPhotoStamp=0\nErrorDelay=60\nDelay=30\nTransTimes=00:00;14:00\nTransInterval=1\nTransFlag=1111111111\nTimeZone=330\nRealtime=1\nEncrypt=0\n`;
                res.writeHead(200, { 'Content-Type': 'text/plain' });
                res.end(defaultHandshake);
            } else if (method === 'POST') {
                // If it was a punch push, respond OK: 1 so terminal clears buffer
                res.writeHead(200, { 'Content-Type': 'text/plain' });
                res.end('OK: 1');
            } else {
                res.writeHead(200, { 'Content-Type': 'text/plain' });
                res.end('OK');
            }
        }
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log('================================================================');
    console.log('       🚀 IDENTIX HARDWARE LOCAL-TO-CLOUD BRIDGE ACTIVE       ');
    console.log('================================================================');
    console.log(` 📍 Local IP Address   : ${localIP}`);
    console.log(` 🔌 Bridge Port        : ${PORT}`);
    console.log(` ☁️  Cloud Backend URL  : ${CLOUD_URL}`);
    console.log('----------------------------------------------------------------');
    console.log(' ⚙️  HARDWARE MACHINE SETTINGS (Screen par ye bharein):');
    console.log('----------------------------------------------------------------');
    console.log('   Menu -> Comm. -> Cloud Server Setting:');
    console.log('   1. Server Mode        : ADMS');
    console.log('   2. Enable Domain Name : OFF  <-- (OFF rakhna hai)');
    console.log(`   3. Server Address     : ${localIP}`);
    console.log(`   4. Server Port        : ${PORT}`);
    console.log('   5. Enable Proxy Server: OFF');
    console.log('================================================================');
    console.log(' Listening for biometric connection and live punches...\n');
});
