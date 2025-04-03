import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  ScrollView, 
  Platform, 
  SafeAreaView,
  Image,
  Linking
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import GradientBackground from '../components/GradientBackground';
import { Feather } from '@expo/vector-icons';
import RainHistoryChart from '../components/RainHistoryChart';

type RainHistoryScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'RainHistory'>;

// Sample historical data - in a real app, this would come from an API or database
const sampleHistoricalData = [
  { date: '2023-01-01', amount: 5 },
  { date: '2023-01-02', amount: 0 },
  { date: '2023-01-03', amount: 12 },
  { date: '2023-01-04', amount: 8 },
  { date: '2023-01-05', amount: 0 },
  { date: '2023-01-06', amount: 0 },
  { date: '2023-01-07', amount: 3 },
  { date: '2023-01-08', amount: 15 },
  { date: '2023-01-09', amount: 7 },
  { date: '2023-01-10', amount: 0 },
];

const RainHistoryScreen: React.FC = () => {
  const navigation = useNavigation<RainHistoryScreenNavigationProp>();
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('week');
  const [chartData, setChartData] = useState(sampleHistoricalData.slice(0, 7));
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  useEffect(() => {
    // In a real app, you would fetch data based on the selected time range
    switch (timeRange) {
      case 'week':
        setChartData(sampleHistoricalData.slice(0, 7));
        break;
      case 'month':
        setChartData(sampleHistoricalData);
        break;
      case 'year':
        // Generate some random data for the year view
        const yearData = Array.from({ length: 12 }, (_, i) => ({
          date: `2023-${(i + 1).toString().padStart(2, '0')}-01`,
          amount: Math.floor(Math.random() * 100)
        }));
        setChartData(yearData);
        break;
    }
  }, [timeRange]);

  const goBack = () => {
    navigation.goBack();
  };

  const toggleSection = (section: string) => {
    if (expandedSection === section) {
      setExpandedSection(null);
    } else {
      setExpandedSection(section);
    }
  };

  const renderSectionHeader = (title: string, section: string, icon: string) => (
    <TouchableOpacity 
      style={styles.sectionHeader} 
      onPress={() => toggleSection(section)}
      activeOpacity={0.7}
    >
      <View style={styles.sectionHeaderContent}>
        <Feather name={icon} size={20} color="#FFFFFF" style={styles.sectionIcon} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <Feather 
        name={expandedSection === section ? "chevron-up" : "chevron-down"} 
        size={20} 
        color="#FFFFFF" 
      />
    </TouchableOpacity>
  );

  const openBlogLink = () => {
    Linking.openURL("https://blogs.diariosur.es/tormentas-y-rayos/");
  };

  return (
    <GradientBackground colors={['#1E3A8A', '#60A5FA', '#87CEEB']}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity 
              onPress={goBack} 
              style={styles.backButton}
              accessibilityLabel="Volver atrás"
              accessibilityRole="button"
            >
              <Feather name="arrow-left" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Clima Histórico de Málaga</Text>
            <View style={styles.placeholder} />
          </View>

          <View style={styles.timeRangeSelector}>
            <TouchableOpacity
              style={[styles.timeRangeButton, timeRange === 'week' && styles.activeTimeRange]}
              onPress={() => setTimeRange('week')}
              accessibilityLabel="Ver datos de la semana"
              accessibilityRole="button"
            >
              <Text style={[styles.timeRangeText, timeRange === 'week' && styles.activeTimeRangeText]}>
                Semana
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.timeRangeButton, timeRange === 'month' && styles.activeTimeRange]}
              onPress={() => setTimeRange('month')}
              accessibilityLabel="Ver datos del mes"
              accessibilityRole="button"
            >
              <Text style={[styles.timeRangeText, timeRange === 'month' && styles.activeTimeRangeText]}>
                Mes
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.timeRangeButton, timeRange === 'year' && styles.activeTimeRange]}
              onPress={() => setTimeRange('year')}
              accessibilityLabel="Ver datos del año"
              accessibilityRole="button"
            >
              <Text style={[styles.timeRangeText, timeRange === 'year' && styles.activeTimeRangeText]}>
                Año
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <RainHistoryChart data={chartData} />
            
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {chartData.reduce((sum, item) => sum + item.amount, 0)}mm
                </Text>
                <Text style={styles.statLabel}>Total</Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {Math.max(...chartData.map(item => item.amount))}mm
                </Text>
                <Text style={styles.statLabel}>Máximo</Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {(chartData.reduce((sum, item) => sum + item.amount, 0) / chartData.length).toFixed(1)}mm
                </Text>
                <Text style={styles.statLabel}>Promedio</Text>
              </View>
            </View>
            
            <View style={styles.infoContainer}>
              <Text style={styles.infoTitle}>Datos Históricos de Málaga</Text>
              <Text style={styles.infoText}>
                Málaga tiene un clima mediterráneo con inviernos suaves y veranos calurosos. 
                La precipitación media anual es de aproximadamente 520mm, concentrada principalmente 
                entre octubre y abril. Los meses más lluviosos suelen ser noviembre y diciembre.
              </Text>
              
              {/* Blog link button */}
              <TouchableOpacity 
                style={styles.blogButton}
                onPress={openBlogLink}
                accessibilityLabel="Blog de Jose Luis Escudero Gallegos"
                accessibilityRole="link"
              >
                <Text style={styles.blogButtonText}>Blog de Jose Luis Escudero Gallegos</Text>
              </TouchableOpacity>
            </View>

            {/* Temperaturas Extremas */}
            {renderSectionHeader('Temperaturas Extremas', 'temperatures', 'thermometer')}
            {expandedSection === 'temperatures' && (
              <View style={styles.expandedSection}>
                <View style={styles.recordItem}>
                  <View style={[styles.iconContainer, { backgroundColor: '#FF5252' }]}>
                    <Feather name="thermometer" size={18} color="#FFFFFF" />
                  </View>
                  <View style={styles.recordContent}>
                    <Text style={styles.recordValue}>44.2°C</Text>
                    <Text style={styles.recordDescription}>
                      Temperatura máxima registrada (18 de julio de 1978)
                    </Text>
                  </View>
                </View>
                
                <View style={styles.recordItem}>
                  <View style={[styles.iconContainer, { backgroundColor: '#2196F3' }]}>
                    <Feather name="thermometer" size={18} color="#FFFFFF" />
                  </View>
                  <View style={styles.recordContent}>
                    <Text style={styles.recordValue}>-0.9°C</Text>
                    <Text style={styles.recordDescription}>
                      Temperatura mínima registrada (4 de febrero de 1954)
                    </Text>
                  </View>
                </View>

                <Text style={styles.sectionDescription}>
                  Las temperaturas en Málaga han mostrado una tendencia al alza en las últimas décadas, 
                  con veranos cada vez más calurosos y menos días de frío extremo.
                </Text>
              </View>
            )}

            {/* Olas de Calor */}
            {renderSectionHeader('Olas de Calor', 'heatwaves', 'sun')}
            {expandedSection === 'heatwaves' && (
              <View style={styles.expandedSection}>
                <View style={styles.recordItem}>
                  <View style={[styles.iconContainer, { backgroundColor: '#FF9800' }]}>
                    <Feather name="sun" size={18} color="#FFFFFF" />
                  </View>
                  <View style={styles.recordContent}>
                    <Text style={styles.recordValue}>10 días</Text>
                    <Text style={styles.recordDescription}>
                      Ola de calor más larga (5-14 de agosto de 2022), con pico de 42°C
                    </Text>
                  </View>
                </View>
                
                <View style={styles.recordItem}>
                  <View style={[styles.iconContainer, { backgroundColor: '#FF9800' }]}>
                    <Feather name="sun" size={18} color="#FFFFFF" />
                  </View>
                  <View style={styles.recordContent}>
                    <Text style={styles.recordValue}>15 vs 5</Text>
                    <Text style={styles.recordDescription}>
                      Olas de calor entre 2010-2024 vs 1980-1990
                    </Text>
                  </View>
                </View>

                <View style={styles.recordItem}>
                  <View style={[styles.iconContainer, { backgroundColor: '#FF9800' }]}>
                    <Feather name="sun" size={18} color="#FFFFFF" />
                  </View>
                  <View style={styles.recordContent}>
                    <Text style={styles.recordValue}>36°C</Text>
                    <Text style={styles.recordDescription}>
                      Temperatura media del verano más caluroso (2023)
                    </Text>
                  </View>
                </View>

                <Text style={styles.sectionDescription}>
                  Las olas de calor en Málaga se han vuelto más frecuentes e intensas en las últimas décadas, 
                  un claro indicador del cambio climático en la región mediterránea.
                </Text>
              </View>
            )}

            {/* Olas de Frío */}
            {renderSectionHeader('Olas de Frío', 'coldwaves', 'cloud-snow')}
            {expandedSection === 'coldwaves' && (
              <View style={styles.expandedSection}>
                <View style={styles.recordItem}>
                  <View style={[styles.iconContainer, { backgroundColor: '#2196F3' }]}>
                    <Feather name="cloud-snow" size={18} color="#FFFFFF" />
                  </View>
                  <View style={styles.recordContent}>
                    <Text style={styles.recordValue}>5 días</Text>
                    <Text style={styles.recordDescription}>
                      Ola de frío notable (20-24 de enero de 1985), con mínima de -0.5°C
                    </Text>
                  </View>
                </View>
                
                <View style={styles.recordItem}>
                  <View style={[styles.iconContainer, { backgroundColor: '#2196F3' }]}>
                    <Feather name="cloud-snow" size={18} color="#FFFFFF" />
                  </View>
                  <View style={styles.recordContent}>
                    <Text style={styles.recordValue}>3 vs 0</Text>
                    <Text style={styles.recordDescription}>
                      Olas de frío entre 1950-1980 vs ninguna desde 2000
                    </Text>
                  </View>
                </View>

                <View style={styles.recordItem}>
                  <View style={[styles.iconContainer, { backgroundColor: '#2196F3' }]}>
                    <Feather name="cloud-snow" size={18} color="#FFFFFF" />
                  </View>
                  <View style={styles.recordContent}>
                    <Text style={styles.recordValue}>6°C</Text>
                    <Text style={styles.recordDescription}>
                      Temperatura media del invierno más frío (1956)
                    </Text>
                  </View>
                </View>

                <Text style={styles.sectionDescription}>
                  Las olas de frío son cada vez menos frecuentes en Málaga, con un notable descenso 
                  en las últimas décadas, lo que refleja el calentamiento global en la región.
                </Text>
              </View>
            )}

            {/* Eventos Extremos */}
            {renderSectionHeader('Eventos Extremos', 'extremeevents', 'alert-triangle')}
            {expandedSection === 'extremeevents' && (
              <View style={styles.expandedSection}>
                <View style={styles.recordItem}>
                  <View style={[styles.iconContainer, { backgroundColor: '#673AB7' }]}>
                    <Feather name="cloud-lightning" size={18} color="#FFFFFF" />
                  </View>
                  <View style={styles.recordContent}>
                    <Text style={styles.recordValue}>15/09/1999</Text>
                    <Text style={styles.recordDescription}>
                      Tormenta severa con vientos de 25 m/s y 80 mm de lluvia
                    </Text>
                  </View>
                </View>
                
                <View style={styles.recordItem}>
                  <View style={[styles.iconContainer, { backgroundColor: '#2196F3' }]}>
                    <Feather name="droplet" size={18} color="#FFFFFF" />
                  </View>
                  <View style={styles.recordContent}>
                    <Text style={styles.recordValue}>23/11/1989</Text>
                    <Text style={styles.recordDescription}>
                      Inundación histórica con 150 mm de precipitación
                    </Text>
                  </View>
                </View>

                <View style={styles.recordItem}>
                  <View style={[styles.iconContainer, { backgroundColor: '#607D8B' }]}>
                    <Feather name="cloud-drizzle" size={18} color="#FFFFFF" />
                  </View>
                  <View style={styles.recordContent}>
                    <Text style={styles.recordValue}>10/05/2008</Text>
                    <Text style={styles.recordDescription}>
                      Granizada con granizo de hasta 30 mm de diámetro
                    </Text>
                  </View>
                </View>

                <View style={styles.recordItem}>
                  <View style={[styles.iconContainer, { backgroundColor: '#90CAF9' }]}>
                    <Feather name="cloud-snow" size={18} color="#FFFFFF" />
                  </View>
                  <View style={styles.recordContent}>
                    <Text style={styles.recordValue}>02/02/1954</Text>
                    <Text style={styles.recordDescription}>
                      Nevada rara con acumulación de 2 cm
                    </Text>
                  </View>
                </View>

                <View style={styles.recordItem}>
                  <View style={[styles.iconContainer, { backgroundColor: '#FF5722' }]}>
                    <Feather name="wind" size={18} color="#FFFFFF" />
                  </View>
                  <View style={styles.recordContent}>
                    <Text style={styles.recordValue}>07/11/2009</Text>
                    <Text style={styles.recordDescription}>
                      Tornado confirmado categoría EF1 con vientos de 150 km/h en Churriana
                    </Text>
                  </View>
                </View>

                <View style={styles.recordItem}>
                  <View style={[styles.iconContainer, { backgroundColor: '#3F51B5' }]}>
                    <Feather name="cloud-rain" size={18} color="#FFFFFF" />
                  </View>
                  <View style={styles.recordContent}>
                    <Text style={styles.recordValue}>06/10/1962</Text>
                    <Text style={styles.recordDescription}>
                      Tormenta intensa con 180 mm en 3 horas, causando desbordamiento del río Guadalmedina
                    </Text>
                  </View>
                </View>

                <View style={styles.recordItem}>
                  <View style={[styles.iconContainer, { backgroundColor: '#9C27B0' }]}>
                    <Feather name="cloud-lightning" size={18} color="#FFFFFF" />
                  </View>
                  <View style={styles.recordContent}>
                    <Text style={styles.recordValue}>14/09/2019</Text>
                    <Text style={styles.recordDescription}>
                      Supercelda con vientos de 28 m/s, 90 mm de lluvia y granizo de 20 mm
                    </Text>
                  </View>
                </View>

                <Text style={styles.sectionDescription}>
                  Los eventos meteorológicos extremos en Málaga han mostrado un aumento en intensidad 
                  en las últimas décadas, especialmente las lluvias torrenciales y las olas de calor.
                </Text>
              </View>
            )}

            {/* Precipitaciones */}
            {renderSectionHeader('Precipitaciones', 'precipitation', 'droplet')}
            {expandedSection === 'precipitation' && (
              <View style={styles.expandedSection}>
                <View style={styles.recordItem}>
                  <View style={[styles.iconContainer, { backgroundColor: '#2196F3' }]}>
                    <Feather name="droplet" size={18} color="#FFFFFF" />
                  </View>
                  <View style={styles.recordContent}>
                    <Text style={styles.recordValue}>1989</Text>
                    <Text style={styles.recordDescription}>
                      Año más lluvioso con 850 mm
                    </Text>
                  </View>
                </View>
                
                <View style={styles.recordItem}>
                  <View style={[styles.iconContainer, { backgroundColor: '#FF9800' }]}>
                    <Feather name="cloud-off" size={18} color="#FFFFFF" />
                  </View>
                  <View style={styles.recordContent}>
                    <Text style={styles.recordValue}>1995</Text>
                    <Text style={styles.recordDescription}>
                      Año más seco con 200 mm
                    </Text>
                  </View>
                </View>

                <View style={styles.recordItem}>
                  <View style={[styles.iconContainer, { backgroundColor: '#2196F3' }]}>
                    <Feather name="calendar" size={18} color="#FFFFFF" />
                  </View>
                  <View style={styles.recordContent}>
                    <Text style={styles.recordValue}>Noviembre 1989</Text>
                    <Text style={styles.recordDescription}>
                      Mes más lluvioso con 200 mm
                    </Text>
                  </View>
                </View>

                <View style={styles.recordItem}>
                  <View style={[styles.iconContainer, { backgroundColor: '#FF9800' }]}>
                    <Feather name="calendar" size={18} color="#FFFFFF" />
                  </View>
                  <View style={styles.recordContent}>
                    <Text style={styles.recordValue}>Julio 2005</Text>
                    <Text style={styles.recordDescription}>
                      Mes más seco con 0 mm
                    </Text>
                  </View>
                </View>

                <View style={styles.recordItem}>
                  <View style={[styles.iconContainer, { backgroundColor: '#2196F3' }]}>
                    <Feather name="trending-down" size={18} color="#FFFFFF" />
                  </View>
                  <View style={styles.recordContent}>
                    <Text style={styles.recordValue}>550 mm vs 450 mm</Text>
                    <Text style={styles.recordDescription}>
                      Promedio anual 1950-1980 vs 2010-2024
                    </Text>
                  </View>
                </View>

                <Text style={styles.sectionDescription}>
                  Las precipitaciones en Málaga muestran una tendencia a la baja en las últimas décadas, 
                  con una mayor concentración de lluvias intensas en períodos más cortos.
                </Text>
              </View>
            )}

            {/* Tendencias de Temperatura */}
            {renderSectionHeader('Tendencias de Temperatura', 'temptrends', 'trending-up')}
            {expandedSection === 'temptrends' && (
              <View style={styles.expandedSection}>
                <View style={styles.recordItem}>
                  <View style={[styles.iconContainer, { backgroundColor: '#FF5722' }]}>
                    <Feather name="trending-up" size={18} color="#FFFFFF" />
                  </View>
                  <View style={styles.recordContent}>
                    <Text style={styles.recordValue}>30°C vs 33°C</Text>
                    <Text style={styles.recordDescription}>
                      Temperatura máxima media de verano: 1950-1959 vs 2010-2019
                    </Text>
                  </View>
                </View>
                
                <View style={styles.recordItem}>
                  <View style={[styles.iconContainer, { backgroundColor: '#2196F3' }]}>
                    <Feather name="trending-up" size={18} color="#FFFFFF" />
                  </View>
                  <View style={styles.recordContent}>
                    <Text style={styles.recordValue}>8°C vs 10°C</Text>
                    <Text style={styles.recordDescription}>
                      Temperatura mínima media de invierno: 1960-1969 vs 2010-2019
                    </Text>
                  </View>
                </View>

                <Image 
                  source={{ uri: 'https://www.aemet.es/imagenes_gcd/eltiempo/observacion/climatologia/graficas_clima/g_clivar_anual_6155A_tm.gif' }} 
                  style={styles.trendImage}
                  resizeMode="contain"
                />

                <Text style={styles.sectionDescription}>
                  Las temperaturas en Málaga muestran una clara tendencia al alza, con un incremento 
                  de aproximadamente 1.5°C en las temperaturas medias desde mediados del siglo XX.
                </Text>
              </View>
            )}

            {/* Sequías */}
            {renderSectionHeader('Sequías', 'droughts', 'cloud-off')}
            {expandedSection === 'droughts' && (
              <View style={styles.expandedSection}>
                <View style={styles.recordItem}>
                  <View style={[styles.iconContainer, { backgroundColor: '#FF9800' }]}>
                    <Feather name="cloud-off" size={18} color="#FFFFFF" />
                  </View>
                  <View style={styles.recordContent}>
                    <Text style={styles.recordValue}>1991-1992</Text>
                    <Text style={styles.recordDescription}>
                      8 meses de sequía con 120 mm vs promedio de 300 mm
                    </Text>
                  </View>
                </View>
                
                <View style={styles.recordItem}>
                  <View style={[styles.iconContainer, { backgroundColor: '#FF9800' }]}>
                    <Feather name="cloud-off" size={18} color="#FFFFFF" />
                  </View>
                  <View style={styles.recordContent}>
                    <Text style={styles.recordValue}>2016-2017</Text>
                    <Text style={styles.recordDescription}>
                      6 meses de sequía con 150 mm
                    </Text>
                  </View>
                </View>

                <Text style={styles.sectionDescription}>
                  Las sequías en Málaga se han vuelto más frecuentes en las últimas décadas, 
                  con períodos más largos de escasez de precipitaciones, afectando a los recursos hídricos de la región.
                </Text>
              </View>
            )}

            {/* Vientos */}
            {renderSectionHeader('Vientos', 'winds', 'wind')}
            {expandedSection === 'winds' && (
              <View style={styles.expandedSection}>
                <View style={styles.recordItem}>
                  <View style={[styles.iconContainer, { backgroundColor: '#607D8B' }]}>
                    <Feather name="wind" size={18} color="#FFFFFF" />
                  </View>
                  <View style={styles.recordContent}>
                    <Text style={styles.recordValue}>30 m/s</Text>
                    <Text style={styles.recordDescription}>
                      Racha máxima registrada (12 de marzo de 1990)
                    </Text>
                  </View>
                </View>
                
                <View style={styles.recordItem}>
                  <View style={[styles.iconContainer, { backgroundColor: '#607D8B' }]}>
                    <Feather name="trending-up" size={18} color="#FFFFFF" />
                  </View>
                  <View style={styles.recordContent}>
                    <Text style={styles.recordValue}>4 m/s vs 5 m/s</Text>
                    <Text style={styles.recordDescription}>
                      Velocidad media anual: 1970 vs 2020
                    </Text>
                  </View>
                </View>

                <Text style={styles.sectionDescription}>
                  Los patrones de viento en Málaga han mostrado un ligero aumento en su intensidad media, 
                  aunque los eventos de vientos extremos no han aumentado significativamente.
                </Text>
              </View>
            )}

            {/* Días de Niebla y Soleados */}
            {renderSectionHeader('Días de Niebla y Soleados', 'fogdays', 'sun')}
            {expandedSection === 'fogdays' && (
              <View style={styles.expandedSection}>
                <View style={styles.recordItem}>
                  <View style={[styles.iconContainer, { backgroundColor: '#9E9E9E' }]}>
                    <Feather name="cloud" size={18} color="#FFFFFF" />
                  </View>
                  <View style={styles.recordContent}>
                    <Text style={styles.recordValue}>10 vs 5</Text>
                    <Text style={styles.recordDescription}>
                      Días de niebla por año: 1950 vs 2020
                    </Text>
                  </View>
                </View>
                
                <View style={styles.recordItem}>
                  <View style={[styles.iconContainer, { backgroundColor: '#FFC107' }]}>
                    <Feather name="sun" size={18} color="#FFFFFF" />
                  </View>
                  <View style={styles.recordContent}>
                    <Text style={styles.recordValue}>280 vs 290</Text>
                    <Text style={styles.recordDescription}>
                      Días soleados por año: 1950 vs 2020
                    </Text>
                  </View>
                </View>

                <Text style={styles.sectionDescription}>
                  Málaga ha experimentado una disminución en los días de niebla y un ligero aumento 
                  en los días soleados, reforzando su reputación como la "Costa del Sol".
                </Text>
              </View>
            )}

            {/* Eventos Notables */}
            {renderSectionHeader('Eventos Notables', 'notableevents', 'star')}
            {expandedSection === 'notableevents' && (
              <View style={styles.expandedSection}>
                <View style={styles.recordItem}>
                  <View style={[styles.iconContainer, { backgroundColor: '#795548' }]}>
                    <Feather name="cloud" size={18} color="#FFFFFF" />
                  </View>
                  <View style={styles.recordContent}>
                    <Text style={styles.recordValue}>15/03/2022</Text>
                    <Text style={styles.recordDescription}>
                      Ola de polvo sahariano con visibilidad menor a 1 km
                    </Text>
                  </View>
                </View>
                
                <View style={styles.recordItem}>
                  <View style={[styles.iconContainer, { backgroundColor: '#795548' }]}>
                    <Feather name="wind" size={18} color="#FFFFFF" />
                  </View>
                  <View style={styles.recordContent}>
                    <Text style={styles.recordValue}>20/04/1980</Text>
                    <Text style={styles.recordDescription}>
                      Tormenta de arena
                    </Text>
                  </View>
                </View>

                <View style={styles.recordItem}>
                  <View style={[styles.iconContainer, { backgroundColor: '#673AB7' }]}>
                    <Feather name="zap" size={18} color="#FFFFFF" />
                  </View>
                  <View style={styles.recordContent}>
                    <Text style={styles.recordValue}>03/08/1975</Text>
                    <Text style={styles.recordDescription}>
                      Tormenta eléctrica intensa con 500 rayos registrados en 2 horas
                    </Text>
                  </View>
                </View>

                <View style={styles.recordItem}>
                  <View style={[styles.iconContainer, { backgroundColor: '#2196F3' }]}>
                    <Feather name="cloud-rain" size={18} color="#FFFFFF" />
                  </View>
                  <View style={styles.recordContent}>
                    <Text style={styles.recordValue}>19/09/2012</Text>
                    <Text style={styles.recordDescription}>
                      Inundación por gota fría con 130 mm en 4 horas, afectando el centro de Málaga
                    </Text>
                  </View>
                </View>

                <View style={styles.recordItem}>
                  <View style={[styles.iconContainer, { backgroundColor: '#03A9F4' }]}>
                    <Feather name="droplet" size={18} color="#FFFFFF" />
                  </View>
                  <View style={styles.recordContent}>
                    <Text style={styles.recordValue}>29/12/1996</Text>
                    <Text style={styles.recordDescription}>
                      Récord de humedad: 98% durante 48 horas
                    </Text>
                  </View>
                </View>

                <Text style={styles.sectionDescription}>
                  Málaga ha experimentado diversos eventos meteorológicos notables a lo largo de su historia, 
                  algunos de los cuales han tenido importantes impactos en la ciudad y sus habitantes.
                </Text>
              </View>
            )}

            {/* Fenómenos Raros */}
            {renderSectionHeader('Fenómenos Raros', 'rarephenomena', 'cloud-lightning')}
            {expandedSection === 'rarephenomena' && (
              <View style={styles.expandedSection}>
                <View style={styles.recordItem}>
                  <View style={[styles.iconContainer, { backgroundColor: '#795548' }]}>
                    <Feather name="cloud-drizzle" size={18} color="#FFFFFF" />
                  </View>
                  <View style={styles.recordContent}>
                    <Text style={styles.recordValue}>25/02/2017</Text>
                    <Text style={styles.recordDescription}>
                      Lluvia de barro por polvo sahariano
                    </Text>
                  </View>
                </View>
                
                <View style={styles.recordItem}>
                  <View style={[styles.iconContainer, { backgroundColor: '#9C27B0' }]}>
                    <Feather name="sun" size={18} color="#FFFFFF" />
                  </View>
                  <View style={styles.recordContent}>
                    <Text style={styles.recordValue}>12/11/2005</Text>
                    <Text style={styles.recordDescription}>
                      Arcoíris doble tras una intensa tormenta
                    </Text>
                  </View>
                </View>

                <Text style={styles.sectionDescription}>
                  Además de los eventos meteorológicos más comunes, Málaga ha sido testigo de fenómenos 
                  atmosféricos poco frecuentes que han sorprendido a sus habitantes.
                </Text>
              </View>
            )}

            {/* Tornados */}
            {renderSectionHeader('Tornados en Málaga', 'tornados', 'wind')}
            {expandedSection === 'tornados' && (
              <View style={styles.expandedSection}>
                <View style={styles.recordItem}>
                  <View style={[styles.iconContainer, { backgroundColor: '#FF5722' }]}>
                    <Feather name="wind" size={18} color="#FFFFFF" />
                  </View>
                  <View style={styles.recordContent}>
                    <Text style={styles.recordValue}>07/11/2009</Text>
                    <Text style={styles.recordDescription}>
                      Tornado EF1 en Churriana con vientos de 150 km/h, causando daños en viviendas y vehículos
                    </Text>
                  </View>
                </View>
                
                <View style={styles.recordItem}>
                  <View style={[styles.iconContainer, { backgroundColor: '#FF5722' }]}>
                    <Feather name="wind" size={18} color="#FFFFFF" />
                  </View>
                  <View style={styles.recordContent}>
                    <Text style={styles.recordValue}>12/03/2018</Text>
                    <Text style={styles.recordDescription}>
                      Tornado EF0 en la costa este de Málaga, con vientos de 105 km/h
                    </Text>
                  </View>
                </View>

                <View style={styles.recordItem}>
                  <View style={[styles.iconContainer, { backgroundColor: '#FF5722' }]}>
                    <Feather name="wind" size={18} color="#FFFFFF" />
                  </View>
                  <View style={styles.recordContent}>
                    <Text style={styles.recordValue}>05/09/1999</Text>
                    <Text style={styles.recordDescription}>
                      Tromba marina que llegó a tierra en Torremolinos, causando daños menores
                    </Text>
                  </View>
                </View>

                <Text style={styles.sectionDescription}>
                  Aunque no son frecuentes, los tornados y trombas marinas han afectado ocasionalmente 
                  a Málaga y sus alrededores, generalmente asociados a fuertes tormentas y sistemas de baja presión.
                </Text>
              </View>
            )}

            {/* Fenómenos Climáticos Globales */}
            {renderSectionHeader('Fenómenos Climáticos Globales', 'globalclimate', 'globe')}
            {expandedSection === 'globalclimate' && (
              <View style={styles.expandedSection}>
                <View style={styles.recordItem}>
                  <View style={[styles.iconContainer, { backgroundColor: '#4CAF50' }]}>
                    <Feather name="globe" size={18} color="#FFFFFF" />
                  </View>
                  <View style={styles.recordContent}>
                    <Text style={styles.recordValue}>El Niño 1997-1998</Text>
                    <Text style={styles.recordDescription}>
                      Invierno inusualmente cálido y seco en Málaga, con temperaturas 2°C por encima de la media
                    </Text>
                  </View>
                </View>
                
                <View style={styles.recordItem}>
                  <View style={[styles.iconContainer, { backgroundColor: '#4CAF50' }]}>
                    <Feather name="globe" size={18} color="#FFFFFF" />
                  </View>
                  <View style={styles.recordContent}>
                    <Text style={styles.recordValue}>La Niña 2010-2011</Text>
                    <Text style={styles.recordDescription}>
                      Invierno más frío y lluvioso de lo normal, con 650 mm de precipitación entre noviembre y febrero
                    </Text>
                  </View>
                </View>

                <View style={styles.recordItem}>
                  <View style={[styles.iconContainer, { backgroundColor: '#4CAF50' }]}>
                    <Feather name="globe" size={18} color="#FFFFFF" />
                  </View>
                  <View style={styles.recordContent}>
                    <Text style={styles.recordValue}>NAO Negativa 2009-2010</Text>
                    <Text style={styles.recordDescription}>
                      Oscilación del Atlántico Norte que provocó un invierno excepcionalmente lluvioso en Málaga
                    </Text>
                  </View>
                </View>

                <Text style={styles.sectionDescription}>
                  Los fenómenos climáticos globales como El Niño, La Niña y la Oscilación del Atlántico Norte 
                  tienen una influencia significativa en el clima de Málaga, afectando los patrones de temperatura y precipitación.
                </Text>
              </View>
            )}
            
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Datos recopilados de AEMET y registros históricos
              </Text>
              <Text style={styles.footerText}>
                © 2024 Meteo Málaga
              </Text>
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Platform.OS === 'ios' ? 0 : 10,
    marginBottom: 16,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  headerTitle: {
    fontFamily: 'Arial',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  placeholder: {
    width: 40,
  },
  timeRangeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: 4,
  },
  timeRangeButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 16,
  },
  activeTimeRange: {
    backgroundColor: '#FFFFFF',
  },
  timeRangeText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  activeTimeRangeText: {
    color: '#3B82F6',
  },
  content: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  statItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 10,
    padding: 12,
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3B82F6',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
  },
  infoContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 10,
    padding: 12,
    marginVertical: 10,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    marginBottom: 12, // Added margin to separate text from button
  },
  // New styles for the blog button
  blogButton: {
    backgroundColor: '#FF0000', // Red color as requested
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 5,
  },
  blogButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'center',
  },
  sectionHeader: {
    backgroundColor: 'rgba(30, 58, 138, 0.8)',
    borderRadius: 10,
    padding: 12,
    marginVertical: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionIcon: {
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  expandedSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  recordItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  recordContent: {
    flex: 1,
  },
  recordValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
  },
  recordDescription: {
    fontSize: 13,
    color: '#666666',
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    marginTop: 10,
    fontStyle: 'italic',
  },
  trendImage: {
    width: '100%',
    height: 200,
    marginVertical: 10,
    borderRadius: 8,
  },
  footer: {
    marginTop: 20,
    marginBottom: 30,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
  },
});

export default RainHistoryScreen;
