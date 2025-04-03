import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  FlatList, 
  Image, 
  Dimensions,
  Platform
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import GradientBackground from '../components/GradientBackground';
import { Feather } from '@expo/vector-icons';

type CountrySelectionScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'CountrySelection'>;

interface Country {
  code: string;
  name: string;
  flagUrl: string;
}

const { width } = Dimensions.get('window');
const buttonSize = width / 3 - 30;

const countries: Country[] = [
  { code: 'es', name: 'España', flagUrl: 'https://flagpedia.net/data/flags/w160/es.png' },
  { code: 'fr', name: 'Francia', flagUrl: 'https://flagpedia.net/data/flags/w160/fr.png' },
  { code: 'de', name: 'Alemania', flagUrl: 'https://flagpedia.net/data/flags/w160/de.png' },
  { code: 'it', name: 'Italia', flagUrl: 'https://flagpedia.net/data/flags/w160/it.png' },
  { code: 'gb', name: 'Reino Unido', flagUrl: 'https://flagpedia.net/data/flags/w160/gb.png' },
  { code: 'pt', name: 'Portugal', flagUrl: 'https://flagpedia.net/data/flags/w160/pt.png' },
  { code: 'nl', name: 'Países Bajos', flagUrl: 'https://flagpedia.net/data/flags/w160/nl.png' },
  { code: 'be', name: 'Bélgica', flagUrl: 'https://flagpedia.net/data/flags/w160/be.png' },
  { code: 'ch', name: 'Suiza', flagUrl: 'https://flagpedia.net/data/flags/w160/ch.png' },
  { code: 'at', name: 'Austria', flagUrl: 'https://flagpedia.net/data/flags/w160/at.png' },
  { code: 'pl', name: 'Polonia', flagUrl: 'https://flagpedia.net/data/flags/w160/pl.png' },
  { code: 'ie', name: 'Irlanda', flagUrl: 'https://flagpedia.net/data/flags/w160/ie.png' },
];

const CountrySelectionScreen: React.FC = () => {
  const navigation = useNavigation<CountrySelectionScreenNavigationProp>();

  const goBack = () => {
    navigation.goBack();
  };

  const renderCountry = ({ item }: { item: Country }) => (
    <TouchableOpacity 
      style={styles.countryButton}
      onPress={() => navigation.navigate('BetScreen', { country: item.code, countryName: item.name })}
    >
      <Image source={{ uri: item.flagUrl }} style={styles.flagImage} />
      <Text style={styles.countryName}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <GradientBackground colors={['#1E3A8A', '#60A5FA', '#87CEEB']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={goBack} style={styles.backButton}>
            <Feather name="arrow-left" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Selecciona un país</Text>
          <View style={styles.placeholder} />
        </View>
        
        <FlatList 
          data={countries}
          renderItem={renderCountry}
          keyExtractor={(item) => item.code}
          numColumns={3}
          contentContainerStyle={styles.listContainer}
        />
      </View>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Platform.OS === 'ios' ? 40 : 20,
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontFamily: 'Arial',
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  placeholder: {
    width: 40,
  },
  listContainer: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  countryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    width: buttonSize,
    height: buttonSize,
    margin: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  flagImage: {
    width: 60,
    height: 40,
    resizeMode: 'contain',
    marginBottom: 10,
  },
  countryName: {
    fontFamily: 'Arial',
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  }
});

export default CountrySelectionScreen;
