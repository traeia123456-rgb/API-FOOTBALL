/**
 * Test script to verify both RapidAPI services are working correctly
 * Run with: node test-apis.js
 */

require('dotenv').config({ path: '.env.local' });

// Test API Football
async function testAPIFootball() {
  console.log('\n🏈 Testing API Football (Teams/Countries)...');
  console.log('Base URL:', process.env.RAPIDAPI_FOOTBALL_BASE_URL);
  console.log('Host:', process.env.RAPIDAPI_FOOTBALL_HOST);
  console.log('API Key:', process.env.RAPIDAPI_FOOTBALL_API_KEY ? '✓ Set' : '✗ Missing');
  
  try {
    const response = await fetch(`${process.env.RAPIDAPI_FOOTBALL_BASE_URL}/teams/countries`, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': process.env.RAPIDAPI_FOOTBALL_API_KEY,
        'x-rapidapi-host': process.env.RAPIDAPI_FOOTBALL_HOST
      }
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ API Football is working!');
      console.log(`   Found ${data.results || 0} countries`);
      if (data.response && data.response.length > 0) {
        console.log(`   Sample: ${data.response.slice(0, 3).map(c => c.name).join(', ')}...`);
      }
    } else {
      console.log('❌ API Football failed:', response.status, response.statusText);
      console.log('   Response:', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.log('❌ API Football error:', error.message);
  }
}

// Test BetsAPI
async function testBetsAPI() {
  console.log('\n🎲 Testing BetsAPI (In-Play Filter)...');
  console.log('Base URL:', process.env.RAPIDAPI_BETS_BASE_URL);
  console.log('Host:', process.env.RAPIDAPI_BETS_HOST);
  console.log('API Key:', process.env.RAPIDAPI_BETS_API_KEY ? '✓ Set' : '✗ Missing');
  
  try {
    const response = await fetch(`${process.env.RAPIDAPI_BETS_BASE_URL}/bet365/inplay_filter?sport_id=1`, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': process.env.RAPIDAPI_BETS_API_KEY,
        'x-rapidapi-host': process.env.RAPIDAPI_BETS_HOST
      }
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ BetsAPI is working!');
      console.log('   Response:', JSON.stringify(data, null, 2).substring(0, 200) + '...');
    } else {
      console.log('❌ BetsAPI failed:', response.status, response.statusText);
      console.log('   Response:', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.log('❌ BetsAPI error:', error.message);
  }
}

// Test Supabase connection
async function testSupabase() {
  console.log('\n🗄️  Testing Supabase Connection...');
  console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log('Anon Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✓ Set' : '✗ Missing');
  
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`, {
      headers: {
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
      }
    });

    if (response.ok || response.status === 404) {
      console.log('✅ Supabase connection is working!');
      console.log('   Status:', response.status, response.statusText);
    } else {
      console.log('❌ Supabase connection failed:', response.status, response.statusText);
    }
  } catch (error) {
    console.log('❌ Supabase error:', error.message);
  }
}

// Run all tests
async function runTests() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  API Configuration Test Suite');
  console.log('═══════════════════════════════════════════════════');
  
  await testAPIFootball();
  await testBetsAPI();
  await testSupabase();
  
  console.log('\n═══════════════════════════════════════════════════');
  console.log('  Test Complete');
  console.log('═══════════════════════════════════════════════════\n');
}

runTests();
