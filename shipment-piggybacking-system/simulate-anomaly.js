/**
 * Anomaly Simulation Script for Intelligent Shipment Recovery
 * Ingests a live tracking ping placing SHP-1001 at an unexpected hub (HUB-INDIANAPOLIS)
 * instead of its scheduled corridor (HUB-MILWAUKEE -> HUB-CHICAGO).
 */
async function runSimulation() {
  const endpoint = 'http://localhost:3000/api/tracking/ping';
  
  console.log('================================================================');
  console.log('📦 LOGISTICS ANOMALY SIMULATION: OFF-ROUTE CARGO TRACKING PING');
  console.log('================================================================');
  
  const pingPayload = {
    shipmentId: 'SHP-1001',
    currentHub: 'HUB-INDIANAPOLIS'
  };

  console.log('Simulating automated RFID dock checkpoint scan:');
  console.log(`  Shipment ID : ${pingPayload.shipmentId}`);
  console.log(`  Scanned Hub : ${pingPayload.currentHub}`);
  console.log(`  Target API  : ${endpoint}`);
  console.log('\nTransmitting tracking event to Node.js Ingestion Engine...');

  try {
    const startTime = Date.now();
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pingPayload)
    });

    const elapsed = Date.now() - startTime;
    console.log(`HTTP Response: ${res.status} ${res.statusText} (${elapsed}ms)`);

    if (!res.ok) {
      const errText = await res.text();
      console.error('Simulation Failed:', errText);
      return;
    }

    const json = await res.json();
    console.log('\n--- Ingestion & Anomaly Detection Output ---');
    console.log(`Anomaly Flagged       : ${json.data.anomalyDetected}`);
    console.log(`Shipment Misplaced    : ${json.data.is_misplaced}`);
    console.log(`Active Hub Updated To : ${json.data.shipment.current_hub}`);
    console.log(`Last Event Log        : ${json.data.shipment.last_event}`);
    console.log(`Recovery Options Found: ${json.data.recovery_strategies.length}`);

    console.log('\n--- Autonomous Piggybacking Strategies (via Python Engine) ---');
    json.data.recovery_strategies.forEach((strat, index) => {
      console.log(`\n[Option #${index + 1}] Route ID: ${strat.route_id} (${strat.status})`);
      console.log(`  - Itinerary Path       : ${strat.path.join(' -> ')}`);
      console.log(`  - Transit Time vs SLA  : ${strat.estimated_transit_hours} hrs (Deadline: ${strat.deadline_hours} hrs)`);
      console.log(`  - Estimated Added Cost : $${strat.estimated_cost}`);
      console.log(`  - Available Capacity   : ${strat.available_capacity} kg (Cargo Weight: ${strat.shipment_weight} kg)`);
      console.log(`  - Details              : ${strat.details}`);
    });

    console.log('\n================================================================');
    console.log('✅ ANOMALY DETECTED & PIGGYBACKING RECOVERY PLAN COMPUTED!');
    console.log('================================================================');
  } catch (err) {
    console.error('Simulation execution failed:', err.message);
  }
}

runSimulation();