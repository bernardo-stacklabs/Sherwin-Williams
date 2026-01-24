
const https = require('https');

const supabaseUrl = 'https://kjwlboqqdufrkhcxjppf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtqd2xib3FxZHVmcmtoY3hqcHBmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzMyOTU2OCwiZXhwIjoyMDc4OTA1NTY4fQ.t30eEhmv9uVv-FEDoDKKwrgb6lfj6NUYEnTl47bydsw';

const targetEmail = 'quetsia.s.menegazzo@sherwin.com.br';

function log(msg) {
    console.log(`[DEBUG] ${msg}`);
}

async function runTest() {
    log(`Checking details for: ${targetEmail}`);
    const urlAll = `${supabaseUrl}/rest/v1/users?email=eq.${encodeURIComponent(targetEmail)}&select=id,email,password,created_at`;

    await fetchRequest(urlAll, (data) => {
        log(`Records found: ${data.length}`);
        data.forEach((u, i) => {
            log(`ROW ${i}:`);
            log(`  ID: ${u.id}`);
            log(`  Created: ${u.created_at}`);
            log(`  Password: ${u.password}`);
        });
    });
}

function fetchRequest(url, callback) {
    return new Promise((resolve, reject) => {
        const options = {
            headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json'
            }
        };

        https.get(url, options, (res) => {
            let body = '';
            res.on('data', (chunk) => { body += chunk; });
            res.on('end', () => {
                try {
                    const json = JSON.parse(body);
                    callback(json);
                    resolve();
                } catch (e) {
                    log('Error parsing JSON response');
                    resolve();
                }
            });
        }).on('error', (err) => {
            log('Request Error: ' + err.message);
            resolve();
        });
    });
}

runTest();
