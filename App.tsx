// import React, { useState, useRef, useEffect } from 'react';
// import {
//   SafeAreaView,
//   StyleSheet,
//   Text,
//   View,
//   TouchableOpacity,
//   Platform,
//   PermissionsAndroid,
//   ScrollView,
//   Alert,
// } from 'react-native';
// import {
//   ClientRoleType,
//   createAgoraRtcEngine,
//   ChannelProfileType,
//   RtcSurfaceView,
// } from 'react-native-agora';

// // --- 1. PASTE FRESH TOKENS HERE ---
// const APP_ID = '4a75f775a2a6427792d534a048ae00a2';
// const CHANNEL_NAME = 'testing';

// // --- User 1 Data ---
// const USER_1_UID = 1001;
// const USER_1_TOKEN =
//   '007eJxTYNiVx5n6tLCFa8fh9WWMz+tCg4rFJoTMtsvh8qzo6ms5zazAYJJobppmbm6aaJRoZmJkbm5plGJqbJJoYGKRmGpgkGik9so7oyGQkWHqjdvMjAwQCOKzM5SkFpdk5qUzMAAAJDYfMw=='; // 👈 PASTE A FRESH TOKEN

// // --- User 2 Data ---
// const USER_2_UID = 1002;
// const USER_2_TOKEN =
//   '007eJxTYJASO/lww0q2imgv2dILP7we/dMpr/hvsIJv1pONj5/0RN9RYDBJNDdNMzc3TTRKNDMxMje3NEoxNTZJNDCxSEw1MEg0OvTeO6MhkJHh/r06VkYGCATx2RlKUotLMvPSGRgAQ6YjTg=='; // 👈 PASTE A FRESH TOKEN

// const App = () => {
//   const [isJoined, setIsJoined] = useState(false);
//   const [remoteUids, setRemoteUids] = useState([]);
//   const agoraEngineRef = useRef(null);
//   const [currentUser, setCurrentUser] = useState(null);
//   const [isEngineReady, setIsEngineReady] = useState(false);
//   const [isFrontCamera, setIsFrontCamera] = useState(true);
//   const [isCameraEnabled, setIsCameraEnabled] = useState(true);
//   const [isMicEnabled, setIsMicEnabled] = useState(true);

//   useEffect(() => {
//     let isComponentMounted = true;
//     let cleanupTimeoutId = null;

//     const cleanup = () => {
//       console.log('[useEffect] Cleanup function running...');
//       if (agoraEngineRef.current) {
//         try {
//           // First, update states immediately
//           if (isComponentMounted) {
//             setIsJoined(false);
//             setRemoteUids([]);
//             setIsEngineReady(false);
//           }

//           console.log('[useEffect] Stopping preview and leaving channel...');
//           // Stop preview first
//           agoraEngineRef.current.stopPreview();

//           // Leave channel if not already left
//           agoraEngineRef.current.leaveChannel();

//           // Use setTimeout to delay the release call
//           cleanupTimeoutId = setTimeout(() => {
//             try {
//               if (agoraEngineRef.current) {
//                 console.log(
//                   '[useEffect] Releasing Agora engine after delay...',
//                 );
//                 agoraEngineRef.current.release();
//                 agoraEngineRef.current = null;
//                 console.log('[useEffect] Engine released successfully.');
//               }
//             } catch (releaseError) {
//               console.log(
//                 '[useEffect] Error during delayed release:',
//                 releaseError,
//               );
//               agoraEngineRef.current = null;
//             }
//           }, 100); // Small delay to let operations complete
//         } catch (error) {
//           console.log('[useEffect] Error during cleanup:', error);
//           agoraEngineRef.current = null;
//         }
//       }
//     };

//     const setup = async () => {
//       // If a user is selected, set up the new engine
//       if (currentUser && isComponentMounted) {
//         console.log(`[useEffect] Setting up for new user: ${currentUser.uid}`);
//         // Wait a bit before setup to ensure cleanup is complete
//         await new Promise(resolve => setTimeout(resolve, 200));

//         if (isComponentMounted) {
//           try {
//             await setupVideoSDKEngine();
//           } catch (error) {
//             console.log('[useEffect] Setup failed:', error);
//             if (isComponentMounted) {
//               setIsEngineReady(false);
//             }
//           }
//         }
//       }
//     };

//     // Clean up previous engine before setting up new one
//     if (agoraEngineRef.current) {
//       cleanup();
//     }

//     // Setup new engine
//     setup();

//     // Return cleanup function
//     return () => {
//       isComponentMounted = false;
//       if (cleanupTimeoutId) {
//         clearTimeout(cleanupTimeoutId);
//       }
//       cleanup();
//     };
//   }, [currentUser]); // Only depend on currentUser

//   const setupVideoSDKEngine = async () => {
//     try {
//       console.log('[setupVideoSDKEngine] Starting setup...');

//       // Clear previous state
//       setIsJoined(false);
//       setRemoteUids([]);
//       setIsEngineReady(false);

//       if (Platform.OS === 'android') {
//         await getPermission();
//       }

//       agoraEngineRef.current = createAgoraRtcEngine();
//       const agoraEngine = agoraEngineRef.current;

//       console.log('[setupVideoSDKEngine] Adding event listeners...');
//       agoraEngine.addListener('onJoinChannelSuccess', () => {
//         console.log(
//           '✅ [EVENT] onJoinChannelSuccess: Successfully joined channel.',
//         );
//         setIsJoined(true);
//       });
//       agoraEngine.addListener('onUserJoined', (_, remoteUid) => {
//         console.log(
//           `✅ [EVENT] onUserJoined: Remote user ${remoteUid} has joined.`,
//         );
//         setRemoteUids(prevUids => [...prevUids, remoteUid]);
//       });
//       agoraEngine.addListener('onUserOffline', (_, remoteUid) => {
//         console.log(
//           `✅ [EVENT] onUserOffline: Remote user ${remoteUid} has left.`,
//         );
//         setRemoteUids(prevUids => prevUids.filter(uid => uid !== remoteUid));
//       });
//       agoraEngine.addListener('onLeaveChannel', () => {
//         console.log('✅ [EVENT] onLeaveChannel: You have left the channel.');
//         setIsJoined(false);
//         setRemoteUids([]);
//       });
//       agoraEngine.addListener('onError', (err, msg) => {
//         console.error(`❌ [EVENT] onError: Code ${err}, Message: ${msg}`);
//         Alert.alert(`Agora SDK Error (Code: ${err})`, msg);
//       });

//       console.log('[setupVideoSDKEngine] Initializing with App ID...');
//       await agoraEngine.initialize({ appId: APP_ID });
//       console.log('[setupVideoSDKEngine] Setting channel profile...');
//       await agoraEngine.setChannelProfile(
//         ChannelProfileType.ChannelProfileLiveBroadcasting,
//       );
//       console.log('[setupVideoSDKEngine] Enabling video...');
//       await agoraEngine.enableVideo();
//       console.log('[setupVideoSDKEngine] Enabling audio...');
//       await agoraEngine.enableAudio();

//       // Set video configuration for better quality
//       await agoraEngine.setVideoEncoderConfiguration({
//         dimensions: { width: 640, height: 480 },
//         frameRate: 15,
//         bitrate: 400,
//       });

//       // Set front camera as default
//       await agoraEngine.switchCamera();

//       console.log('[setupVideoSDKEngine] Starting preview...');
//       await agoraEngine.startPreview();
//       console.log('✅ [setupVideoSDKEngine] Engine setup complete.');
//       setIsEngineReady(true);
//     } catch (e) {
//       console.error('[setupVideoSDKEngine] A critical error occurred:', e);
//       setIsEngineReady(false);
//       Alert.alert(
//         'Setup Failed',
//         `Failed to initialize video engine: ${e.message}`,
//       );
//     }
//   };

//   const switchCamera = async () => {
//     if (!agoraEngineRef.current || !isEngineReady) {
//       console.log('[switchCamera] Engine not ready');
//       return;
//     }
//     try {
//       console.log('[switchCamera] Switching camera...');
//       await agoraEngineRef.current.switchCamera();
//       setIsFrontCamera(!isFrontCamera);
//       console.log(
//         `[switchCamera] Switched to ${
//           !isFrontCamera ? 'front' : 'back'
//         } camera`,
//       );
//     } catch (error) {
//       console.error('[switchCamera] Error switching camera:', error);
//       Alert.alert('Camera Switch Failed', error.toString());
//     }
//   };

//   const toggleCamera = async () => {
//     if (!agoraEngineRef.current || !isEngineReady) {
//       console.log('[toggleCamera] Engine not ready');
//       return;
//     }
//     try {
//       if (isCameraEnabled) {
//         await agoraEngineRef.current.disableVideo();
//         console.log('[toggleCamera] Camera disabled');
//       } else {
//         await agoraEngineRef.current.enableVideo();
//         console.log('[toggleCamera] Camera enabled');
//       }
//       setIsCameraEnabled(!isCameraEnabled);
//     } catch (error) {
//       console.error('[toggleCamera] Error toggling camera:', error);
//       Alert.alert('Camera Toggle Failed', error.toString());
//     }
//   };

//   const toggleMic = async () => {
//     if (!agoraEngineRef.current || !isEngineReady) {
//       console.log('[toggleMic] Engine not ready');
//       return;
//     }
//     try {
//       if (isMicEnabled) {
//         await agoraEngineRef.current.disableAudio();
//         console.log('[toggleMic] Microphone disabled');
//       } else {
//         await agoraEngineRef.current.enableAudio();
//         console.log('[toggleMic] Microphone enabled');
//       }
//       setIsMicEnabled(!isMicEnabled);
//     } catch (error) {
//       console.error('[toggleMic] Error toggling microphone:', error);
//       Alert.alert('Microphone Toggle Failed', error.toString());
//     }
//   };

//   const join = async () => {
//     console.log('[join] Join button pressed.');
//     if (!currentUser) {
//       console.log('[join] Aborted: No user selected.');
//       Alert.alert('Please select a user to login first.');
//       return;
//     }
//     if (!isEngineReady || !agoraEngineRef.current) {
//       console.log('[join] Aborted: Engine is not ready yet.');
//       Alert.alert('Engine not ready', 'Please wait a moment.');
//       return;
//     }
//     if (isJoined) {
//       console.log('[join] Aborted: Already in a channel.');
//       Alert.alert('Already joined', 'You are already in the channel.');
//       return;
//     }
//     try {
//       console.log(`[join] Setting client role to Broadcaster...`);
//       await agoraEngineRef.current.setClientRole(
//         ClientRoleType.ClientRoleBroadcaster,
//       );

//       console.log(
//         `[join] Attempting to join channel "${CHANNEL_NAME}" with UID ${currentUser.uid}...`,
//       );
//       console.log(
//         `[join] Using Token: ${currentUser.token.substring(0, 15)}...`,
//       ); // Log first part of token

//       await agoraEngineRef.current.joinChannel(
//         currentUser.token,
//         CHANNEL_NAME,
//         currentUser.uid,
//         {},
//       );
//     } catch (e) {
//       console.error('[join] An error occurred while joining:', e);
//       Alert.alert('Join Failed', e.toString());
//     }
//   };

//   const leave = async () => {
//     console.log('[leave] Leave button pressed.');
//     if (!isJoined || !agoraEngineRef.current) {
//       console.log('[leave] Not joined or engine not available.');
//       return;
//     }
//     try {
//       await agoraEngineRef.current.leaveChannel();
//       console.log('[leave] Successfully left channel.');
//     } catch (error) {
//       console.error('[leave] Error leaving channel:', error);
//       Alert.alert('Leave Failed', error.toString());
//     }
//   };

//   const selectUser = user => {
//     console.log(`[selectUser] Switching to user: ${user.uid}`);

//     // If currently joined, leave first
//     if (isJoined && agoraEngineRef.current) {
//       console.log('[selectUser] Leaving current channel before switching...');
//       agoraEngineRef.current.leaveChannel();
//     }

//     // Reset states immediately when switching users
//     setIsJoined(false);
//     setRemoteUids([]);
//     setIsEngineReady(false);

//     // Set the new user after a small delay to ensure leave operation completes
//     setTimeout(() => {
//       setCurrentUser(user);
//     }, 100);
//   };

//   const getPermission = async () => {
//     console.log('[getPermission] Requesting Android permissions...');
//     try {
//       const grants = await PermissionsAndroid.requestMultiple([
//         PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
//         PermissionsAndroid.PERMISSIONS.CAMERA,
//       ]);

//       if (
//         grants['android.permission.RECORD_AUDIO'] ===
//           PermissionsAndroid.RESULTS.GRANTED &&
//         grants['android.permission.CAMERA'] ===
//           PermissionsAndroid.RESULTS.GRANTED
//       ) {
//         console.log('[getPermission] Permissions granted.');
//       } else {
//         console.log('[getPermission] Permissions denied.');
//         Alert.alert(
//           'Permissions Required',
//           'Camera and microphone permissions are required for video calling.',
//         );
//       }
//     } catch (err) {
//       console.error('[getPermission] Permission request failed:', err);
//     }
//   };

//   return (
//     <SafeAreaView style={styles.main}>
//       <Text style={styles.head}>Agora Multi-User Test</Text>

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
//       </View>

//       {currentUser && (
//         <>
//           <Text style={styles.infoText}>
//             Logged in as User: {currentUser.uid}
//           </Text>
//           <Text style={styles.statusText}>
//             Status:{' '}
//             {isEngineReady
//               ? isJoined
//                 ? 'Connected'
//                 : 'Ready to Join'
//               : 'Initializing...'}
//           </Text>
//           <View style={styles.btnContainer}>
//             <TouchableOpacity
//               style={[
//                 styles.button,
//                 (!isEngineReady || isJoined) && styles.disabledButton,
//               ]}
//               onPress={join}
//               disabled={!isEngineReady || isJoined}
//             >
//               <Text style={styles.buttonText}>
//                 {!isEngineReady
//                   ? 'Initializing...'
//                   : isJoined
//                   ? 'Joined'
//                   : 'Join'}
//               </Text>
//             </TouchableOpacity>
//             <TouchableOpacity
//               style={[styles.button, !isJoined && styles.disabledButton]}
//               onPress={leave}
//               disabled={!isJoined}
//             >
//               <Text style={styles.buttonText}>Leave</Text>
//             </TouchableOpacity>
//           </View>

//           {/* Camera and Audio Controls */}
//           <View style={styles.controlsContainer}>
//             <TouchableOpacity
//               style={[styles.controlButton, styles.switchButton]}
//               onPress={switchCamera}
//               disabled={!isEngineReady}
//             >
//               <Text style={styles.controlButtonText}>
//                 {isFrontCamera ? '📱' : '📷'} Switch
//               </Text>
//             </TouchableOpacity>
//             <TouchableOpacity
//               style={[
//                 styles.controlButton,
//                 isCameraEnabled
//                   ? styles.enabledButton
//                   : styles.disabledControlButton,
//               ]}
//               onPress={toggleCamera}
//               disabled={!isEngineReady}
//             >
//               <Text style={styles.controlButtonText}>
//                 {isCameraEnabled ? '📹' : '📹❌'} Video
//               </Text>
//             </TouchableOpacity>
//             <TouchableOpacity
//               style={[
//                 styles.controlButton,
//                 isMicEnabled
//                   ? styles.enabledButton
//                   : styles.disabledControlButton,
//               ]}
//               onPress={toggleMic}
//               disabled={!isEngineReady}
//             >
//               <Text style={styles.controlButtonText}>
//                 {isMicEnabled ? '🎤' : '🎤❌'} Audio
//               </Text>
//             </TouchableOpacity>
//           </View>
//           <ScrollView contentContainerStyle={styles.scrollContainer}>
//             <Text style={styles.videoLabel}>Local Video (You)</Text>
//             <View style={styles.videoContainer}>
//               <RtcSurfaceView
//                 style={styles.videoView}
//                 canvas={{ uid: 0 }}
//                 zOrderMediaOverlay={true}
//               />
//               {!isCameraEnabled && (
//                 <View style={styles.videoOverlay}>
//                   <Text style={styles.overlayText}>Camera Off</Text>
//                 </View>
//               )}
//             </View>
//             {remoteUids.length > 0 && (
//               <Text style={styles.videoLabel}>Remote Users</Text>
//             )}
//             {isJoined &&
//               remoteUids.map(uid => (
//                 <View key={uid}>
//                   <Text style={styles.videoLabel}>User {uid}</Text>
//                   <RtcSurfaceView
//                     style={styles.videoView}
//                     canvas={{ uid }}
//                     zOrderMediaOverlay={false}
//                   />
//                 </View>
//               ))}
//             {isJoined && remoteUids.length === 0 && (
//               <Text style={styles.infoText}>
//                 Waiting for other users to join...
//               </Text>
//             )}
//           </ScrollView>
//         </>
//       )}

//       {!currentUser && (
//         <View style={styles.welcomeContainer}>
//           <Text style={styles.welcomeText}>
//             Please select a user to get started
//           </Text>
//         </View>
//       )}
//     </SafeAreaView>
//   );
// };

// // --- Styles ---
// const styles = StyleSheet.create({
//   main: { flex: 1, backgroundColor: '#F7F7F7' },
//   head: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     textAlign: 'center',
//     padding: 20,
//     backgroundColor: '#fff',
//     borderBottomWidth: 1,
//     borderBottomColor: '#ddd',
//   },
//   userSelector: {
//     flexDirection: 'row',
//     justifyContent: 'space-evenly',
//     paddingVertical: 15,
//     backgroundColor: '#fff',
//     borderBottomWidth: 1,
//     borderBottomColor: '#ddd',
//   },
//   btnContainer: {
//     flexDirection: 'row',
//     justifyContent: 'space-evenly',
//     paddingVertical: 10,
//     backgroundColor: '#fff',
//     borderBottomWidth: 1,
//     borderBottomColor: '#ddd',
//   },
//   button: {
//     paddingHorizontal: 20,
//     paddingVertical: 15,
//     backgroundColor: '#007bff',
//     borderRadius: 8,
//   },
//   selectedButton: {
//     backgroundColor: '#28a745', // Green color for selected user
//   },
//   disabledButton: {
//     backgroundColor: '#6c757d',
//     opacity: 0.6,
//   },
//   buttonText: {
//     color: '#ffffff',
//     fontSize: 16,
//     fontWeight: 'bold',
//     textAlign: 'center',
//   },
//   infoText: {
//     textAlign: 'center',
//     fontSize: 16,
//     padding: 10,
//     backgroundColor: '#fff',
//   },
//   statusText: {
//     textAlign: 'center',
//     fontSize: 14,
//     padding: 5,
//     backgroundColor: '#f8f9fa',
//     color: '#6c757d',
//   },
//   scrollContainer: {
//     flexGrow: 1,
//     alignItems: 'center',
//     paddingBottom: 20,
//     paddingTop: 10,
//   },
//   videoView: {
//     width: '100%',
//     height: '100%',
//     borderRadius: 8,
//     overflow: 'hidden',
//     backgroundColor: '#000',
//     borderWidth: 2,
//     borderColor: '#ddd',
//   },
//   videoOverlay: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     right: 0,
//     bottom: 0,
//     backgroundColor: 'rgba(0,0,0,0.7)',
//     justifyContent: 'center',
//     alignItems: 'center',
//     borderRadius: 8,
//   },
//   overlayText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: 'bold',
//   },
//   videoLabel: {
//     fontSize: 16,
//     fontWeight: 'bold',
//     color: '#333',
//     marginTop: 10,
//     textAlign: 'center',
//   },
//   welcomeContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 20,
//   },
//   welcomeText: {
//     fontSize: 18,
//     color: '#6c757d',
//     textAlign: 'center',
//   },
//   controlsContainer: {
//     flexDirection: 'row',
//     justifyContent: 'space-evenly',
//     paddingVertical: 10,
//     backgroundColor: '#f8f9fa',
//     borderBottomWidth: 1,
//     borderBottomColor: '#ddd',
//   },
//   controlButton: {
//     paddingHorizontal: 15,
//     paddingVertical: 10,
//     borderRadius: 20,
//     minWidth: 80,
//   },
//   switchButton: {
//     backgroundColor: '#17a2b8',
//   },
//   enabledButton: {
//     backgroundColor: '#28a745',
//   },
//   disabledControlButton: {
//     backgroundColor: '#dc3545',
//   },
//   controlButtonText: {
//     color: '#ffffff',
//     fontSize: 12,
//     fontWeight: 'bold',
//     textAlign: 'center',
//   },
//   videoContainer: {
//     position: 'relative',
//     width: '90%',
//     height: 250,
//     marginTop: 10,
//     marginBottom: 10,
//   },
// });

// export default App;

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
