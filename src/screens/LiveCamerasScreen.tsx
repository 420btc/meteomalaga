import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  FlatList, 
  Image, 
  Linking, 
  SafeAreaView, 
  Platform,
  ActivityIndicator,
  Dimensions,
  RefreshControl
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import GradientBackground from '../components/GradientBackground';
import { Feather } from '@expo/vector-icons';
import WebViewFallback from '../components/WebViewFallback';
import YouTubePlayer from '../components/YouTubePlayer';

type LiveCamerasScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'LiveCameras'>;

interface Webcam {
  id: string;
  title: string;
  url: string;
  thumbnail: string;
  location: string;
  player?: string;
  isLive: boolean;
  featured?: boolean;
  type?: 'youtube' | 'webview';
  youtubeId?: string;
}

const { width } = Dimensions.get('window');

const LiveCamerasScreen: React.FC = () => {
  const navigation = useNavigation<LiveCamerasScreenNavigationProp>();
  const [webcams, setWebcams] = useState<Webcam[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedWebcam, setSelectedWebcam] = useState<Webcam | null>(null);

  useEffect(() => {
    fetchWebcams();
  }, []);

  const fetchWebcams = async () => {
    try {
      setLoading(true);
      
      // Using fallback data instead of API to ensure it works in all environments
      setWebcams(getFallbackWebcams());
    } catch (error) {
      console.error('Error fetching webcams:', error);
      setWebcams(getFallbackWebcams());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getFallbackWebcams = (): Webcam[] => {
    return [
      {
        id: '0',
        title: 'Playa de la Malagueta',
        url: 'https://www.youtube.com/watch?v=4CaHlfpGlAI',
        thumbnail: 'https://i.ytimg.com/vi/4CaHlfpGlAI/maxresdefault_live.jpg',
        location: 'Málaga',
        isLive: true,
        featured: true,
        type: 'youtube',
        youtubeId: '4CaHlfpGlAI'
      },
      {
        id: '1',
        title: 'Puerto de Málaga',
        url: 'https://www.youtube.com/watch?v=qVpEwuoIUzc',
        thumbnail: 'https://i.ytimg.com/vi/qVpEwuoIUzc/maxresdefault_live.jpg',
        location: 'Málaga',
        isLive: true,
        type: 'youtube',
        youtubeId: 'qVpEwuoIUzc'
      },
      {
        id: '2',
        title: 'Playa Fuengirola',
        url: 'https://www.youtube.com/watch?v=oxhDDuCZMVU',
        thumbnail: 'https://i.ytimg.com/vi/oxhDDuCZMVU/maxresdefault_live.jpg',
        location: 'Fuengirola',
        isLive: true,
        type: 'youtube',
        youtubeId: 'oxhDDuCZMVU'
      },
      {
        id: '3',
        title: 'Benalmádena - Málaga',
        url: 'https://www.skylinewebcams.com/en/webcam/espana/andalucia/malaga/benalmadena.html',
        thumbnail: 'https://embed.skylinewebcams.com/img/956.jpg',
        location: 'Benalmádena',
        isLive: true,
        type: 'webview'
      },
      {
        id: '4',
        title: 'Málaga - Costa del Sol',
        url: 'https://www.skylinewebcams.com/en/webcam/espana/andalucia/malaga/costa-del-sol.html',
        thumbnail: 'https://embed.skylinewebcams.com/img/4401.jpg',
        location: 'Costa del Sol',
        isLive: true,
        type: 'webview'
      }
    ];
  };

  const goBack = () => {
    navigation.goBack();
  };

  const openWebcam = (webcam: Webcam) => {
    if (webcam.type === 'youtube') {
      if (Platform.OS === 'web') {
        setSelectedWebcam(webcam);
      } else {
        // On mobile, directly open YouTube links
        Linking.openURL(webcam.url);
      }
    } else {
      // For non-YouTube webcams, just open the URL
      Linking.openURL(webcam.url);
    }
  };

  const closeWebcam = () => {
    setSelectedWebcam(null);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchWebcams();
  };

  const renderFeaturedWebcam = () => {
    const featuredWebcam = webcams.find(webcam => webcam.featured);
    
    if (!featuredWebcam) return null;
    
    return (
      <View style={styles.featuredContainer}>
        <Text style={styles.featuredTitle}>Cámara Destacada</Text>
        <TouchableOpacity 
          style={styles.featuredWebcamItem} 
          onPress={() => openWebcam(featuredWebcam)}
          accessibilityLabel={`Cámara en vivo de ${featuredWebcam.title}`}
          accessibilityRole="button"
        >
          <Image 
            source={{ uri: featuredWebcam.thumbnail }} 
            style={styles.featuredThumbnail}
            accessibilityLabel={`Vista previa de ${featuredWebcam.title}`}
          />
          <View style={styles.featuredOverlay}>
            <View style={styles.featuredInfo}>
              <Text style={styles.featuredWebcamTitle}>{featuredWebcam.title}</Text>
              <Text style={styles.featuredWebcamLocation}>
                <Feather name="map-pin" size={14} color="#FFFFFF" /> {featuredWebcam.location}
              </Text>
              <View style={styles.featuredLiveIndicator}>
                <View style={styles.liveIndicatorDot} />
                <Text style={styles.liveIndicatorText}>EN VIVO</Text>
              </View>
            </View>
            <View style={styles.playButtonContainer}>
              <View style={styles.playButton}>
                <Feather name="play" size={24} color="#FFFFFF" />
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  const renderWebcamItem = ({ item }: { item: Webcam }) => {
    // Skip the featured webcam in the regular list
    if (item.featured) return null;
    
    return (
      <TouchableOpacity 
        style={styles.webcamItem} 
        onPress={() => openWebcam(item)}
        accessibilityLabel={`Cámara en vivo de ${item.title}`}
        accessibilityRole="button"
      >
        <Image 
          source={{ uri: item.thumbnail }} 
          style={styles.thumbnail}
          accessibilityLabel={`Vista previa de ${item.title}`}
        />
        <View style={styles.webcamInfo}>
          <Text style={styles.webcamTitle}>{item.title}</Text>
          <Text style={styles.webcamLocation}>
            <Feather name="map-pin" size={12} color="#6B7280" /> {item.location}
          </Text>
          <View style={styles.liveIndicator}>
            <View style={styles.liveIndicatorDot} />
            <Text style={styles.liveIndicatorText}>EN VIVO</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Only render modal on web platform for YouTube videos
  const renderWebModal = () => {
    if (!selectedWebcam || Platform.OS !== 'web') return null;

    return (
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{selectedWebcam.title}</Text>
            <TouchableOpacity onPress={closeWebcam} style={styles.closeButton}>
              <Feather name="x" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          
          {selectedWebcam.type === 'youtube' && selectedWebcam.youtubeId ? (
            <YouTubePlayer 
              videoId={selectedWebcam.youtubeId} 
              height={250}
              thumbnailUrl={selectedWebcam.thumbnail}
            />
          ) : (
            <View style={styles.webFallbackContainer}>
              <Text style={styles.webFallbackText}>
                Para ver esta cámara, haz clic en el siguiente enlace:
              </Text>
              <TouchableOpacity 
                onPress={() => Linking.openURL(selectedWebcam.url)}
                style={styles.webFallbackButton}
              >
                <Text style={styles.webFallbackButtonText}>Abrir cámara en nueva ventana</Text>
              </TouchableOpacity>
            </View>
          )}
          
          <Text style={styles.modalLocation}>
            <Feather name="map-pin" size={14} color="#FFFFFF" /> {selectedWebcam.location}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <GradientBackground colors={['#1E3A8A', '#60A5FA']}>
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
            <Text style={styles.headerTitle}>Cámaras en Vivo</Text>
            <TouchableOpacity 
              style={styles.refreshButton}
              onPress={onRefresh}
              disabled={refreshing}
            >
              {refreshing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Feather name="refresh-cw" size={20} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
          
          <Text style={styles.subtitle}>
            Observa el clima actual en diferentes puntos de Málaga
          </Text>
          
          {loading && !refreshing ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FFFFFF" />
              <Text style={styles.loadingText}>Cargando cámaras...</Text>
            </View>
          ) : (
            <FlatList
              data={webcams}
              keyExtractor={(item) => item.id}
              renderItem={renderWebcamItem}
              contentContainerStyle={styles.listContainer}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={["#FFFFFF"]}
                  tintColor="#FFFFFF"
                />
              }
              ListHeaderComponent={renderFeaturedWebcam}
            />
          )}
          
          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>
              Pulsa en cualquier cámara para ver la transmisión en vivo. Las imágenes se actualizan en tiempo real.
            </Text>
          </View>
        </View>
      </SafeAreaView>

      {/* Webcam player modal - only on web for YouTube */}
      {renderWebModal()}
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: { 
    flex: 1, 
    padding: 16 
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginTop: Platform.OS === 'ios' ? 0 : 10, 
    marginBottom: 16 
  },
  backButton: { 
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  refreshButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { 
    fontFamily: 'Arial', 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#FFFFFF' 
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 16,
    fontSize: 16,
  },
  listContainer: {
    paddingBottom: 20,
  },
  featuredContainer: {
    marginBottom: 20,
  },
  featuredTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  featuredWebcamItem: {
    borderRadius: 12,
    overflow: 'hidden',
    height: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  featuredThumbnail: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  featuredOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    padding: 16,
    justifyContent: 'space-between',
    flexDirection: 'row',
  },
  featuredInfo: {
    justifyContent: 'flex-end',
  },
  featuredWebcamTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  featuredWebcamLocation: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  featuredLiveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.7)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  playButtonContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(59, 130, 246, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  webcamItem: { 
    backgroundColor: 'rgba(255,255,255,0.9)', 
    borderRadius: 12, 
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  thumbnail: { 
    width: '100%', 
    height: 160, 
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  webcamInfo: {
    padding: 12,
  },
  webcamTitle: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: '#333',
    marginBottom: 4,
  },
  webcamLocation: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  liveIndicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    marginRight: 6,
  },
  liveIndicatorText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#EF4444',
  },
  infoContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
    marginBottom: 16,
  },
  infoText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  modalContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    width: '90%',
    height: '70%',
    backgroundColor: '#1E3A8A',
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  modalTitle: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  closeButton: {
    padding: 4,
  },
  webView: {
    flex: 1,
    backgroundColor: '#000000',
  },
  webViewLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  modalLocation: {
    color: '#FFFFFF',
    fontSize: 12,
    padding: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  webFallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  webFallbackText: {
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
  },
  webFallbackButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  webFallbackButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  }
});

export default LiveCamerasScreen;
