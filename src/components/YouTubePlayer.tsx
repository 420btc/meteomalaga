import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Linking, Image, Platform } from 'react-native';

interface YouTubePlayerProps {
  videoId: string;
  height?: number;
  width?: number;
  thumbnailUrl?: string;
}

const YouTubePlayer: React.FC<YouTubePlayerProps> = ({
  videoId,
  height = 200,
  width = '100%',
  thumbnailUrl
}) => {
  // For web platform, use a simple iframe
  if (Platform.OS === 'web') {
    return (
      <View style={[styles.container, { height, width }]}>
        <iframe
          width="100%"
          height="100%"
          src={`https://www.youtube.com/embed/${videoId}`}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title="YouTube video player"
        />
      </View>
    );
  }
  
  // For mobile platforms, show a static image with a button to open YouTube externally
  const thumbnail = thumbnailUrl || `https://i.ytimg.com/vi/${videoId}/maxresdefault_live.jpg`;
  
  return (
    <View style={[styles.container, { height, width }]}>
      <Image 
        source={{ uri: thumbnail }}
        style={styles.thumbnail}
        resizeMode="cover"
      />
      <View style={styles.overlay}>
        <Text style={styles.text}>
          Para ver este video en directo:
        </Text>
        <TouchableOpacity 
          style={styles.button}
          onPress={() => Linking.openURL(`https://www.youtube.com/watch?v=${videoId}`)}
        >
          <Text style={styles.buttonText}>Ver en YouTube</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000',
    overflow: 'hidden',
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  text: {
    color: '#FFFFFF',
    marginBottom: 15,
    textAlign: 'center',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#FF0000',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  }
});

export default YouTubePlayer;
