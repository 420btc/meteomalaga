import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  Modal, 
  Platform,
  ScrollView,
  Dimensions
} from 'react-native';
import { Feather } from '@expo/vector-icons';

interface DatePickerProps {
  date: string;
  onDateChange: (date: string) => void;
  label?: string;
}

const DatePicker: React.FC<DatePickerProps> = ({
  date,
  onDateChange,
  label = 'Fecha',
}) => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Generate dates for the next 7 days
  const generateDates = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 0; i < 14; i++) {
      const newDate = new Date(today);
      newDate.setDate(today.getDate() + i);
      dates.push({
        dateString: newDate.toISOString().split('T')[0],
        day: newDate.getDate(),
        month: newDate.getMonth() + 1,
        year: newDate.getFullYear(),
        dayName: newDate.toLocaleDateString('es-ES', { weekday: 'short' })
      });
    }
    
    return dates;
  };
  
  const dates = generateDates();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
  };

  const handleDateSelect = (dateString: string) => {
    onDateChange(dateString);
    setShowDatePicker(false);
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity
        style={styles.dateButton}
        onPress={() => setShowDatePicker(true)}
      >
        <Text style={styles.dateText}>{formatDate(date)}</Text>
        <Feather name="calendar" size={20} color="#3B82F6" />
      </TouchableOpacity>

      <Modal
        visible={showDatePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowDatePicker(false)}
        >
          <View 
            style={styles.pickerContainer}
            onStartShouldSetResponder={() => true}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Seleccionar Fecha</Text>
              <TouchableOpacity
                onPress={() => setShowDatePicker(false)}
                style={styles.closeButton}
              >
                <Feather name="x" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <ScrollView 
              style={styles.dateList}
              showsVerticalScrollIndicator={true}
              persistentScrollbar={true}
            >
              {dates.map((dateItem) => (
                <TouchableOpacity
                  key={dateItem.dateString}
                  style={[
                    styles.dateItem,
                    dateItem.dateString === date && styles.selectedDateItem
                  ]}
                  onPress={() => handleDateSelect(dateItem.dateString)}
                >
                  <Text style={styles.dayName}>{dateItem.dayName}</Text>
                  <Text style={[
                    styles.dateItemText,
                    dateItem.dateString === date && styles.selectedDateText
                  ]}>
                    {dateItem.day}/{dateItem.month}/{dateItem.year}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#FFFFFF',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  dateText: {
    fontSize: 16,
    color: '#333333',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  pickerContainer: {
    width: width * 0.85,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    maxHeight: height * 0.7,
    minHeight: 300,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 5,
      },
      web: {
        // Specific styles for web
        boxShadow: '0px 2px 10px rgba(0, 0, 0, 0.25)',
      }
    }),
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 8,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  closeButton: {
    padding: 4,
  },
  dateList: {
    maxHeight: 350,
    minHeight: 200,
  },
  dateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  selectedDateItem: {
    backgroundColor: '#EBF5FF',
    borderRadius: 8,
  },
  dayName: {
    fontSize: 16,
    color: '#666666',
    textTransform: 'capitalize',
  },
  dateItemText: {
    fontSize: 16,
    color: '#333333',
  },
  selectedDateText: {
    fontWeight: 'bold',
    color: '#3B82F6',
  },
});

export default DatePicker;
