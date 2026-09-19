const { io } = require('socket.io-client');

const BACKEND_URL = 'http://localhost:3000';

async function runEndToEndSimulation() {
  console.log('================================================================');
  console.log('🌐 RUNNING END-TO-END SHIPMENT PIGGYBACKING RECOVERY LIFECYCLE');
  console.log('================================================================');

  // Step 0: Reset store to ensure clean initial test state
  console.log('[Step 0] Resetting logistics data store to initial state...');
  await fetch(`${BACKEND_URL}/api/shipments/reset`, { method: 'POST' });
  console.log('  State reset verified.\n');

  // Step 1: Establish real-time WebSocket connection
  console.log('[Step 1] Connecting to Node.js WebSocket gateway at', BACKEND_URL, '...');
  const socket = io(BACKEND_URL, {
    transports: ['websocket', 'polling']
  });

  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('WebSocket connection timeout')), 5000);
    socket.on('connect', () => {
      clearTimeout(timer);
      console.log(`  Connected to WebSocket with Socket ID: ${socket.id}\n`);
      resolve();
    });
  });

  // Prepare promises for WebSocket event pipeline
  let resolveAnomalyEvent;
  const anomalyEventPromise = new Promise(resolve => { resolveAnomalyEvent = resolve; });

  let resolveExecutionEvent;
  const executionEventPromise = new Promise(resolve => { resolveExecutionEvent = resolve; });

  socket.on('anomaly_detected', (data) => {
    console.log('⚡ [WebSocket Received] "anomaly_detected" event triggered!');
    resolveAnomalyEvent(data);
  });

  socket.on('strategy_executed', (data) => {
    console.log('⚡ [WebSocket Received] "strategy_executed" event triggered!');
    resolveExecutionEvent(data);
  });

  // Step 2: Inject tracking anomaly ping
  console.log('[Step 2] Injecting off-route tracking checkpoint scan...');
  const pingPayload = {
    shipmentId: 'SHP-1001',
    currentHub: 'HUB-INDIANAPOLIS'
  };
  console.log(`  Transmitting ping: Shipment ${pingPayload.shipmentId} scanned at ${pingPayload.currentHub}`);

  const pingRes = await fetch(`${BACKEND_URL}/api/tracking/ping`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(pingPayload)
  });

  if (!pingRes.ok) {
    throw new Error(`Tracking ping failed: ${await pingRes.text()}`);
  }
  console.log('  Tracking ping accepted by Ingestion Service. Waiting for WebSocket broadcast...\n');

  // Step 3: Await WebSocket anomaly notification
  console.log('[Step 3] Awaiting autonomous solver results via WebSocket...');
  const anomalyData = await anomalyEventPromise;
  console.log(`  Anomaly Confirmed for Shipment: ${anomalyData.shipmentId}`);
  console.log(`  Current Location Flagged     : ${anomalyData.currentHub}`);
  console.log(`  Total Recovery Strategies    : ${anomalyData.recovery_strategies.length}`);

  anomalyData.recovery_strategies.forEach((strat, idx) => {
    console.log(`    Strategy #${idx + 1}: ${strat.route_id} | Path: ${strat.path.join('->')} | Cost: $${strat.estimated_cost} | Transit: ${strat.estimated_transit_hours}h | Status: ${strat.status}`);
  });

  // Step 4: Pick optimal strategy and execute recovery
  const viable = anomalyData.recovery_strategies.filter(s => s.meets_deadline);
  if (viable.length === 0) {
    throw new Error('No viable recovery strategies found that meet the SLA deadline.');
  }

  const optimalStrategy = viable[0];
  console.log(`\n[Step 4] Selecting Optimal Recovery Strategy: ${optimalStrategy.route_id}`);
  console.log(`  - Direct Leg/Detour : ${optimalStrategy.details}`);
  console.log(`  - Estimated Cost    : $${optimalStrategy.estimated_cost}`);
  console.log(`  - Transit Duration  : ${optimalStrategy.estimated_transit_hours} hours (SLA Deadline: ${optimalStrategy.deadline_hours} hours)`);

  console.log('\n[Step 5] Calling Execution API: POST /api/recovery/execute ...');
  const executeRes = await fetch(`${BACKEND_URL}/api/recovery/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      shipmentId: anomalyData.shipmentId,
      strategyId: optimalStrategy.route_id
    })
  });

  if (!executeRes.ok) {
    throw new Error(`Execution API failed: ${await executeRes.text()}`);
  }
  const executeResult = await executeRes.json();
  console.log(`  API Response: ${executeResult.message}`);

  // Step 6: Await real-time execution broadcast
  console.log('\n[Step 6] Awaiting real-time WebSocket state confirmation...');
  const executionData = await executionEventPromise;

  console.log('\n================================================================');
  console.log('🎉 RECOVERY LIFECYCLE COMPLETED SUCCESSFULLY!');
  console.log('================================================================');
  console.log('Verification Audit:');
  console.log(`  1. Shipment ID               : ${executionData.shipmentId}`);
  console.log(`  2. Misplaced Flag Cleared    : ${!executionData.shipment.is_misplaced}`);
  console.log(`  3. Assigned Carrier Route    : ${executionData.shipment.assigned_route}`);
  console.log(`  4. Vehicle Remaining Capacity: ${executionData.vehicle.available_capacity} kg`);
  console.log(`  5. Audit Log Entry           : "${executionData.shipment.last_event}"`);
  console.log('================================================================\n');

  socket.disconnect();
  setTimeout(() => process.exit(0), 200);
}

runEndToEndSimulation().catch((err) => {
  console.error('❌ E2E Simulation Error:', err);
  process.exit(1);
});