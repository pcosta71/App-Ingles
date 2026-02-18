import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, LiveSession, LiveServerMessage, Modality } from '@google/genai';
import { MessageSender, SessionState, type TranscriptMessage } from './types';
import { createPcmBlob, decode, decodeAudioData } from './utils/audioUtils';
import MicButton from './components/MicButton';
import Transcript from './components/Transcript';
import MotivationTracker from './components/MotivationTracker';
import { SYSTEM_INSTRUCTION } from './constants';
import { MicIcon, SparklesIcon } from './components/Icons';
import AvatarSelector from './components/AvatarSelector';
import UserAvatar from './components/UserAvatar';

const App: React.FC = () => {
  const [sessionState, setSessionState] = useState<SessionState>(SessionState.Idle);
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
  const [streak, setStreak] = useState<number>(0);
  const [userAvatar, setUserAvatar] = useState<string>('avatar1');
  const [isAvatarModalOpen, setAvatarModalOpen] = useState(false);

  const sessionRef = useRef<LiveSession | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const currentInputTranscriptionRef = useRef<string>('');
  const currentOutputTranscriptionRef = useRef<string>('');

  useEffect(() => {
    // Load streak from localStorage on mount
    const storedStreak = localStorage.getItem('streak');
    const lastVisit = localStorage.getItem('lastVisit');
    const today = new Date().toISOString().split('T')[0];
    
    if (storedStreak && lastVisit) {
      const lastVisitDate = new Date(lastVisit);
      const todayDate = new Date(today);

      const diffTime = todayDate.getTime() - lastVisitDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        setStreak(parseInt(storedStreak, 10));
      } else if (diffDays > 1) {
        localStorage.setItem('streak', '0');
        setStreak(0);
      } else {
        setStreak(parseInt(storedStreak, 10));
      }
    }

    // Load avatar from localStorage
    const storedAvatar = localStorage.getItem('userAvatar');
    if (storedAvatar) {
        setUserAvatar(storedAvatar);
    }
  }, []);

  const handleSelectAvatar = (avatar: string) => {
    setUserAvatar(avatar);
    localStorage.setItem('userAvatar', avatar);
    setAvatarModalOpen(false);
  };

  const updateStreak = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    const lastVisit = localStorage.getItem('lastVisit');
    
    if (lastVisit !== today) {
        setStreak(prevStreak => {
            const newStreak = prevStreak + 1;
            localStorage.setItem('streak', newStreak.toString());
            localStorage.setItem('lastVisit', today);
            return newStreak;
        });
    }
  }, []);

  const stopAudioPlayback = useCallback(() => {
    if (outputAudioContextRef.current) {
        for (const source of audioSourcesRef.current.values()) {
            source.stop();
        }
        audioSourcesRef.current.clear();
        nextStartTimeRef.current = 0;
    }
  }, []);
  
  const closeSession = useCallback(async () => {
    stopAudioPlayback();
    if (sessionRef.current) {
      await sessionRef.current.close();
      sessionRef.current = null;
    }
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }
    if (mediaStreamSourceRef.current) {
      mediaStreamSourceRef.current.disconnect();
      mediaStreamSourceRef.current = null;
    }
    if (inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed') {
      await inputAudioContextRef.current.close();
      inputAudioContextRef.current = null;
    }
    if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
      await outputAudioContextRef.current.close();
      outputAudioContextRef.current = null;
    }
    setSessionState(SessionState.Idle);
  }, [stopAudioPlayback]);


  const handleMessage = useCallback(async (message: LiveServerMessage) => {
    if (message.serverContent?.outputTranscription) {
        setSessionState(SessionState.Speaking);
        const text = message.serverContent.outputTranscription.text;
        currentOutputTranscriptionRef.current += text;
        setTranscript(prev => {
            const lastMessage = prev[prev.length - 1];
            if (lastMessage && lastMessage.sender === MessageSender.AI) {
                const updatedMessage = { ...lastMessage, text: currentOutputTranscriptionRef.current };
                return [...prev.slice(0, -1), updatedMessage];
            } else {
                return [...prev, { sender: MessageSender.AI, text: currentOutputTranscriptionRef.current, id: Date.now() }];
            }
        });
    } else if (message.serverContent?.inputTranscription) {
        const text = message.serverContent.inputTranscription.text;
        currentInputTranscriptionRef.current += text;
        setTranscript(prev => {
            const lastMessage = prev[prev.length - 1];
            if (lastMessage && lastMessage.sender === MessageSender.User) {
                const updatedMessage = { ...lastMessage, text: currentInputTranscriptionRef.current };
                return [...prev.slice(0, -1), updatedMessage];
            } else {
                return [...prev, { sender: MessageSender.User, text: currentInputTranscriptionRef.current, id: Date.now() }];
            }
        });
    }

    if (message.serverContent?.turnComplete) {
        currentInputTranscriptionRef.current = '';
        currentOutputTranscriptionRef.current = '';
    }

    if (message.serverContent?.interrupted) {
        stopAudioPlayback();
    }

    const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
    if (base64Audio && outputAudioContextRef.current) {
        setSessionState(SessionState.Speaking);
        const audioBuffer = await decodeAudioData(
            decode(base64Audio),
            outputAudioContextRef.current,
            24000,
            1,
        );
        
        const source = outputAudioContextRef.current.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(outputAudioContextRef.current.destination);

        const currentTime = outputAudioContextRef.current.currentTime;
        nextStartTimeRef.current = Math.max(nextStartTimeRef.current, currentTime);

        source.start(nextStartTimeRef.current);
        nextStartTimeRef.current += audioBuffer.duration;
        audioSourcesRef.current.add(source);
        source.onended = () => {
            audioSourcesRef.current.delete(source);
            if (audioSourcesRef.current.size === 0) {
                setSessionState(SessionState.Listening);
            }
        };
    }
  }, [stopAudioPlayback]);

  const handleToggleSession = useCallback(async () => {
    if (sessionState !== SessionState.Idle) {
      await closeSession();
      return;
    }

    try {
      setSessionState(SessionState.Listening);
      updateStreak();
      setTranscript([]); // Clear previous conversation

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      
      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
          systemInstruction: SYSTEM_INSTRUCTION,
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            mediaStreamSourceRef.current = inputAudioContextRef.current!.createMediaStreamSource(stream);
            scriptProcessorRef.current = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
            
            scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
              const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
              const pcmBlob = createPcmBlob(inputData);
              sessionPromise.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };

            mediaStreamSourceRef.current.connect(scriptProcessorRef.current);
            scriptProcessorRef.current.connect(inputAudioContextRef.current!.destination);
          },
          onmessage: handleMessage,
          onerror: (e: Error) => {
            console.error('API Error:', e);
            closeSession();
          },
          onclose: () => {
             console.log('Session closed.');
          },
        },
      });
      sessionRef.current = await sessionPromise;

    } catch (error) {
      console.error('Failed to start session:', error);
      alert('Could not start microphone. Please grant permission and try again.');
      setSessionState(SessionState.Idle);
    }
  }, [sessionState, closeSession, handleMessage, updateStreak]);

  return (
    <>
      <div className="flex flex-col h-screen w-full max-w-3xl mx-auto p-4 text-gray-800 dark:text-gray-200 font-sans">
        <header className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-4 mb-4">
          <div className="flex items-center gap-3">
              <SparklesIcon className="w-8 h-8 text-indigo-500" />
              <h1 className="text-2xl font-bold">Fluentify AI</h1>
          </div>
          <div className="flex items-center gap-4">
            <MotivationTracker streak={streak} />
            <button onClick={() => setAvatarModalOpen(true)} className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900" title="Change your avatar">
                <UserAvatar avatar={userAvatar} className="w-10 h-10" />
            </button>
          </div>
        </header>

        <main className="flex-grow overflow-y-auto mb-4 pr-2">
          {transcript.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 dark:text-gray-400">
                  <MicIcon className="w-24 h-24 mb-4"/>
                  <h2 className="text-xl font-semibold">Welcome to your English practice session!</h2>
                  <p>Click the microphone button below to start a conversation.</p>
              </div>
          ) : (
              <Transcript messages={transcript} userAvatar={userAvatar} />
          )}
        </main>

        <footer className="flex justify-center items-center pt-4">
          <MicButton sessionState={sessionState} onClick={handleToggleSession} />
        </footer>
      </div>
      <AvatarSelector 
        isOpen={isAvatarModalOpen}
        onClose={() => setAvatarModalOpen(false)}
        onSelectAvatar={handleSelectAvatar}
        currentAvatar={userAvatar}
      />
    </>
  );
};

export default App;
