const fs = require('fs');
const path = require('path');

async function testRecoverySystem() {
  const endpoint = 'http://localhost:3000/api/recovery/evaluate';
  const testDataPath = path.join(__dirname, 'test-data.json');

  console.log('================================================================');
  console.log('🚀 TESTING INTELLIGENT SHIPMENT PIGGYBACKING SYSTEM (END-TO-END)');
  console.log('================================================================');
  console.log(`Reading mock test data from: ${testDataPath}`);
  
  const rawData = fs.readFileSync(testDataPath, 'utf8');
  const payload = JSON.parse(rawData.replace(/^\uFEFF/, ''));

  console.log('\n--- Input Scenario ---');
  console.log(`Misplaced Shipment: ${payload.misplaced_shipment.id}`);
  console.log(`  Current Location : ${payload.misplaced_shipment.current_hub}`);
  console.log(`  Target Dropoff   : ${payload.misplaced_shipment.destination}`);
  console.log(`  Package Weight   : ${payload.misplaced_shipment.weight} kg`);
  console.log(`  Delivery Deadline: ${payload.misplaced_shipment.deadline} hours`);
  console.log(`  Priority Tier    : ${payload.misplaced_shipment.priority}`);
  console.log(`Total Active Candidate Vehicles: ${payload.active_routes.length}`);

  for (const v of payload.active_routes) {
    console.log(`  - ${v.id}: Origin=${v.current_location} -> Dest=${v.destination}, Available Capacity=${v.available_capacity} kg`);
  }

  console.log(`\nDispatching POST request to Express Gateway: ${endpoint} ...\n`);

  try {
    const startTime = Date.now();
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const elapsed = Date.now() - startTime;
    console.log(`HTTP Status: ${response.status} ${response.statusText} (${elapsed}ms)`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', errorText);
      return;
    }

    const result = await response.json();
    console.log('\n--- Optimization Solver Results ---');
    console.log(JSON.stringify(result, null, 2));

    console.log('\n================================================================');
    console.log('✅ VERIFICATION PASSED: Node.js to Python Engine communication verified!');
    console.log('================================================================');
  } catch (err) {
    console.error('Request failed:', err.message);
  }
}

testRecoverySystem();