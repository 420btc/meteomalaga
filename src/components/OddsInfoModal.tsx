import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  Modal, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView 
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { getCurrentSeason } from '../services/oddsService';

interface OddsInfoModalProps {
  visible: boolean;
  onClose: () => void;
  betType: 'rain' | 'temperature' | 'wind' | null;
}

const OddsInfoModal: React.FC<OddsInfoModalProps> = ({ visible, onClose, betType }) => {
  const currentSeason = getCurrentSeason();
  
  const renderRainOddsInfo = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Cuotas para Lluvia</Text>
      <Text style={styles.paragraph}>
        Málaga tiene 481 mm de precipitación anual repartidos en aproximadamente 63 días de lluvia.
      </Text>
      
      <View style={styles.tableContainer}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableCell, styles.tableHeaderText]}>Cantidad (mm)</Text>
          <Text style={[styles.tableCell, styles.tableHeaderText]}>Probabilidad</Text>
          <Text style={[styles.tableCell, styles.tableHeaderText]}>Cuota</Text>
        </View>
        
        <View style={styles.tableRow}>
          <Text style={styles.tableCell}>0 mm</Text>
          <Text style={styles.tableCell}>82.76%</Text>
          <Text style={[styles.tableCell, styles.oddValue]}>1.2x</Text>
        </View>
        
        <View style={styles.tableRow}>
          <Text style={styles.tableCell}>0.1-1 mm</Text>
          <Text style={styles.tableCell}>5%</Text>
          <Text style={[styles.tableCell, styles.oddValue]}>3.0x</Text>
        </View>
        
        <View style={styles.tableRow}>
          <Text style={styles.tableCell}>1.1-3 mm</Text>
          <Text style={styles.tableCell}>5%</Text>
          <Text style={[styles.tableCell, styles.oddValue]}>4.0x</Text>
        </View>
        
        <View style={styles.tableRow}>
          <Text style={styles.tableCell}>3.1-6 mm</Text>
          <Text style={styles.tableCell}>2%</Text>
          <Text style={[styles.tableCell, styles.oddValue]}>6.0x</Text>
        </View>
        
        <View style={styles.tableRow}>
          <Text style={styles.tableCell}>6.1-10 mm</Text>
          <Text style={styles.tableCell}>2%</Text>
          <Text style={[styles.tableCell, styles.oddValue]}>10.0x</Text>
        </View>
        
        <View style={styles.tableRow}>
          <Text style={styles.tableCell}>10.1-15 mm</Text>
          <Text style={styles.tableCell}>1.5%</Text>
          <Text style={[styles.tableCell, styles.oddValue]}>15.0x</Text>
        </View>
        
        <View style={styles.tableRow}>
          <Text style={styles.tableCell}>15.1-20 mm</Text>
          <Text style={styles.tableCell}>1.5%</Text>
          <Text style={[styles.tableCell, styles.oddValue]}>20.0x</Text>
        </View>
        
        <View style={styles.tableRow}>
          <Text style={styles.tableCell}>20.1-30 mm</Text>
          <Text style={styles.tableCell}>1%</Text>
          <Text style={[styles.tableCell, styles.oddValue]}>30.0x</Text>
        </View>
        
        <View style={styles.tableRow}>
          <Text style={styles.tableCell}>30.1-40 mm</Text>
          <Text style={styles.tableCell}>0.7%</Text>
          <Text style={[styles.tableCell, styles.oddValue]}>50.0x</Text>
        </View>
        
        <View style={styles.tableRow}>
          <Text style={styles.tableCell}>40.1-50 mm</Text>
          <Text style={styles.tableCell}>0.5%</Text>
          <Text style={[styles.tableCell, styles.oddValue]}>75.0x</Text>
        </View>
        
        <View style={styles.tableRow}>
          <Text style={styles.tableCell}>50.1-75 mm</Text>
          <Text style={styles.tableCell}>0.3%</Text>
          <Text style={[styles.tableCell, styles.oddValue]}>100.0x</Text>
        </View>
        
        <View style={styles.tableRow}>
          <Text style={styles.tableCell}>75.1-100 mm</Text>
          <Text style={styles.tableCell}>0.2%</Text>
          <Text style={[styles.tableCell, styles.oddValue]}>150.0x</Text>
        </View>
        
        <View style={styles.tableRow}>
          <Text style={styles.tableCell}>>100 mm</Text>
          <Text style={styles.tableCell}>0.05%</Text>
          <Text style={[styles.tableCell, styles.oddValue]}>300.0x</Text>
        </View>
      </View>
      
      <Text style={styles.seasonalNote}>
        En verano, las cuotas para lluvia >3 mm aumentan un 20%.
        En invierno, las cuotas para lluvia >3 mm disminuyen un 10%.
      </Text>
    </View>
  );
  
  const renderTemperatureOddsInfo = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Cuotas para Temperatura</Text>
      <Text style={styles.paragraph}>
        Málaga tiene temperaturas que oscilan entre 10°C y 35°C según la estación.
      </Text>
      
      <Text style={styles.subSectionTitle}>Verano (junio a septiembre)</Text>
      <View style={styles.tableContainer}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableCell, styles.tableHeaderText]}>Temperatura (°C)</Text>
          <Text style={[styles.tableCell, styles.tableHeaderText]}>Probabilidad</Text>
          <Text style={[styles.tableCell, styles.tableHeaderText]}>Cuota</Text>
        </View>
        
        <View style={styles.tableRow}>
          <Text style={styles.tableCell}>&lt;25°C</Text>
          <Text style={styles.tableCell}>5%</Text>
          <Text style={[styles.tableCell, styles.oddValue]}>5.0x</Text>
        </View>
        
        <View style={styles.tableRow}>
          <Text style={styles.tableCell}>25-30°C</Text>
          <Text style={styles.tableCell}>60%</Text>
          <Text style={[styles.tableCell, styles.oddValue]}>1.5x</Text>
        </View>
        
        <View style={styles.tableRow}>
          <Text style={styles.tableCell}>30.1-35°C</Text>
          <Text style={styles.tableCell}>30%</Text>
          <Text style={[styles.tableCell, styles.oddValue]}>2.5x</Text>
        </View>
        
        <View style={styles.tableRow}>
          <Text style={styles.tableCell}>35.1-40°C</Text>
          <Text style={styles.tableCell}>4%</Text>
          <Text style={[styles.tableCell, styles.oddValue]}>8.0x</Text>
        </View>
        
        <View style={styles.tableRow}>
          <Text style={styles.tableCell}>&gt;40°C</Text>
          <Text style={styles.tableCell}>1%</Text>
          <Text style={[styles.tableCell, styles.oddValue]}>20.0x</Text>
        </View>
      </View>
      
      <Text style={styles.subSectionTitle}>Invierno (diciembre a febrero)</Text>
      <View style={styles.tableContainer}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableCell, styles.tableHeaderText]}>Temperatura (°C)</Text>
          <Text style={[styles.tableCell, styles.tableHeaderText]}>Probabilidad</Text>
          <Text style={[styles.tableCell, styles.tableHeaderText]}>Cuota</Text>
        </View>
        
        <View style={styles.tableRow}>
          <Text style={styles.tableCell}>&lt;10°C</Text>
          <Text style={styles.tableCell}>5%</Text>
          <Text style={[styles.tableCell, styles.oddValue]}>5.0x</Text>
        </View>
        
        <View style={styles.tableRow}>
          <Text style={styles.tableCell}>10-14°C</Text>
          <Text style={styles.tableCell}>40%</Text>
          <Text style={[styles.tableCell, styles.oddValue]}>2.0x</Text>
        </View>
        
        <View style={styles.tableRow}>
          <Text style={styles.tableCell}>14.1-18°C</Text>
          <Text style={styles.tableCell}>50%</Text>
          <Text style={[styles.tableCell, styles.oddValue]}>1.5x</Text>
        </View>
        
        <View style={styles.tableRow}>
          <Text style={styles.tableCell}>18.1-22°C</Text>
          <Text style={styles.tableCell}>4%</Text>
          <Text style={[styles.tableCell, styles.oddValue]}>8.0x</Text>
        </View>
        
        <View style={styles.tableRow}>
          <Text style={styles.tableCell}>&gt;22°C</Text>
          <Text style={styles.tableCell}>1%</Text>
          <Text style={[styles.tableCell, styles.oddValue]}>20.0x</Text>
        </View>
      </View>
      
      <Text style={styles.seasonalNote}>
        En verano, las cuotas para temperaturas >30°C disminuyen un 10%.
        En invierno, las cuotas para temperaturas &lt;14°C aumentan un 10%.
      </Text>
    </View>
  );
  
  const renderWindOddsInfo = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Cuotas para Viento</Text>
      <Text style={styles.paragraph}>
        Málaga tiene vientos promedio de 13 km/h, con días comunes de 20-30 km/h y rachas de hasta 100 km/h.
      </Text>
      
      <View style={styles.tableContainer}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableCell, styles.tableHeaderText]}>Velocidad (km/h)</Text>
          <Text style={[styles.tableCell, styles.tableHeaderText]}>Probabilidad</Text>
          <Text style={[styles.tableCell, styles.tableHeaderText]}>Cuota</Text>
        </View>
        
        <View style={styles.tableRow}>
          <Text style={styles.tableCell}>0-10 km/h</Text>
          <Text style={styles.tableCell}>40%</Text>
          <Text style={[styles.tableCell, styles.oddValue]}>1.8x</Text>
        </View>
        
        <View style={styles.tableRow}>
          <Text style={styles.tableCell}>10.1-20 km/h</Text>
          <Text style={styles.tableCell}>35%</Text>
          <Text style={[styles.tableCell, styles.oddValue]}>2.0x</Text>
        </View>
        
        <View style={styles.tableRow}>
          <Text style={styles.tableCell}>20.1-30 km/h</Text>
          <Text style={styles.tableCell}>15%</Text>
          <Text style={[styles.tableCell, styles.oddValue]}>3.0x</Text>
        </View>
        
        <View style={styles.tableRow}>
          <Text style={styles.tableCell}>30.1-40 km/h</Text>
          <Text style={styles.tableCell}>6%</Text>
          <Text style={[styles.tableCell, styles.oddValue]}>5.0x</Text>
        </View>
        
        <View style={styles.tableRow}>
          <Text style={styles.tableCell}>40.1-50 km/h</Text>
          <Text style={styles.tableCell}>2.5%</Text>
          <Text style={[styles.tableCell, styles.oddValue]}>10.0x</Text>
        </View>
        
        <View style={styles.tableRow}>
          <Text style={styles.tableCell}>50.1-75 km/h</Text>
          <Text style={styles.tableCell}>1%</Text>
          <Text style={[styles.tableCell, styles.oddValue]}>20.0x</Text>
        </View>
        
        <View style={styles.tableRow}>
          <Text style={styles.tableCell}>75.1-100 km/h</Text>
          <Text style={styles.tableCell}>0.4%</Text>
          <Text style={[styles.tableCell, styles.oddValue]}>50.0x</Text>
        </View>
        
        <View style={styles.tableRow}>
          <Text style={styles.tableCell}>&gt;100 km/h</Text>
          <Text style={styles.tableCell}>0.1%</Text>
          <Text style={[styles.tableCell, styles.oddValue]}>100.0x</Text>
        </View>
      </View>
      
      <Text style={styles.seasonalNote}>
        En verano, las cuotas para viento >30 km/h aumentan un 20%.
        En invierno, las cuotas para viento >30 km/h disminuyen un 10%.
      </Text>
    </View>
  );
  
  const renderContent = () => {
    switch (betType) {
      case 'rain':
        return renderRainOddsInfo();
      case 'temperature':
        return renderTemperatureOddsInfo();
      case 'wind':
        return renderWindOddsInfo();
      default:
        return (
          <>
            {renderRainOddsInfo()}
            {renderTemperatureOddsInfo()}
            {renderWindOddsInfo()}
          </>
        );
    }
  };
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Información de Cuotas</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Feather name="x" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.seasonBanner}>
            <Text style={styles.seasonBannerText}>
              Estación actual: <Text style={styles.seasonBannerHighlight}>{currentSeason}</Text>
            </Text>
          </View>
          
          <ScrollView style={styles.modalBody}>
            {renderContent()}
          </ScrollView>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#1E3A8A',
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  closeButton: {
    padding: 4,
  },
  seasonBanner: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    padding: 10,
    alignItems: 'center',
  },
  seasonBannerText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  seasonBannerHighlight: {
    fontWeight: 'bold',
    color: '#FFD700',
  },
  modalBody: {
    padding: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 12,
    lineHeight: 20,
  },
  tableContainer: {
    marginVertical: 10,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingVertical: 8,
  },
  tableHeaderText: {
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  tableCell: {
    flex: 1,
    padding: 8,
    textAlign: 'center',
    color: '#FFFFFF',
    fontSize: 12,
  },
  oddValue: {
    color: '#FFD700',
    fontWeight: 'bold',
  },
  seasonalNote: {
    fontSize: 12,
    color: '#FFFFFF',
    fontStyle: 'italic',
    marginTop: 10,
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
  },
});

export default OddsInfoModal;
