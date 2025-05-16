import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { usePerformanceMonitor } from '../providers/PerformanceMonitorProvider';
import { PerformanceMeasurement } from '@/infrastructure/monitoring/PerformanceMonitor';
import { UIPerformanceMetricType } from '@/infrastructure/monitoring/UIPerformanceMonitor';

interface PerformanceStatsOverlayProps {
  showFullDetails?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  opacity?: number;
}

/**
 * Komponent för att visa prestandastatistik som ett overlay i appen
 */
export const PerformanceStatsOverlay: React.FC<PerformanceStatsOverlayProps> = ({
  showFullDetails = false,
  position = 'bottom-right',
  opacity = 0.8,
}) => {
  const { 
    measurements, 
    getMeasurements, 
    isMonitoringEnabled, 
    toggleMonitoring, 
    clearMeasurements 
  } = usePerformanceMonitor();
  
  const [stats, setStats] = useState<Record<string, any>>({});
  const [isExpanded, setIsExpanded] = useState(showFullDetails);
  const [isModalVisible, setIsModalVisible] = useState(false);
  
  // Beräkna statistik från mätningarna
  const calculateStats = useCallback(() => {
    if (measurements.length === 0) {
      setStats({});
      return;
    }
    
    const calculatedStats: Record<string, any> = {
      totalMeasurements: measurements.length,
      averageDuration: 0,
      slowRendersCount: 0,
      slowNavigationCount: 0,
      metricsByType: {},
    };
    
    let totalDuration = 0;
    let totalSlowRenders = 0;
    let totalSlowNavigations = 0;
    
    const typeStats: Record<string, { count: number, totalDuration: number, avgDuration: number, slowCount: number }> = {};
    
    // Beräkna statistik per mätningstyp
    measurements.forEach(m => {
      if (!m.duration) return;
      
      totalDuration += m.duration;
      
      const type = m.parameters?.type as UIPerformanceMetricType || 'unknown';
      
      if (!typeStats[type]) {
        typeStats[type] = {
          count: 0,
          totalDuration: 0,
          avgDuration: 0,
          slowCount: 0,
        };
      }
      
      typeStats[type].count++;
      typeStats[type].totalDuration += m.duration;
      
      // Beräkna långsamma renderingar (över 16ms) och navigationshändelser (över 300ms)
      if (type === UIPerformanceMetricType.COMPONENT_RENDER && m.duration > 16) {
        typeStats[type].slowCount++;
        totalSlowRenders++;
      } else if (type === UIPerformanceMetricType.SCREEN_NAVIGATION && m.duration > 300) {
        typeStats[type].slowCount++;
        totalSlowNavigations++;
      }
    });
    
    // Beräkna genomsnitt för varje typ
    Object.keys(typeStats).forEach(type => {
      if (typeStats[type].count > 0) {
        typeStats[type].avgDuration = typeStats[type].totalDuration / typeStats[type].count;
      }
    });
    
    calculatedStats.averageDuration = totalDuration / measurements.length;
    calculatedStats.slowRendersCount = totalSlowRenders;
    calculatedStats.slowNavigationCount = totalSlowNavigations;
    calculatedStats.metricsByType = typeStats;
    
    setStats(calculatedStats);
  }, [measurements]);
  
  // Beräkna statistik när mätningarna ändras
  useEffect(() => {
    calculateStats();
  }, [measurements, calculateStats]);
  
  // Uppdatera mätningar periodiskt
  useEffect(() => {
    if (isMonitoringEnabled) {
      const intervalId = setInterval(() => {
        getMeasurements();
      }, 2000);
      
      return () => clearInterval(intervalId);
    }
    
    return undefined;
  }, [isMonitoringEnabled, getMeasurements]);
  
  // Positioneringsstil baserat på vald position
  const getPositionStyle = () => {
    switch (position) {
      case 'top-left':
        return { top: 40, left: 10 };
      case 'top-right':
        return { top: 40, right: 10 };
      case 'bottom-left':
        return { bottom: 40, left: 10 };
      case 'bottom-right':
      default:
        return { bottom: 40, right: 10 };
    }
  };
  
  // Renderar en kompakt minivy
  const renderMiniView = () => (
    <TouchableOpacity 
      style={[
        styles.miniContainer, 
        getPositionStyle(), 
        { opacity },
        !isMonitoringEnabled && styles.disabled
      ]}
      onPress={() => setIsExpanded(true)}
      onLongPress={() => setIsModalVisible(true)}
    >
      <Text style={styles.miniTitle}>Perf Stats</Text>
      <Text style={styles.miniText}>Mätningar: {measurements.length}</Text>
      {stats.averageDuration && (
        <Text style={styles.miniText}>Avg: {stats.averageDuration.toFixed(1)}ms</Text>
      )}
      {stats.slowRendersCount > 0 && (
        <Text style={[styles.miniText, styles.warning]}>
          Långsamma renderingar: {stats.slowRendersCount}
        </Text>
      )}
    </TouchableOpacity>
  );
  
  // Renderar en expanderad vy
  const renderExpandedView = () => (
    <View style={[styles.expandedContainer, getPositionStyle(), { opacity }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Prestandastatistik</Text>
        <View style={styles.controls}>
          <TouchableOpacity 
            style={[styles.controlButton, isMonitoringEnabled ? styles.enabled : styles.disabled]}
            onPress={() => toggleMonitoring(!isMonitoringEnabled)}
          >
            <Text style={styles.controlText}>{isMonitoringEnabled ? 'Pausa' : 'Starta'}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.controlButton}
            onPress={clearMeasurements}
          >
            <Text style={styles.controlText}>Rensa</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.controlButton}
            onPress={() => setIsModalVisible(true)}
          >
            <Text style={styles.controlText}>Detaljer</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.controlButton}
            onPress={() => setIsExpanded(false)}
          >
            <Text style={styles.controlText}>Minimera</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {measurements.length === 0 ? (
        <Text style={styles.noData}>Inga mätningar än</Text>
      ) : (
        <View style={styles.statsContainer}>
          <Text style={styles.statsText}>Antal mätningar: {measurements.length}</Text>
          <Text style={styles.statsText}>
            Genomsnittlig tid: {stats.averageDuration ? stats.averageDuration.toFixed(1) : 0}ms
          </Text>
          
          {Object.keys(stats.metricsByType || {}).map(type => (
            <View key={type} style={styles.typeContainer}>
              <Text style={styles.typeTitle}>{type}:</Text>
              <Text style={styles.typeText}>Antal: {stats.metricsByType[type].count}</Text>
              <Text style={styles.typeText}>
                Avg: {stats.metricsByType[type].avgDuration.toFixed(1)}ms
              </Text>
              {stats.metricsByType[type].slowCount > 0 && (
                <Text style={[styles.typeText, styles.warning]}>
                  Långsamma: {stats.metricsByType[type].slowCount}
                </Text>
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  );
  
  // Renderar detaljmodalvy
  const renderDetailModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isModalVisible}
      onRequestClose={() => setIsModalVisible(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Detaljerade prestandamätningar</Text>
          
          <ScrollView style={styles.modalScroll}>
            {measurements.length === 0 ? (
              <Text style={styles.noData}>Inga mätningar tillgängliga</Text>
            ) : (
              measurements.map((m, index) => (
                <View key={index} style={styles.measurementItem}>
                  <Text style={styles.measurementName}>{m.name}</Text>
                  <Text style={[
                    styles.measurementDuration,
                    m.duration && m.duration > 16 ? styles.warning : null
                  ]}>
                    {m.duration ? `${m.duration.toFixed(1)}ms` : 'N/A'}
                  </Text>
                  <Text style={styles.measurementType}>
                    Typ: {m.parameters?.type || m.type}
                  </Text>
                  {m.parameters?.componentName && (
                    <Text style={styles.measurementComponent}>
                      Komponent: {m.parameters.componentName}
                    </Text>
                  )}
                </View>
              ))
            )}
          </ScrollView>
          
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={clearMeasurements}
            >
              <Text style={styles.modalButtonText}>Rensa alla</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setIsModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>Stäng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
  
  return (
    <>
      {isExpanded ? renderExpandedView() : renderMiniView()}
      {renderDetailModal()}
    </>
  );
};

const styles = StyleSheet.create({
  miniContainer: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 8,
    padding: 8,
    maxWidth: 150,
  },
  miniTitle: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  miniText: {
    color: '#FFF',
    fontSize: 10,
  },
  expandedContainer: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 8,
    padding: 10,
    maxWidth: 300,
    maxHeight: 400,
  },
  header: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 5,
  },
  controls: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  controlButton: {
    backgroundColor: '#444',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
    marginRight: 5,
    marginBottom: 5,
  },
  controlText: {
    color: '#FFF',
    fontSize: 10,
  },
  statsContainer: {
    marginTop: 5,
  },
  statsText: {
    color: '#FFF',
    fontSize: 11,
    marginBottom: 2,
  },
  typeContainer: {
    marginTop: 5,
    paddingLeft: 5,
    borderLeftWidth: 1,
    borderLeftColor: '#555',
  },
  typeTitle: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 11,
  },
  typeText: {
    color: '#DDD',
    fontSize: 10,
  },
  noData: {
    color: '#AAA',
    fontSize: 12,
    fontStyle: 'italic',
  },
  warning: {
    color: '#FF6B6B',
  },
  enabled: {
    backgroundColor: '#007AFF',
  },
  disabled: {
    backgroundColor: '#555',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#222',
    borderRadius: 10,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  modalScroll: {
    maxHeight: 400,
  },
  measurementItem: {
    backgroundColor: '#333',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  measurementName: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  measurementDuration: {
    color: '#4CD964',
    fontSize: 12,
  },
  measurementType: {
    color: '#CCC',
    fontSize: 12,
  },
  measurementComponent: {
    color: '#CCC',
    fontSize: 12,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 15,
  },
  modalButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
    marginLeft: 10,
  },
  modalButtonText: {
    color: '#FFF',
    fontSize: 14,
  },
});

export default PerformanceStatsOverlay; 