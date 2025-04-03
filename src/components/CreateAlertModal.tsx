import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ScrollView
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { AlertType, AlertCondition, UserAlert } from '../types/alerts';
import { createAlert } from '../services/alertService';

interface CreateAlertModalProps {
  visible: boolean;
  onClose: () => void;
  onAlertCreated: (alert: UserAlert) => void;
}

const CreateAlertModal: React.FC<CreateAlertModalProps> = ({
  visible,
  onClose,
  onAlertCreated
}) => {
  const [alertName, setAlertName] = useState('');
  const [alertType, setAlertType] = useState<AlertType>('temperature');
  const [condition, setCondition] = useState<AlertCondition>('above');
  const [threshold, setThreshold] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleCreateAlert = async () => {
    try {
      // Validate inputs
      if (!alertName.trim()) {
        setError('Por favor, introduce un nombre para la alerta');
        return;
      }

      if (!threshold || isNaN(Number(threshold))) {
        setError('Por favor, introduce un valor numérico válido');
        return;
      }

      // Create the alert
      const newAlert = await createAlert({
        type: alertType,
        condition,
        threshold: Number(threshold),
        active: true,
        name: alertName.trim()
      });

      // Notify parent component
      onAlertCreated(newAlert);
      
      // Reset form
      resetForm();
      
      // Close modal
      onClose();
    } catch (error) {
      console.error('Error creating alert:', error);
      setError('Error al crear la alerta. Inténtalo de nuevo.');
    }
  };

  const resetForm = () => {
    setAlertName('');
    setAlertType('temperature');
    setCondition('above');
    setThreshold('');
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Crear Nueva Alerta</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Feather name="x" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <View style={styles.formGroup}>
              <Text style={styles.label}>Nombre de la alerta</Text>
              <TextInput
                style={styles.input}
                value={alertName}
                onChangeText={setAlertName}
                placeholder="Ej: Alerta de calor"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Tipo de alerta</Text>
              <View style={styles.buttonGroup}>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    alertType === 'temperature' && styles.activeButton
                  ]}
                  onPress={() => setAlertType('temperature')}
                >
                  <Feather name="thermometer" size={16} color="#FFFFFF" />
                  <Text style={styles.buttonText}>Temperatura</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    alertType === 'rain' && styles.activeButton
                  ]}
                  onPress={() => setAlertType('rain')}
                >
                  <Feather name="cloud-rain" size={16} color="#FFFFFF" />
                  <Text style={styles.buttonText}>Lluvia</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Condición</Text>
              <View style={styles.buttonGroup}>
                <TouchableOpacity
                  style={[
                    styles.conditionButton,
                    condition === 'above' && styles.activeButton
                  ]}
                  onPress={() => setCondition('above')}
                >
                  <Feather name="arrow-up" size={16} color="#FFFFFF" />
                  <Text style={styles.buttonText}>Por encima</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.conditionButton,
                    condition === 'below' && styles.activeButton
                  ]}
                  onPress={() => setCondition('below')}
                >
                  <Feather name="arrow-down" size={16} color="#FFFFFF" />
                  <Text style={styles.buttonText}>Por debajo</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.conditionButton,
                    condition === 'equals' && styles.activeButton
                  ]}
                  onPress={() => setCondition('equals')}
                >
                  <Feather name="minus" size={16} color="#FFFFFF" />
                  <Text style={styles.buttonText}>Igual</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>
                {alertType === 'temperature' ? 'Temperatura (°C)' : 'Lluvia (mm)'}
              </Text>
              <TextInput
                style={styles.input}
                value={threshold}
                onChangeText={setThreshold}
                placeholder={alertType === 'temperature' ? "Ej: 30" : "Ej: 5"}
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                keyboardType="numeric"
              />
            </View>

            <TouchableOpacity
              style={styles.createButton}
              onPress={handleCreateAlert}
            >
              <Text style={styles.createButtonText}>Crear Alerta</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#0F172A',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'android' ? 'sans-serif-medium' : 'Arial',
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    padding: 16,
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    fontFamily: Platform.OS === 'android' ? 'sans-serif' : 'Arial',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 8,
    fontFamily: Platform.OS === 'android' ? 'sans-serif' : 'Arial',
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: Platform.OS === 'android' ? 'sans-serif' : 'Arial',
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginRight: 8,
  },
  conditionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginRight: 8,
  },
  activeButton: {
    backgroundColor: '#3B82F6',
  },
  buttonText: {
    color: '#FFFFFF',
    marginLeft: 4,
    fontSize: 14,
    fontFamily: Platform.OS === 'android' ? 'sans-serif' : 'Arial',
  },
  createButton: {
    backgroundColor: '#10B981',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'android' ? 'sans-serif-medium' : 'Arial',
  },
});

export default CreateAlertModal;
