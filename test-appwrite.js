#!/usr/bin/env node
/**
 * Direct test of Appwrite API key and project configuration
 */

const endpoint = 'https://fra.cloud.appwrite.io/v1';
const projectId = '69c2395300216ec78422';
const apiKey = 'standard_708ee37bfea37d40aa20c33592fed974ec6485e62519c5e92aa145467ec3bd2886072eced83b78e257352e5e5172f548eae7bd6396fa540f20bc6c456d3006c20bc5da0b5ca3fd0bbd8dfdf3821230155b9b2562cf2ec659ff5ad0c3b5124df21e3ed5b1929d8b23ea08eb64b3ab93e609a571d2675d67a5d8ecbe51a9692685';

console.log('=== Appwrite API Key Test ===');
console.log('Endpoint:', endpoint);
console.log('Project ID:', projectId);
console.log('API Key:', apiKey.substring(0, 30) + '...');
console.log('');

async function testConnection() {
  try {
    console.log('1️⃣  Testing basic connectivity to Appwrite endpoint...');
    const healthRes = await fetch(`${endpoint}/health`);
    const healthData = await healthRes.json();
    console.log('✓ Appwrite endpoint is reachable');
    console.log('  Response:', JSON.stringify(healthData, null, 2));
  } catch (error) {
    console.error('✗ Failed to reach Appwrite endpoint:', error.message);
    return;
  }

  try {
    console.log('\n2️⃣  Testing API key by listing users...');
    const usersRes = await fetch(`${endpoint}/users`, {
      headers: {
        'X-Appwrite-Project': projectId,
        'X-Appwrite-Key': apiKey,
      },
    });

    console.log('Response status:', usersRes.status);

    if (!usersRes.ok) {
      const errorData = await usersRes.json();
      console.error('✗ API key test failed');
      console.error('  Error:', errorData);

      if (usersRes.status === 404) {
        console.error('  ⚠️  404 - Project not found or API key invalid');
      } else if (usersRes.status === 401) {
        console.error('  ⚠️  401 - Authentication failed (invalid API key)');
      } else if (usersRes.status === 403) {
        console.error('  ⚠️  403 - Forbidden (API key may not have users.read scope)');
      }
      return;
    }

    const usersData = await usersRes.json();
    console.log('✓ API key is valid');
    console.log('  Users in project:', usersData.total);
    console.log('✅ All tests passed!');
  } catch (error) {
    console.error('✗ Error during API test:', error.message);
  }
}

testConnection().catch(console.error);
