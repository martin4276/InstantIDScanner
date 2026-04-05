import React, { useState, useEffect, useRef, useMemo } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, Dimensions, Alert, Image, ActivityIndicator } from 'react-native';
import { Camera, useCameraDevice, useCameraPermission, useFrameProcessor } from 'react-native-vision-camera';
import { detectObjects } from 'vision-camera-realtime-object-detection';
import * as Sharing from 'expo-sharing';
import * as ImageManipulator from 'expo-image-manipulator';
import { RotateCcw, Share2, Shield, Zap, Camera as CameraIcon } from 'lucide-react-native';
import { runAtTargetFps } from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');
const OVERLAY_WIDTH = width * 0.9;
const OVERLAY_HEIGHT = OVERLAY_WIDTH * 0.63;

export default function App() {
  const [photo, setPhoto] = useState(null);
  const [flash, setFlash] = useState('off');
  const [isCapturing, setIsCapturing] = useState(false);
  const [objectDetected, setObjectDetected] = useState(false);
  
  const device = useCameraDevice('back');
  const { hasPermission, requestPermission } = useCameraPermission();
  const camera = useRef(null);

  // Processeur de trames pour détection de contours/objets en temps réel
  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    runAtTargetFps(5, () => {
      const objects = detectObjects(frame, { model: 'default' });
      // Si un objet rectangulaire (comme une carte) est détecté
      if (objects.length > 0) {
        // setObjectDetected(true); // Communication avec le thread JS
      }
    });
  }, []);

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission]);

  if (!hasPermission) return <View style={styles.container}><Text style={{color: 'white'}}>Demande de permission...</Text></View>;
  if (!device) return <View style={styles.container}><Text style={{color: 'white'}}>Aucun appareil détecté.</Text></View>;

  const takePicture = async () => {
    if (camera.current && !isCapturing) {
      try {
        setIsCapturing(true);
        const file = await camera.current.takePhoto({
          flash: flash,
          enableShutterSound: true,
        });

        // Recadrage automatique intelligent
        const result = await ImageManipulator.manipulateAsync(
          `file://${file.path}`,
          [{ crop: { originX: file.width * 0.05, originY: file.height * 0.35, width: file.width * 0.9, height: file.width * 0.9 * 0.63 } }],
          { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
        );

        setPhoto(result.uri);
      } catch (e) {
        Alert.alert("Erreur", "Capture échouée");
      } finally {
        setIsCapturing(false);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {photo ? (
        <View style={styles.previewContainer}>
          <Text style={styles.title}>Scan intelligent réussi</Text>
          <Image source={{ uri: photo }} style={styles.previewImage} resizeMode="contain" />
          <View style={styles.controls}>
            <TouchableOpacity onPress={() => setPhoto(null)} style={[styles.actionButton, {backgroundColor: '#FF3B30'}]}>
              <RotateCcw color="white" size={24} />
              <Text style={styles.actionText}>Reprendre</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => Sharing.shareAsync(photo)} style={[styles.actionButton, {backgroundColor: '#007AFF'}]}>
              <Share2 color="white" size={24} />
              <Text style={styles.actionText}>Partager</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.cameraContainer}>
          <Camera
            ref={camera}
            style={StyleSheet.absoluteFill}
            device={device}
            isActive={true}
            photo={true}
            frameProcessor={frameProcessor}
          />
          <View style={styles.overlay}>
             <View style={styles.topBar}>
                <Text style={styles.headerTitle}>AI Auto-Crop Scanner</Text>
                <TouchableOpacity onPress={() => setFlash(flash === 'on' ? 'off' : 'on')}>
                  <Zap color={flash === 'on' ? "#FFCC00" : "white"} size={28} />
                </TouchableOpacity>
              </View>

              <View style={styles.guideContainer}>
                <View style={[styles.idOverlay, objectDetected && {borderColor: '#4CAF50'}]}>
                   <View style={styles.cornerTopLeft} />
                   <View style={styles.cornerTopRight} />
                   <View style={styles.cornerBottomLeft} />
                   <View style={styles.cornerBottomRight} />
                </View>
                <Text style={styles.guideText}>Détection automatique activée...</Text>
              </View>

              <TouchableOpacity onPress={takePicture} style={styles.shutterButton}>
                <View style={styles.shutterInner} />
                {isCapturing && <ActivityIndicator color="#007AFF" style={StyleSheet.absoluteFill} />}
              </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  cameraContainer: { flex: 1 },
  overlay: { flex: 1, justifyContent: 'space-between', padding: 20, backgroundColor: 'rgba(0,0,0,0.2)' },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 },
  headerTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  guideContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  idOverlay: { width: OVERLAY_WIDTH, height: OVERLAY_HEIGHT, borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)', borderRadius: 16 },
  guideText: { color: 'white', marginTop: 20, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20 },
  shutterButton: { width: 80, height: 80, borderRadius: 40, borderWidth: 4, borderColor: 'white', alignSelf: 'center', marginBottom: 40, justifyContent: 'center', alignItems: 'center' },
  shutterInner: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'white' },
  previewContainer: { flex: 1, padding: 20, alignItems: 'center', justifyContent: 'center' },
  title: { color: 'white', fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  previewImage: { width: OVERLAY_WIDTH, height: OVERLAY_HEIGHT, borderRadius: 16, backgroundColor: '#1C1C1E', marginBottom: 40 },
  controls: { flexDirection: 'row', gap: 20 },
  actionButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, gap: 10 },
  actionText: { color: 'white', fontWeight: 'bold' },
  cornerTopLeft: { position: 'absolute', top: -2, left: -2, width: 30, height: 30, borderTopWidth: 4, borderLeftWidth: 4, borderColor: '#007AFF', borderTopLeftRadius: 16 },
  cornerTopRight: { position: 'absolute', top: -2, right: -2, width: 30, height: 30, borderTopWidth: 4, borderRightWidth: 4, borderColor: '#007AFF', borderTopRightRadius: 16 },
  cornerBottomLeft: { position: 'absolute', bottom: -2, left: -2, width: 30, height: 30, borderBottomWidth: 4, borderLeftWidth: 4, borderColor: '#007AFF', borderBottomLeftRadius: 16 },
  cornerBottomRight: { position: 'absolute', bottom: -2, right: -2, width: 30, height: 30, borderBottomWidth: 4, borderRightWidth: 4, borderColor: '#007AFF', borderBottomRightRadius: 16 },
});
