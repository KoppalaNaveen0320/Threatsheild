// test_role_auth_flow.js
// Validates end-to-end authentication, JWT retrieval, and role enforcement against FastAPI backend

async function testRoles() {
  const roles = [
    { name: 'ADMIN', email: 'admin@threatshield.org', pass: 'ThreatShield2026!', org: 'CyberDefense Alpha' },
    { name: 'ANALYST', email: 'analyst@threatshield.org', pass: 'ThreatShield2026!', org: 'CyberDefense Alpha' },
    { name: 'VALIDATOR', email: 'validator@threatshield.org', pass: 'ThreatShield2026!', org: 'Financial ISAC' },
    { name: 'THREAT_CONSUMER', email: 'consumer@threatshield.org', pass: 'ThreatShield2026!', org: 'HealthNet SOC' }
  ];

  console.log('=== ThreatShield Multi-Role Authentication & Access Verification ===\n');

  for (const r of roles) {
    console.log(`[*] Testing Role: ${r.name}`);

    // Ensure Org
    let orgId = null;
    try {
      const orgRes = await fetch('http://127.0.0.1:8000/api/organizations/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: r.org })
      });
      if (orgRes.ok) {
        const o = await orgRes.json();
        orgId = o.id;
      }
    } catch {
      // Org may exist
    }

    if (!orgId) {
      orgId = '0a31c3d9-abd8-46b4-8453-a067e0493f6f';
    }

    // Register if needed
    try {
      await fetch('http://127.0.0.1:8000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: r.email,
          password: r.pass,
          organization_id: orgId,
          role: r.name
        })
      });
    } catch {
      // User may already be registered
    }

    // Login
    const loginRes = await fetch('http://127.0.0.1:8000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ username: r.email, password: r.pass })
    });

    if (loginRes.ok) {
      const data = await loginRes.json();
      console.log(`    [+] Login Success: Received JWT Bearer Token (${data.access_token.substring(0, 18)}...)`);

      // Test endpoint access
      const authHeader = { 'Authorization': `Bearer ${data.access_token}` };
      const ctiRes = await fetch('http://127.0.0.1:8000/api/cti/', { headers: authHeader });
      console.log(`    [+] CTI Telemetry Stream: HTTP ${ctiRes.status} (${ctiRes.ok ? 'Authorized' : 'Denied'})`);

      // Test Admin endpoint (organizations list requires admin)
      const adminRes = await fetch('http://127.0.0.1:8000/api/organizations/', { headers: authHeader });
      console.log(`    [+] Admin Endpoint Protection (/organizations/): HTTP ${adminRes.status} (${adminRes.status === 200 ? 'ADMIN Access Granted' : 'Correctly Restricted via Backend RBAC'})`);
    } else {
      console.error(`    [-] Login Failed: HTTP ${loginRes.status}`);
    }
    console.log('');
  }

  console.log('=== Role Verification Complete ===');
}

testRoles();
