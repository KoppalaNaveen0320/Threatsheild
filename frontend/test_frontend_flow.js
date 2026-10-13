async function testFrontendAndAPI() {
    console.log('[*] Testing Frontend Dev Server response...');
    const feRes = await fetch('http://localhost:5173/');
    if (feRes.status === 200) {
        console.log('[+] Frontend Vite server is serving HTML correctly (HTTP 200).');
    } else {
        console.error('[-] Frontend failed with status:', feRes.status);
    }

    console.log('[*] Testing API endpoints through client workflow...');
    const orgName = 'ClientOrg_' + Date.now();
    const orgRes = await fetch('http://127.0.0.1:8000/api/organizations/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: orgName })
    });
    const orgData = await orgRes.json();
    console.log('[+] Org registration:', orgRes.status, orgData.name, 'ID:', orgData.id);

    const email = 'clientadmin_' + Date.now() + '@threatshield.io';
    const userRes = await fetch('http://127.0.0.1:8000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: email,
            password: 'password123',
            organization_id: orgData.id,
            role: 'ADMIN'
        })
    });
    const userData = await userRes.json();
    console.log('[+] User registration (ADMIN):', userRes.status, userData.email);

    const loginRes = await fetch('http://127.0.0.1:8000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ username: email, password: 'password123' })
    });
    const loginData = await loginRes.json();
    console.log('[+] User login:', loginRes.status, loginData.access_token ? 'JWT Bearer Received' : 'No Token');

    const token = loginData.access_token;
    const ctiRes = await fetch('http://127.0.0.1:8000/api/cti/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            type: 'ipv4-addr',
            value: '198.51.100.45',
            confidence: 95.0,
            severity: 8.5,
            source: 'Firewall Log Sensor',
            description: 'Observed active C2 server IP communicating with compromised endpoint'
        })
    });
    const ctiData = await ctiRes.json();
    console.log('[+] CTI Submission:', ctiRes.status, 'Record ID:', ctiData.id);

    const getCtiRes = await fetch('http://127.0.0.1:8000/api/cti/', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const listData = await getCtiRes.json();
    console.log('[+] CTI Feed Retrieval:', getCtiRes.status, 'Total Items:', listData.length);

    const ledgerRes = await fetch('http://127.0.0.1:8000/api/ledger/verify', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const ledgerData = await ledgerRes.json();
    console.log('[+] Cryptographic Ledger Verification:', ledgerRes.status, ledgerData.valid ? 'VALID' : 'INVALID');
}

testFrontendAndAPI();
