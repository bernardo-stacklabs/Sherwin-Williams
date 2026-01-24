
const https = require('https');

const supabaseUrl = 'https://kjwlboqqdufrkhcxjppf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtqd2xib3FxZHVmcmtoY3hqcHBmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzMyOTU2OCwiZXhwIjoyMDc4OTA1NTY4fQ.t30eEhmv9uVv-FEDoDKKwrgb6lfj6NUYEnTl47bydsw';

const targetEmail = 'quetsia.s.menegazzo@sherwin.com.br';

function log(msg) {
    console.log(`[FIX] ${msg}`);
}

async function runFix() {
    log(`Checking for duplicates to fix for: ${targetEmail}`);
    const urlAll = `${supabaseUrl}/rest/v1/users?email=eq.${encodeURIComponent(targetEmail)}&select=id,created_at&order=created_at.desc`;

    await fetchRequest(urlAll, 'GET', null, async (data) => {
        log(`Records found: ${data.length}`);

        if (data.length > 1) {
            // Keep the LAST one (oldest) - data is sorted DESC
            const toKeep = data[data.length - 1];

            // Delete all others (newer ones)
            for (let i = 0; i < data.length - 1; i++) {
                const toDelete = data[i];
                log(`Deleting duplicate ID: ${toDelete.id} (Created: ${toDelete.created_at})`);
                await deleteUser(toDelete.id);
            }
            log(`kept original ID: ${toKeep.id} (Created: ${toKeep.created_at})`);
        } else {
            log('No duplicates found. Nothing to do.');
        }
    });
}

function deleteUser(id) {
    return new Promise((resolve) => {
        const url = `${supabaseUrl}/rest/v1/users?id=eq.${id}`;
        fetchRequest(url, 'DELETE', null, () => {
            log(`Successfully deleted ID: ${id}`);
            resolve();
        });
    });
}

function fetchRequest(url, method, body, callback) {
    return new Promise((resolve, reject) => {
        const options = {
            method: method,
            headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json'
            }
        };

        const req = https.request(url, options, (res) => {
            let responseBody = '';
            res.on('data', (chunk) => { responseBody += chunk; });
            res.on('end', () => {
                if (method === 'DELETE') {
                    callback(null);
                } else {
                    try {
                        const json = JSON.parse(responseBody);
                        callback(json);
                    } catch (e) {
                        log('Error parsing JSON');
                        resolve();
                    }
                }
                resolve();
            });
        });

        req.on('error', (err) => {
            log('Request Error: ' + err.message);
            resolve();
        });

        req.end();
    });
}

runFix();
