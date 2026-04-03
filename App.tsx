import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, Dimensions, Alert } from 'react-native';
import { Camera, CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Camera as CameraIcon, RotateCcw, Share2, Shield, X, Scan, Zap } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');
const OVERLAY_WIDTH = width * 0.9;
const OVERLAY_HEIGHT = OVERLAY_WIDTH * 0.63; // ID Card ratio

export default function App() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [photo, setPhoto] = useState<string | null>(null);
  const [flash, setFlash] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Shield size={64} color="#007AFF" style={{ marginBottom: 20 }} />
        <Text style={styles.message}>Nous avons besoin de votre permission pour utiliser la caméra</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.button}>
          <Text style={styles.buttonText}>Autoriser la caméra</Text>
        </TouchableOpacity>
      </View>
    );
  }

  async function takePicture() {
    if (cameraRef.current) {
      try {
        const data = await cameraRef.current.takePictureAsync({
          quality: 1,
          base64: false,
          skipProcessing: false,
        });
        if (data) {
          setPhoto(data.uri);
        }
      } catch (e) {
        console.error(e);
        Alert.alert("Erreur", "Impossible de prendre la photo");
      }
    }
  }

  async function sharePhoto() {
    if (photo && (await Sharing.isAvailableAsync())) {
      await Sharing.shareAsync(photo);
    }
  }

  function reset() {
    setPhoto(null);
  }

  function toggleFlash() {
    setFlash(!flash);
  }

  return (
    <SafeAreaView style={styles.container}>
      {photo ? (
        <View style={styles.previewContainer}>
          <Text style={styles.title}>Scan Réussi</Text>
          <View style={styles.previewFrame}>
            {/* Simulation d'aperçu - à l'usage réel l'Image s'affiche ici */}
            <View style={[styles.idOverlay, { borderColor: '#4CAF50', borderStyle: 'solid' }]}>
               <Text style={{color: 'white'}}>Photo capturée</Text>
            </View>
          </View>
          
          <View style={styles.controls}>
            <TouchableOpacity onPress={reset} style={[styles.actionButton, {backgroundColor: '#FF3B30'}]}>
              <RotateCcw color="white" size={24} />
              <Text style={styles.actionText}>Reprendre</Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={sharePhoto} style={[styles.actionButton, {backgroundColor: '#007AFF'}]}>
              <Share2 color="white" size={24} />
              <Text style={styles.actionText}>Partager PDF</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.cameraContainer}>
          <CameraView 
            ref={cameraRef}
            style={styles.camera} 
            facing={facing}
            enableTorch={flash}
          >
            <View style={styles.overlay}>
              <View style={styles.topBar}>
                <Text style={styles.headerTitle}>Instant ID Scanner</Text>
                <TouchableOpacity onPress={toggleFlash}>
                  <Zap color={flash ? "#FFCC00" : "white"} size={28} />
                </TouchableOpacity>
              </View>

              <View style={styles.guideContainer}>
                <View style={styles.idOverlay}>
                  <View style={styles.cornerTopLeft} />
                  <View style={styles.cornerTopRight} />
                  <View style={styles.cornerBottomLeft} />
                  <View style={styles.cornerBottomRight} />
                </View>
                <Text style={styles.guideText}>Alignez votre carte d'identité dans le cadre</Text>
              </View>

              <View style={styles.bottomBar}>
                <View style={{ width: 44 }} />
                <TouchableOpacity onPress={takePicture} style={styles.shutterButton}>
                  <View style={styles.shutterInner} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setFacing(facing === 'back' ? 'front' : 'back')}>
                   <RotateCcw color="white" size={28} />
                </TouchableOpacity>
              </View>
            </View>
          </CameraView>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraContainer: {
    flex: 1,
    width: '100%',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'space-between',
    padding: 20,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  guideContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  idOverlay: {
    width: OVERLAY_WIDTH,
    height: OVERLAY_HEIGHT,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    borderStyle: 'dashed',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guideText: {
    color: 'white',
    marginTop: 20,
    fontSize: 16,
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    overflow: 'hidden',
  },
  cornerTopLeft: { position: 'absolute', top: -2, left: -2, width: 30, height: 30, borderTopWidth: 4, borderLeftWidth: 4, borderColor: '#007AFF', borderTopLeftRadius: 16 },
  cornerTopRight: { position: 'absolute', top: -2, right: -2, width: 30, height: 30, borderTopWidth: 4, borderRightWidth: 4, borderColor: '#007AFF', borderTopRightRadius: 16 },
  cornerBottomLeft: { position: 'absolute', bottom: -2, left: -2, width: 30, height: 30, borderBottomWidth: 4, borderLeftWidth: 4, borderColor: '#007AFF', borderBottomLeftRadius: 16 },
  cornerBottomRight: { position: 'absolute', bottom: -2, right: -2, width: 30, height: 30, borderBottomWidth: 4, borderRightWidth: 4, borderColor: '#007AFF', borderBottomRightRadius: 16 },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 40,
  },
  shutterButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shutterInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'white',
  },
  message: {
    color: 'white',
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 16,
    paddingHorizontal: 40,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  previewContainer: {
    flex: 1,
    width: '100%',
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  previewFrame: {
    width: OVERLAY_WIDTH,
    height: OVERLAY_HEIGHT,
    marginBottom: 40,
  },
  controls: {
    flexDirection: 'row',
    gap: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 10,
  },
  actionText: {
    color: 'white',
    fontWeight: 'bold',
  }
});
