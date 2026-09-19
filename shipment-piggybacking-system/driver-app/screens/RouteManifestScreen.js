import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Alert,
  RefreshControl
} from 'react-native';
import axios from 'axios';
import { startTelemetry, stopTelemetry, sendTelemetryPing } from '../services/telemetry';

export default function RouteManifestScreen({ route, navigation }) {
  const { token, user, apiBase = 'http://localhost:3000' } = route.params || {};

  const [manifest, setManifest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionInProgress, setActionInProgress] = useState(null);
  const [telemetryInfo, setTelemetryInfo] = useState({
    active: true,
    lastPingTime: null,
    coords: null,
    pingCount: 0
  });

  const isMounted = useRef(true);

  const fetchManifest = async () => {
    try {
      const res = await axios.get(`${apiBase}/api/routes/driver-manifest`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success && isMounted.current) {
        setManifest(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch manifest:', err);
      Alert.alert('Error', 'Could not load active driver manifest.');
    } finally {
      if (isMounted.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  };

  useEffect(() => {
    isMounted.current = true;
    fetchManifest();

    // Start automated 10-second background telemetry reporting
    startTelemetry({
      apiBase,
      token,
      shipmentId: 'SHP-2001',
      intervalMs: 10000,
      onPingSuccess: (pingResult) => {
        if (!isMounted.current) return;
        setTelemetryInfo(prev => ({
          active: true,
          lastPingTime: new Date().toLocaleTimeString(),
          coords: [pingResult.data.latitude, pingResult.data.longitude],
          pingCount: prev.pingCount + 1
        }));
      },
      onError: (err) => {
        console.warn('Telemetry error:', err);
      }
    });

    return () => {
      isMounted.current = false;
      stopTelemetry();
    };
  }, [token]);

  const handleUpdateStatus = async (shipmentId, nextStatus, notes) => {
    setActionInProgress(shipmentId);
    try {
      const res = await axios.post(
        `${apiBase}/api/recovery/update-status`,
        {
          shipmentId,
          status: nextStatus,
          routeId: manifest?.route?.id,
          notes
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (res.data.success) {
        Alert.alert(
          'Status Confirmed',
          `Consignment ${shipmentId} marked as ${nextStatus}. Operations console notified.`
        );
        await fetchManifest();
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      Alert.alert('Update Failed', msg);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleManualPing = async () => {
    const res = await sendTelemetryPing({
      apiBase,
      token,
      shipmentId: manifest?.piggybacked_items?.[0]?.shipment_id || 'SHP-2001'
    });

    if (res.success) {
      setTelemetryInfo(prev => ({
        active: true,
        lastPingTime: new Date().toLocaleTimeString(),
        coords: [res.data.latitude, res.data.longitude],
        pingCount: prev.pingCount + 1
      }));
      Alert.alert('Telemetry Sent', `GPS Ping Transmitted: [${res.data.latitude}, ${res.data.longitude}]`);
    } else {
      Alert.alert('Ping Failed', res.error);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Syncing Linehaul Route Manifest...</Text>
      </SafeAreaView>
    );
  }

  const assignedRoute = manifest?.route || {};
  const piggybackedItems = manifest?.piggybacked_items || [];
  const standardCargo = manifest?.standard_cargo || [];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#020617" />

      {/* App Header Bar */}
      <View style={styles.headerBar}>
        <View>
          <Text style={styles.driverNameText}>{user?.name || 'Marcus Vance'}</Text>
          <View style={styles.badgeRow}>
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>FLEET DRIVER</Text>
            </View>
            <View style={styles.telemetryBadge}>
              <View style={styles.pulseDot} />
              <Text style={styles.telemetryBadgeText}>GPS 10s LIVE</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => {
            stopTelemetry();
            navigation.replace('Login');
          }}
        >
          <Text style={styles.logoutButtonText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchManifest();
            }}
            tintColor="#6366f1"
          />
        }
      >
        {/* Route Corridor Banner */}
        <View style={styles.corridorCard}>
          <Text style={styles.corridorHeaderLabel}>ASSIGNED LINEHAUL CORRIDOR</Text>
          <View style={styles.corridorRouteRow}>
            <Text style={styles.hubText}>{assignedRoute.origin_hub?.replace('HUB-', '') || 'INDIANAPOLIS'}</Text>
            <Text style={styles.arrowText}>→</Text>
            <Text style={styles.hubText}>{assignedRoute.destination_hub?.replace('HUB-', '') || 'CHICAGO'}</Text>
          </View>

          <View style={styles.corridorStatsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Carrier Unit</Text>
              <Text style={styles.statValue}>{assignedRoute.id || 'VEH-LINEHAUL-501'}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Avail Capacity</Text>
              <Text style={styles.statValue}>{assignedRoute.available_capacity_kg || '1205'} kg</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Avg Speed</Text>
              <Text style={styles.statValue}>{assignedRoute.average_speed_kmh || '70'} km/h</Text>
            </View>
          </View>
        </View>

        {/* Telemetry Status Bar */}
        <View style={styles.telemetryCard}>
          <View style={styles.telemetryRow}>
            <View>
              <Text style={styles.telemetryTitle}>Autonomous Telemetry Stream</Text>
              <Text style={styles.telemetrySubtext}>
                {telemetryInfo.coords
                  ? `Last Ping: ${telemetryInfo.coords[0]}, ${telemetryInfo.coords[1]} (${telemetryInfo.lastPingTime})`
                  : 'Acquiring GPS fix along corridor...'}
              </Text>
            </View>
            <TouchableOpacity style={styles.manualPingButton} onPress={handleManualPing}>
              <Text style={styles.manualPingButtonText}>📡 Ping Now</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* SECTION: Piggybacked Recovery Consignments */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            ⚡ Piggybacked Recovery Cargo ({piggybackedItems.length})
          </Text>
          <Text style={styles.sectionSubtitle}>
            Opportunistic items assigned by autonomous optimization solver
          </Text>
        </View>

        {piggybackedItems.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No active piggyback items currently assigned to this run.</Text>
          </View>
        ) : (
          piggybackedItems.map((item, idx) => {
            const isDelivered = item.recovery_status === 'DELIVERED';
            const isInTransit = item.recovery_status === 'IN_TRANSIT_RECOVERY';

            return (
              <View key={item.shipment_id || idx} style={styles.piggybackCard}>
                {/* Header Flag */}
                <View style={styles.piggybackHeader}>
                  <View style={styles.tagPiggyback}>
                    <Text style={styles.tagPiggybackText}>⚡ PIGGYBACK PICKUP</Text>
                  </View>

                  <View style={[
                    styles.tagPriority,
                    item.priority === 'CRITICAL' ? styles.priorityCritical : styles.priorityHigh
                  ]}>
                    <Text style={styles.tagPriorityText}>{item.priority}</Text>
                  </View>
                </View>

                {/* Item Details */}
                <Text style={styles.itemNameText}>{item.item_name}</Text>
                <Text style={styles.shipmentIdText}>Consignment: {item.shipment_id}</Text>

                {/* Routing Waypoints Grid */}
                <View style={styles.routingGrid}>
                  <View style={styles.routingPoint}>
                    <Text style={styles.pointLabel}>📍 PICKUP HUB</Text>
                    <Text style={styles.pointValue}>{item.pickup_hub}</Text>
                  </View>
                  <View style={styles.routingPoint}>
                    <Text style={styles.pointLabel}>🏁 DROP-OFF HUB</Text>
                    <Text style={styles.pointValue}>{item.dropoff_hub}</Text>
                  </View>
                </View>

                {/* Payload & SLA specs */}
                <View style={styles.specsRow}>
                  <Text style={styles.specText}>📦 Weight: <Text style={styles.boldText}>{item.weight_kg} kg</Text></Text>
                  <Text style={styles.specText}>⏱️ SLA Window: <Text style={styles.boldText}>{item.deadline_hours} hrs</Text></Text>
                  <Text style={styles.specText}>Status: <Text style={styles.statusHighlightText}>{item.recovery_status}</Text></Text>
                </View>

                {/* Actionable Driver Buttons */}
                <View style={styles.actionsContainer}>
                  {/* Pickup button */}
                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      styles.pickupButton,
                      (isInTransit || isDelivered) && styles.completedActionButton
                    ]}
                    onPress={() => handleUpdateStatus(item.shipment_id, 'IN_TRANSIT_RECOVERY', 'Picked up package at transfer cross-dock.')}
                    disabled={actionInProgress === item.shipment_id || isInTransit || isDelivered}
                  >
                    {actionInProgress === item.shipment_id ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <Text style={styles.actionButtonText}>
                        {isInTransit || isDelivered ? '✓ Pickup Confirmed' : '1. Confirm Piggyback Pickup'}
                      </Text>
                    )}
                  </TouchableOpacity>

                  {/* Delivery button */}
                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      styles.deliverButton,
                      isDelivered && styles.completedActionButton
                    ]}
                    onPress={() => handleUpdateStatus(item.shipment_id, 'DELIVERED', 'Transfer completed at destination hub sorting bay.')}
                    disabled={actionInProgress === item.shipment_id || isDelivered}
                  >
                    <Text style={styles.actionButtonText}>
                      {isDelivered ? '✓ Transfer Completed' : '2. Confirm Transfer Complete'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}

        {/* SECTION: Standard Cargo */}
        {standardCargo.length > 0 && (
          <>
            <View style={[styles.sectionHeader, { marginTop: 24 }]}>
              <Text style={styles.sectionTitle}>
                🚛 Standard Linehaul Cargo ({standardCargo.length})
              </Text>
            </View>

            {standardCargo.map((item, idx) => (
              <View key={item.shipment_id || idx} style={styles.standardCard}>
                <View style={styles.standardRow}>
                  <View>
                    <Text style={styles.standardItemName}>{item.item_name}</Text>
                    <Text style={styles.standardSubtext}>{item.shipment_id} • {item.weight_kg} kg</Text>
                  </View>
                  <Text style={styles.standardStatusText}>{item.status}</Text>
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617'
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#020617',
    alignItems: 'center',
    justifyContent: 'center'
  },
  loadingText: {
    color: '#94a3b8',
    fontSize: 13,
    marginTop: 12
  },
  headerBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    backgroundColor: '#0f172a',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  driverNameText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800'
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8
  },
  roleBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)'
  },
  roleBadgeText: {
    color: '#fbbf24',
    fontSize: 9,
    fontWeight: '700'
  },
  telemetryBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981'
  },
  telemetryBadgeText: {
    color: '#34d399',
    fontSize: 9,
    fontWeight: '700'
  },
  logoutButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#1e293b',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#334155'
  },
  logoutButtonText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600'
  },
  scrollArea: {
    flex: 1
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40
  },
  corridorCard: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 12
  },
  corridorHeaderLabel: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5
  },
  corridorRouteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
    gap: 8
  },
  hubText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800'
  },
  arrowText: {
    color: '#6366f1',
    fontSize: 18,
    fontWeight: '700'
  },
  corridorStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#1e293b'
  },
  statItem: {
    alignItems: 'flex-start'
  },
  statLabel: {
    color: '#64748b',
    fontSize: 9,
    fontWeight: '600'
  },
  statValue: {
    color: '#e2e8f0',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2
  },
  telemetryCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 18
  },
  telemetryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  telemetryTitle: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '700'
  },
  telemetrySubtext: {
    color: '#94a3b8',
    fontSize: 10,
    marginTop: 2
  },
  manualPingButton: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#38bdf8'
  },
  manualPingButtonText: {
    color: '#38bdf8',
    fontSize: 10,
    fontWeight: '700'
  },
  sectionHeader: {
    marginBottom: 10
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800'
  },
  sectionSubtitle: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 2
  },
  emptyCard: {
    padding: 24,
    backgroundColor: '#0f172a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    alignItems: 'center'
  },
  emptyText: {
    color: '#64748b',
    fontSize: 12
  },
  piggybackCard: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    marginBottom: 14,
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4
  },
  piggybackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  tagPiggyback: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.5)'
  },
  tagPiggybackText: {
    color: '#fbbf24',
    fontSize: 10,
    fontWeight: '800'
  },
  tagPriority: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  priorityCritical: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.5)'
  },
  priorityHigh: {
    backgroundColor: 'rgba(249, 115, 22, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.5)'
  },
  tagPriorityText: {
    color: '#fca5a5',
    fontSize: 10,
    fontWeight: '800'
  },
  itemNameText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700'
  },
  shipmentIdText: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2,
    fontFamily: 'monospace'
  },
  routingGrid: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 12,
    backgroundColor: '#020617',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1e293b'
  },
  routingPoint: {
    flex: 1
  },
  pointLabel: {
    color: '#64748b',
    fontSize: 9,
    fontWeight: '700'
  },
  pointValue: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2
  },
  specsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    marginBottom: 12
  },
  specText: {
    color: '#94a3b8',
    fontSize: 10
  },
  boldText: {
    color: '#ffffff',
    fontWeight: '700'
  },
  statusHighlightText: {
    color: '#34d399',
    fontWeight: '700'
  },
  actionsContainer: {
    flexDirection: 'column',
    gap: 8
  },
  actionButton: {
    paddingVertical: 11,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  pickupButton: {
    backgroundColor: '#4f46e5'
  },
  deliverButton: {
    backgroundColor: '#059669'
  },
  completedActionButton: {
    backgroundColor: '#1e293b',
    opacity: 0.6
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700'
  },
  standardCard: {
    backgroundColor: '#0f172a',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 8
  },
  standardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  standardItemName: {
    color: '#e2e8f0',
    fontSize: 12,
    fontWeight: '600'
  },
  standardSubtext: {
    color: '#64748b',
    fontSize: 10,
    marginTop: 2
  },
  standardStatusText: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '700'
  }
});
