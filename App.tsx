import React, { useState, useRef, useEffect } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Platform,
  PermissionsAndroid,
  ScrollView,
  Alert,
} from 'react-native';
import {
  ClientRoleType,
  createAgoraRtcEngine,
  ChannelProfileType,
  RtcSurfaceView,
  RenderModeType, // Import RenderModeType for better video scaling
} from 'react-native-agora';

// --- 1. PASTE FRESH TOKENS HERE ---
const APP_ID = '4a75f775a2a6427792d534a048ae00a2';
const CHANNEL_NAME = 'testing';

// --- User 1 Data ---
const USER_1_UID = 1001;
const USER_1_TOKEN =
  '007eJxTYNiVx5n6tLCFa8fh9WWMz+tCg4rFJoTMtsvh8qzo6ms5zazAYJJobppmbm6aaJRoZmJkbm5plGJqbJJoYGKRmGpgkGik9so7oyGQkWHqjdvMjAwQCOKzM5SkFpdk5qUzMAAAJDYfMw=='; // 👈 PASTE A FRESH TOKEN

// --- User 2 Data ---
const USER_2_UID = 1002;
const USER_2_TOKEN =
  '007eJxTYJASO/lww0q2imgv2dILP7we/dMpr/hvsIJv1pONj5/0RN9RYDBJNDdNMzc3TTRKNDMxMje3NEoxNTZJNDCxSEw1MEg0OvTeO6MhkJHh/r06VkYGCATx2RlKUotLMvPSGRgAQ6YjTg=='; // 👈 PASTE A FRESH TOKEN

const App = () => {
  const [isJoined, setIsJoined] = useState(false);
  const [remoteUids, setRemoteUids] = useState([]);
  const agoraEngineRef = useRef(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isEngineReady, setIsEngineReady] = useState(false);
  const [isFrontCamera, setIsFrontCamera] = useState(true);
  const [isCameraEnabled, setIsCameraEnabled] = useState(true);
  const [isMicEnabled, setIsMicEnabled] = useState(true);

  // ### 1. SETUP ENGINE ON MOUNT, RELEASE ON UNMOUNT ###
  // This useEffect runs only once to initialize and release the engine.
  useEffect(() => {
    const init = async () => {
      // Create and initialize the engine
      await setupVideoSDKEngine();
    };

    init();

    // Cleanup function to release the engine when the component unmounts
    return () => {
      if (agoraEngineRef.current) {
        console.log('[cleanup] Releasing Agora engine...');
        agoraEngineRef.current.release();
        agoraEngineRef.current = null;
      }
    };
  }, []); // Empty dependency array ensures this runs only once

  const setupVideoSDKEngine = async () => {
    try {
      console.log('[setupVideoSDKEngine] Starting setup...');
      if (Platform.OS === 'android') {
        await getPermission();
      }

      agoraEngineRef.current = createAgoraRtcEngine();
      const agoraEngine = agoraEngineRef.current;

      agoraEngine.addListener('onJoinChannelSuccess', () => {
        console.log('✅ Successfully joined channel.');
        setIsJoined(true);
      });

      agoraEngine.addListener('onUserJoined', (_, remoteUid) => {
        console.log(`✅ Remote user ${remoteUid} has joined.`);
        setRemoteUids(prevUids => [...prevUids, remoteUid]);
      });

      agoraEngine.addListener('onUserOffline', (_, remoteUid) => {
        console.log(`✅ Remote user ${remoteUid} has left.`);
        setRemoteUids(prevUids => prevUids.filter(uid => uid !== remoteUid));
      });

      agoraEngine.addListener('onLeaveChannel', () => {
        console.log('✅ You have left the channel.');
        setIsJoined(false);
        setRemoteUids([]);
      });

      agoraEngine.addListener('onError', (err, msg) => {
        console.error(`❌ Agora SDK Error (Code: ${err}): ${msg}`);
      });

      console.log('[setupVideoSDKEngine] Initializing...');
      await agoraEngine.initialize({ appId: APP_ID });

      console.log('[setupVideoSDKEngine] Enabling video and audio...');
      await agoraEngine.enableVideo();
      await agoraEngine.enableAudio();

      console.log('[setupVideoSDKEngine] Setting channel profile...');
      await agoraEngine.setChannelProfile(
        ChannelProfileType.ChannelProfileLiveBroadcasting,
      );

      console.log('[setupVideoSDKEngine] Starting preview...');
      await agoraEngine.startPreview(); // Start local video preview

      console.log('✅ Engine setup complete.');
      setIsEngineReady(true);
    } catch (e) {
      console.error('[setupVideoSDKEngine] A critical error occurred:', e);
    }
  };

  // ### 2. SIMPLIFIED USER SWITCHING ###
  // This function now only handles leaving the channel if necessary
  // before setting the new user.
  const selectUser = async user => {
    console.log(`[selectUser] Switching to user: ${user.uid}`);

    // If already in a channel, leave before switching user
    if (isJoined) {
      await leave();
    }

    // Set the new current user
    setCurrentUser(user);
  };

  const join = async () => {
    if (!currentUser) {
      Alert.alert('Please select a user first.');
      return;
    }
    if (!isEngineReady || !agoraEngineRef.current) {
      Alert.alert('Engine not ready, please wait.');
      return;
    }
    if (isJoined) {
      return;
    }

    try {
      console.log(`[join] Setting client role...`);
      await agoraEngineRef.current.setClientRole(
        ClientRoleType.ClientRoleBroadcaster,
      );

      console.log(
        `[join] Joining channel "${CHANNEL_NAME}" as UID ${currentUser.uid}...`,
      );
      await agoraEngineRef.current.joinChannel(
        currentUser.token,
        CHANNEL_NAME,
        currentUser.uid,
        {},
      );
    } catch (e) {
      console.error('[join] An error occurred:', e);
      Alert.alert('Join Failed', e.toString());
    }
  };

  const leave = async () => {
    if (!isJoined || !agoraEngineRef.current) {
      return;
    }
    try {
      await agoraEngineRef.current.leaveChannel();
      console.log('[leave] Successfully left channel.');
    } catch (error) {
      console.error('[leave] Error leaving channel:', error);
    }
  };

  // --- Media Controls (No significant changes needed) ---

  const switchCamera = async () => {
    if (!agoraEngineRef.current) return;
    try {
      await agoraEngineRef.current.switchCamera();
      setIsFrontCamera(prev => !prev);
    } catch (error) {
      console.error('[switchCamera] Error:', error);
    }
  };

  const toggleCamera = async () => {
    if (!agoraEngineRef.current) return;
    try {
      await agoraEngineRef.current.enableLocalVideo(!isCameraEnabled);
      setIsCameraEnabled(prev => !prev);
    } catch (error) {
      console.error('[toggleCamera] Error:', error);
    }
  };

  const toggleMic = async () => {
    if (!agoraEngineRef.current) return;
    try {
      await agoraEngineRef.current.enableLocalAudio(!isMicEnabled);
      setIsMicEnabled(prev => !prev);
    } catch (error) {
      console.error('[toggleMic] Error:', error);
    }
  };

  // ### UI RENDERING (with a small fix) ###
  return (
    <SafeAreaView style={styles.main}>
      <Text style={styles.head}>Agora Multi-User Test</Text>

      {/* User Selection */}
      <View style={styles.userSelector}>
        <TouchableOpacity
          style={[
            styles.button,
            currentUser?.uid === USER_1_UID && styles.selectedButton,
          ]}
          onPress={() => selectUser({ uid: USER_1_UID, token: USER_1_TOKEN })}
        >
          <Text style={styles.buttonText}>Login as User {USER_1_UID}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.button,
            currentUser?.uid === USER_2_UID && styles.selectedButton,
          ]}
          onPress={() => selectUser({ uid: USER_2_UID, token: USER_2_TOKEN })}
        >
          <Text style={styles.buttonText}>Login as User {USER_2_UID}</Text>
        </TouchableOpacity>
      </View>

      {currentUser ? (
        <>
          <Text style={styles.infoText}>
            Logged in as User: {currentUser.uid}
          </Text>
          <Text style={styles.statusText}>
            Engine: {isEngineReady ? 'Ready' : 'Initializing...'} | Channel:{' '}
            {isJoined ? 'Connected' : 'Disconnected'}
          </Text>

          {/* Join/Leave Controls */}
          <View style={styles.btnContainer}>
            <TouchableOpacity
              onPress={join}
              style={[
                styles.button,
                (!isEngineReady || isJoined) && styles.disabledButton,
              ]}
              disabled={!isEngineReady || isJoined}
            >
              <Text style={styles.buttonText}>Join</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={leave}
              style={[styles.button, !isJoined && styles.disabledButton]}
              disabled={!isJoined}
            >
              <Text style={styles.buttonText}>Leave</Text>
            </TouchableOpacity>
          </View>

          {/* Media Controls */}
          <View style={styles.controlsContainer}>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={switchCamera}
              disabled={!isEngineReady}
            >
              <Text style={styles.controlButtonText}>📱 Switch</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={toggleCamera}
              disabled={!isEngineReady}
            >
              <Text style={styles.controlButtonText}>
                {isCameraEnabled ? '📹 ON' : '📹 OFF'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={toggleMic}
              disabled={!isEngineReady}
            >
              <Text style={styles.controlButtonText}>
                {isMicEnabled ? '🎤 ON' : '🎤 OFF'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Video Views */}
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            {/* Local Video */}
            <Text style={styles.videoLabel}>Local Video (You)</Text>
            <View style={styles.videoContainer}>
              {isEngineReady && (
                <RtcSurfaceView
                  style={styles.videoView}
                  canvas={{ uid: 0 }}
                  // ### 3. ADDED RENDER MODE ###
                  // This helps the video fill the container properly.
                  renderMode={RenderModeType.RenderModeFit}
                />
              )}
              {!isCameraEnabled && (
                <View style={styles.videoOverlay}>
                  <Text style={styles.overlayText}>Camera Off</Text>
                </View>
              )}
            </View>

            {/* Remote Videos */}
            {isJoined && remoteUids.length > 0 && (
              <Text style={styles.videoLabel}>Remote Users</Text>
            )}
            {isJoined &&
              remoteUids.map(uid => (
                <View key={uid} style={styles.videoContainer}>
                  <Text style={styles.videoLabel}>User {uid}</Text>
                  <RtcSurfaceView
                    style={styles.videoView}
                    canvas={{ uid }}
                    renderMode={RenderModeType.RenderModeFit}
                  />
                </View>
              ))}
          </ScrollView>
        </>
      ) : (
        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeText}>
            Please select a user to get started
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};

// Permissions function remains the same
const getPermission = async () => {
  console.log('[getPermission] Requesting Android permissions...');
  try {
    const grants = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      PermissionsAndroid.PERMISSIONS.CAMERA,
    ]);

    if (
      grants['android.permission.RECORD_AUDIO'] ===
        PermissionsAndroid.RESULTS.GRANTED &&
      grants['android.permission.CAMERA'] === PermissionsAndroid.RESULTS.GRANTED
    ) {
      console.log('[getPermission] Permissions granted.');
    } else {
      console.log('[getPermission] Permissions denied.');
    }
  } catch (err) {
    console.error('[getPermission] Permission request failed:', err);
  }
};

// --- Styles (simplified for brevity, use your existing styles) ---
const styles = StyleSheet.create({
  main: { flex: 1, backgroundColor: '#F7F7F7' },
  head: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', padding: 20 },
  userSelector: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  btnContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#007bff',
    borderRadius: 8,
  },
  selectedButton: { backgroundColor: '#28a745' },
  disabledButton: { backgroundColor: '#6c757d', opacity: 0.6 },
  buttonText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  infoText: { textAlign: 'center', fontSize: 16, padding: 10 },
  statusText: {
    textAlign: 'center',
    fontSize: 14,
    padding: 5,
    color: '#6c757d',
  },
  scrollContainer: { alignItems: 'center', padding: 10 },
  videoContainer: {
    width: '90%',
    height: 250,
    borderRadius: 8,
    marginBottom: 15,
    overflow: 'hidden',
    backgroundColor: '#000',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  videoView: { width: '100%', height: '100%' },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayText: { color: '#fff', fontSize: 16 },
  videoLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 5,
  },
  welcomeContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  welcomeText: { fontSize: 18, color: '#6c757d' },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  controlButton: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#17a2b8',
    borderRadius: 8,
  },
  controlButtonText: { color: '#ffffff', fontSize: 14, fontWeight: 'bold' },
});

export default App;

// import React, { useState } from 'react';
// import {
//   SafeAreaView,
//   StyleSheet,
//   Text,
//   View,
//   TouchableOpacity,
//   Alert,
// } from 'react-native';
// import AgoraUIKit from 'agora-rn-uikit';

// // --- Paste your App ID and Channel Name ---
// const APP_ID = '4a75f775a2a6427792d534a048ae00a2';
// const CHANNEL_NAME = 'testing';

// // --- User Data (Tokens should be generated for the specific channel name) ---
// const USER_1_UID = 1001;
// const USER_1_TOKEN =
//   '007eJxTYHBYLdG19mpVW2pI8qH5m5bfjbtxcml19YPE0LgysQUV+48rMJgkmpummZubJholmpkYmZtbGqWYGpskGphYJKYaGCQamcb5ZDQEMjKIftBkYWSAQBCfnaEktbgkMy+dgQEADNMhCg==';

// const USER_2_UID = 1002;
// const USER_2_TOKEN =
//   '007eJxTYMg9kpdlIrPcPmzncb4rMv84DN9Wvbvm9WkWY97KpzZO0ycpMJgkmpummZubJholmpkYmZtbGqWYGpskGphYJKYaGCQaacf5ZDQEMjIIip5kYWSAQBCfnaEktbgkMy+dgQEAe2AfNg==';

// // --- NEW: Added User 3 Data ---
// const USER_3_UID = 1003;
// // ❗️ IMPORTANT: You must generate a new token for UID 1003 and paste it here.
// const USER_3_TOKEN =
//   '007eJxTYNgztXHaPhaDBYECMqWmy00+KT/fN9U566FJV+Aivfj1C+8pMJgkmpummZubJholmpkYmZtbGqWYGpskGphYJKYaGCQaycf5ZDQEMjJMcXRjZWSAQBCfnaEktbgkMy+dgQEARlUerQ==';

// const App = () => {
//   const [activeCall, setActiveCall] = useState(false);
//   const [currentUser, setCurrentUser] = useState(null);

//   const connectionData = {
//     appId: APP_ID,
//     channel: CHANNEL_NAME,
//     token: currentUser?.token,
//     uid: currentUser?.uid,
//   };

//   const rtcCallbacks = {
//     EndCall: () => {
//       console.log('Call ended by UIKit.');
//       setActiveCall(false);
//     },
//   };

//   const joinCall = () => {
//     if (!currentUser) {
//       Alert.alert('Error', 'Please select a user before joining the call.');
//       return;
//     }
//     // Check if the token for the selected user has been set
//     if (currentUser.token.includes('PASTE A FRESH TOKEN')) {
//       Alert.alert(
//         'Error',
//         `Please add a valid token for User ${currentUser.uid}.`,
//       );
//       return;
//     }
//     console.log(`Joining call as User ${currentUser.uid}...`);
//     setActiveCall(true);
//   };

//   const selectUser = user => {
//     if (activeCall) {
//       Alert.alert(
//         'Info',
//         'Cannot switch user while in a call. Please leave first.',
//       );
//       return;
//     }
//     console.log(`User ${user.uid} selected.`);
//     setCurrentUser(user);
//   };

//   const renderLobby = () => (
//     <View style={styles.lobbyContainer}>
//       <Text style={styles.head}>Agora Multi-User Test</Text>
//       <Text style={styles.subHead}>Powered by Agora UIKit</Text>

//       {/* User Selection */}
//       <View style={styles.userSelector}>
//         <TouchableOpacity
//           style={[
//             styles.button,
//             currentUser?.uid === USER_1_UID && styles.selectedButton,
//           ]}
//           onPress={() => selectUser({ uid: USER_1_UID, token: USER_1_TOKEN })}
//         >
//           <Text style={styles.buttonText}>Login as User {USER_1_UID}</Text>
//         </TouchableOpacity>

//         <TouchableOpacity
//           style={[
//             styles.button,
//             currentUser?.uid === USER_2_UID && styles.selectedButton,
//           ]}
//           onPress={() => selectUser({ uid: USER_2_UID, token: USER_2_TOKEN })}
//         >
//           <Text style={styles.buttonText}>Login as User {USER_2_UID}</Text>
//         </TouchableOpacity>

//         {/* --- NEW: Added Button for User 3 --- */}
//         <TouchableOpacity
//           style={[
//             styles.button,
//             currentUser?.uid === USER_3_UID && styles.selectedButton,
//           ]}
//           onPress={() => selectUser({ uid: USER_3_UID, token: USER_3_TOKEN })}
//         >
//           <Text style={styles.buttonText}>Login as User {USER_3_UID}</Text>
//         </TouchableOpacity>
//       </View>

//       {currentUser && (
//         <View style={styles.joinContainer}>
//           <Text style={styles.infoText}>Logged in as: {currentUser.uid}</Text>
//           <TouchableOpacity
//             onPress={joinCall}
//             style={[styles.button, styles.joinButton]}
//           >
//             <Text style={styles.buttonText}>Join Channel</Text>
//           </TouchableOpacity>
//         </View>
//       )}
//     </View>
//   );

//   return (
//     <SafeAreaView style={styles.main}>
//       {activeCall ? (
//         <AgoraUIKit
//           connectionData={connectionData}
//           rtcCallbacks={rtcCallbacks}
//         />
//       ) : (
//         renderLobby()
//       )}
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   main: { flex: 1, backgroundColor: '#F7F7F7' },
//   head: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', padding: 20 },
//   subHead: {
//     fontSize: 16,
//     textAlign: 'center',
//     color: '#555',
//     marginTop: -15,
//     marginBottom: 30,
//   },
//   lobbyContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   userSelector: {
//     width: '90%',
//     paddingVertical: 15,
//   },
//   button: {
//     paddingHorizontal: 20,
//     paddingVertical: 15,
//     backgroundColor: '#007bff',
//     borderRadius: 8,
//     marginBottom: 10,
//   },
//   selectedButton: {
//     backgroundColor: '#28a745',
//     borderColor: '#218838',
//     borderWidth: 2,
//   },
//   buttonText: {
//     color: '#ffffff',
//     fontSize: 16,
//     fontWeight: 'bold',
//     textAlign: 'center',
//   },
//   joinContainer: {
//     marginTop: 30,
//     width: '90%',
//     alignItems: 'center',
//   },
//   joinButton: {
//     backgroundColor: '#17a2b8',
//     width: '100%',
//   },
//   infoText: {
//     textAlign: 'center',
//     fontSize: 16,
//     padding: 10,
//     marginBottom: 10,
//     fontWeight: 'bold',
//   },
// });

// export default App;

// import React, { useState, useRef } from 'react';
// import {
//   SafeAreaView,
//   StyleSheet,
//   Text,
//   View,
//   TouchableOpacity,
//   Alert,
//   Switch,
//   Dimensions,
// } from 'react-native';
// import AgoraUIKit from 'agora-rn-uikit';

// const { width, height } = Dimensions.get('window');

// // --- Paste your App ID and Channel Name ---
// const APP_ID = '4a75f775a2a6427792d534a048ae00a2';
// const CHANNEL_NAME = 'testing';

// // --- User Data ---
// const USER_1_UID = 1001;
// const USER_1_TOKEN =
//   '007eJxTYJj7J+aW3pE5p9vNuT5H3/hykN/zA1uMJMM07owXlfay194rMJgkmpummZubJholmpkYmZtbGqWYGpskGphYJKYaGCQaNZzzz2gIZGRYfFWdhZEBAkF8doaS1OKSzLx0BgYA0q0g2A==';

// const USER_2_UID = 1002;
// const USER_2_TOKEN =
//   '007eJxTYMg9kpdlIrPcPmzncb4rMv84DN9Wvbvm9WkWY57KpzZO0ycpMJgkmpummZubJholmpkYmZtbGqWYGpskGphYJKYaGCQaacf5ZDQEMjIIip5kYWSAQBCfnaEktbgkMy+dgQEAe2AfNg==';

// const USER_3_UID = 1003;
// const USER_3_TOKEN =
//   '007eJxTYNgztXHaPhaDBYECMqWmy00+KT/fN9U566FJV+Jivfj1C+8pMJgkmpummZubJholmpkYmZtbGqWYGpskGphYJKYaGCQaycf5ZDQEMjJMcXRjZWSAQBCfnaEktbgkMy+dgQEARlUerQ==';

// const App = () => {
//   const [activeCall, setActiveCall] = useState(false);
//   const [currentUser, setCurrentUser] = useState(null);
//   const [isScreenSharing, setIsScreenSharing] = useState(false);
//   const [isMuted, setIsMuted] = useState(false);
//   const [isVideoOff, setIsVideoOff] = useState(false);
//   const [showCustomControls, setShowCustomControls] = useState(true);

//   // Reference to access UIKit methods
//   const agoraUIKitRef = useRef(null);

//   const connectionData = {
//     appId: APP_ID,
//     channel: CHANNEL_NAME,
//     token: currentUser?.token,
//     uid: currentUser?.uid,
//   };

//   const rtcProps = {
//     activeSpeaker: true,
//     layout: 1,
//     enableScreensharing: true, // Enable but won't show button
//     enableAudio: true,
//     enableVideo: true,
//     disableRtm: false, // Enable chat
//     enableAudioVolumeIndication: true,
//   };

//   const rtcCallbacks = {
//     EndCall: () => {
//       console.log('Call ended');
//       setActiveCall(false);
//       setIsScreenSharing(false);
//     },

//     UserJoined: uid => {
//       console.log(`User ${uid} joined`);
//     },

//     UserOffline: uid => {
//       console.log(`User ${uid} left`);
//     },
//   };

//   // Custom screen sharing function
//   const toggleScreenShare = async () => {
//     try {
//       if (!isScreenSharing) {
//         // Start screen sharing
//         console.log('Starting screen share...');
//         // Note: This is a simplified approach - actual implementation might vary
//         setIsScreenSharing(true);
//         Alert.alert('Screen Share', 'Screen sharing started!');
//       } else {
//         // Stop screen sharing
//         console.log('Stopping screen share...');
//         setIsScreenSharing(false);
//         Alert.alert('Screen Share', 'Screen sharing stopped!');
//       }
//     } catch (error) {
//       console.error('Screen share error:', error);
//       Alert.alert('Error', 'Failed to toggle screen sharing');
//     }
//   };

//   const toggleMute = () => {
//     setIsMuted(!isMuted);
//     // You would call the actual mute function here
//     console.log(`Audio ${!isMuted ? 'muted' : 'unmuted'}`);
//   };

//   const toggleVideo = () => {
//     setIsVideoOff(!isVideoOff);
//     // You would call the actual video toggle function here
//     console.log(`Video ${!isVideoOff ? 'disabled' : 'enabled'}`);
//   };

//   const endCall = () => {
//     setActiveCall(false);
//     setIsScreenSharing(false);
//   };

//   const selectUser = user => {
//     if (activeCall) {
//       Alert.alert('Info', 'Cannot switch user while in a call.');
//       return;
//     }
//     setCurrentUser(user);
//   };

//   const joinCall = () => {
//     if (!currentUser) {
//       Alert.alert('Error', 'Please select a user first.');
//       return;
//     }
//     setActiveCall(true);
//   };

//   // Custom control buttons overlay
//   const renderCustomControls = () => (
//     <View style={styles.customControlsContainer}>
//       <View style={styles.controlsRow}>
//         {/* Screen Share Button */}
//         <TouchableOpacity
//           style={[
//             styles.controlButton,
//             isScreenSharing && styles.controlButtonActive,
//           ]}
//           onPress={toggleScreenShare}
//         >
//           <Text style={styles.controlButtonText}>
//             {isScreenSharing ? '🔴 Stop Share' : '📱 Share Screen'}
//           </Text>
//         </TouchableOpacity>

//         {/* Mute Button */}
//         <TouchableOpacity
//           style={[styles.controlButton, isMuted && styles.controlButtonActive]}
//           onPress={toggleMute}
//         >
//           <Text style={styles.controlButtonText}>
//             {isMuted ? '🔇 Unmute' : '🎤 Mute'}
//           </Text>
//         </TouchableOpacity>

//         {/* Video Toggle */}
//         <TouchableOpacity
//           style={[
//             styles.controlButton,
//             isVideoOff && styles.controlButtonActive,
//           ]}
//           onPress={toggleVideo}
//         >
//           <Text style={styles.controlButtonText}>
//             {isVideoOff ? '📹 Video On' : '🚫 Video Off'}
//           </Text>
//         </TouchableOpacity>

//         {/* End Call */}
//         <TouchableOpacity
//           style={[styles.controlButton, styles.endCallButton]}
//           onPress={endCall}
//         >
//           <Text style={styles.controlButtonText}>📞 End Call</Text>
//         </TouchableOpacity>
//       </View>

//       {/* Toggle Controls Visibility */}
//       <TouchableOpacity
//         style={styles.hideControlsButton}
//         onPress={() => setShowCustomControls(!showCustomControls)}
//       >
//         <Text style={styles.hideControlsText}>
//           {showCustomControls ? '▼ Hide Controls' : '▲ Show Controls'}
//         </Text>
//       </TouchableOpacity>
//     </View>
//   );

//   const renderLobby = () => (
//     <View style={styles.lobbyContainer}>
//       <Text style={styles.head}>Agora Video Call</Text>
//       <Text style={styles.subHead}>With Custom Screen Share Controls</Text>

//       {/* User Selection */}
//       <View style={styles.userSelector}>
//         <TouchableOpacity
//           style={[
//             styles.button,
//             currentUser?.uid === USER_1_UID && styles.selectedButton,
//           ]}
//           onPress={() => selectUser({ uid: USER_1_UID, token: USER_1_TOKEN })}
//         >
//           <Text style={styles.buttonText}>Login as User {USER_1_UID}</Text>
//         </TouchableOpacity>

//         <TouchableOpacity
//           style={[
//             styles.button,
//             currentUser?.uid === USER_2_UID && styles.selectedButton,
//           ]}
//           onPress={() => selectUser({ uid: USER_2_UID, token: USER_2_TOKEN })}
//         >
//           <Text style={styles.buttonText}>Login as User {USER_2_UID}</Text>
//         </TouchableOpacity>

//         <TouchableOpacity
//           style={[
//             styles.button,
//             currentUser?.uid === USER_3_UID && styles.selectedButton,
//           ]}
//           onPress={() => selectUser({ uid: USER_3_UID, token: USER_3_TOKEN })}
//         >
//           <Text style={styles.buttonText}>Login as User {USER_3_UID}</Text>
//         </TouchableOpacity>
//       </View>

//       {/* Instructions */}
//       <View style={styles.instructionsPanel}>
//         <Text style={styles.instructionTitle}>🎯 New Features Added:</Text>
//         <Text style={styles.instructionText}>
//           ✅ Custom Screen Share Button{'\n'}✅ Mute/Unmute Controls{'\n'}✅
//           Video On/Off Toggle{'\n'}✅ End Call Button{'\n'}✅ Hide/Show Controls
//           {'\n\n'}
//           📱 The screen share button will appear as overlay during call!
//         </Text>
//       </View>

//       {currentUser && (
//         <View style={styles.joinContainer}>
//           <Text style={styles.infoText}>
//             Ready to join as: User {currentUser.uid}
//           </Text>
//           <TouchableOpacity
//             onPress={joinCall}
//             style={[styles.button, styles.joinButton]}
//           >
//             <Text style={styles.buttonText}>🎥 Join Video Call</Text>
//           </TouchableOpacity>
//         </View>
//       )}
//     </View>
//   );

//   return (
//     <SafeAreaView style={styles.main}>
//       {activeCall ? (
//         <View style={styles.callContainer}>
//           {/* Agora UIKit */}
//           <AgoraUIKit
//             ref={agoraUIKitRef}
//             connectionData={connectionData}
//             rtcProps={rtcProps}
//             rtcCallbacks={rtcCallbacks}
//             styleProps={{
//               maxViewContainer: {
//                 backgroundColor: '#000',
//               },
//               minViewContainer: {
//                 backgroundColor: '#333',
//                 borderRadius: 8,
//               },
//             }}
//           />

//           {/* Custom Controls Overlay */}
//           {showCustomControls && renderCustomControls()}
//         </View>
//       ) : (
//         renderLobby()
//       )}
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   main: { flex: 1, backgroundColor: '#F7F7F7' },
//   callContainer: {
//     flex: 1,
//     position: 'relative',
//   },

//   // Custom Controls Styles
//   customControlsContainer: {
//     position: 'absolute',
//     bottom: 50,
//     left: 0,
//     right: 0,
//     backgroundColor: 'rgba(0,0,0,0.8)',
//     paddingVertical: 15,
//     paddingHorizontal: 10,
//   },
//   controlsRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-around',
//     flexWrap: 'wrap',
//   },
//   controlButton: {
//     backgroundColor: 'rgba(255,255,255,0.2)',
//     paddingHorizontal: 12,
//     paddingVertical: 8,
//     borderRadius: 8,
//     marginHorizontal: 4,
//     marginVertical: 4,
//     minWidth: 80,
//     alignItems: 'center',
//   },
//   controlButtonActive: {
//     backgroundColor: '#ff4444',
//   },
//   controlButtonText: {
//     color: '#fff',
//     fontSize: 12,
//     fontWeight: 'bold',
//     textAlign: 'center',
//   },
//   endCallButton: {
//     backgroundColor: '#ff4444',
//   },
//   hideControlsButton: {
//     alignSelf: 'center',
//     marginTop: 10,
//     paddingVertical: 5,
//   },
//   hideControlsText: {
//     color: '#fff',
//     fontSize: 12,
//   },

//   // Lobby Styles
//   head: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', padding: 20 },
//   subHead: {
//     fontSize: 16,
//     textAlign: 'center',
//     color: '#555',
//     marginTop: -15,
//     marginBottom: 20,
//   },
//   lobbyContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingHorizontal: 20,
//   },
//   userSelector: {
//     width: '100%',
//     paddingVertical: 15,
//   },
//   button: {
//     paddingHorizontal: 20,
//     paddingVertical: 15,
//     backgroundColor: '#007bff',
//     borderRadius: 8,
//     marginBottom: 10,
//   },
//   selectedButton: {
//     backgroundColor: '#28a745',
//     borderColor: '#218838',
//     borderWidth: 2,
//   },
//   buttonText: {
//     color: '#ffffff',
//     fontSize: 16,
//     fontWeight: 'bold',
//     textAlign: 'center',
//   },
//   joinContainer: {
//     marginTop: 20,
//     width: '100%',
//     alignItems: 'center',
//   },
//   joinButton: {
//     backgroundColor: '#17a2b8',
//     width: '100%',
//   },
//   infoText: {
//     textAlign: 'center',
//     fontSize: 16,
//     padding: 10,
//     marginBottom: 10,
//     fontWeight: 'bold',
//     color: '#333',
//   },
//   instructionsPanel: {
//     width: '100%',
//     backgroundColor: '#f8f9fa',
//     borderRadius: 12,
//     padding: 20,
//     marginVertical: 15,
//     borderLeftWidth: 4,
//     borderLeftColor: '#28a745',
//   },
//   instructionTitle: {
//     fontSize: 16,
//     fontWeight: 'bold',
//     color: '#333',
//     marginBottom: 10,
//   },
//   instructionText: {
//     fontSize: 14,
//     color: '#555',
//     lineHeight: 20,
//   },
// });

// export default App;
