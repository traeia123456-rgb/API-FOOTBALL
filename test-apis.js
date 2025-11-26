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

// Test Sofascore Port
async function testSofascorePort() {
  console.log('\n⚽ Testing Sofascore Port...');
  
  const SOFASCORE_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Referer': 'https://www.sofascore.com/',
    'Origin': 'https://www.sofascore.com',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache'
  };

  try {
    // 1. Test Seasons
    const tournamentId = 1; 
    console.log(`   Fetching seasons for Tournament ID ${tournamentId}...`);
    const response = await fetch(`https://api.sofascore.com/api/v1/tournament/${tournamentId}/seasons`, {
      headers: SOFASCORE_HEADERS
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Sofascore API (Seasons) is reachable!');
      if (data.seasons && data.seasons.length > 0) {
        console.log(`   Found ${data.seasons.length} seasons. Latest: ${data.seasons[0].year}`);
      }
    } else {
      console.log('❌ Sofascore API (Seasons) failed:', response.status);
    }

    // 2. Test Player Search (Luis Diaz)
    console.log('   Searching for player "Luis Diaz"...');
    const searchResponse = await fetch(`https://api.sofascore.com/api/v1/search/all?q=Luis%20Diaz`, {
      headers: SOFASCORE_HEADERS
    });

    if (searchResponse.ok) {
      const searchData = await searchResponse.json();
      console.log('✅ Sofascore API (Search) is reachable!');
      
      const player = searchData.results.find(r => r.type === 'player' && r.entity.name === 'Luis Díaz');
      if (player) {
        console.log(`   Found player: ${player.entity.name} (ID: ${player.entity.id})`);
        
        // 3. Test Player Statistics
        console.log(`   Fetching statistics for player ${player.entity.id}...`);
        // Note: Statistics often require a specific season/tournament, or "last year" summary.
        // Let's try the main player endpoint first
        const playerResponse = await fetch(`https://api.sofascore.com/api/v1/player/${player.entity.id}`, {
          headers: SOFASCORE_HEADERS
        });
        
        if (playerResponse.ok) {
           const playerData = await playerResponse.json();
           console.log('✅ Sofascore API (Player Details) is reachable!');
           console.log(`   Team: ${playerData.player.team.name}`);
        }
      } else {
        console.log('   Player Luis Díaz not found in search results.');
        console.log('   Results:', searchData.results.map(r => r.entity.name).join(', '));
      }
    } else {
      console.log('❌ Sofascore API (Search) failed:', searchResponse.status);
    }

  } catch (error) {
    console.log('❌ Sofascore error:', error.message);
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
  await testSofascorePort();
  
  console.log('\n═══════════════════════════════════════════════════');
  console.log('  Test Complete');
  console.log('═══════════════════════════════════════════════════\n');
}

runTests();
