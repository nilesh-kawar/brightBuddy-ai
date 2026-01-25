'use client';
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Mascot from '@/components/Mascot';
import PermissionModal from '@/components/PermissionModal';
import { ArrowLeft, Ear, BrainCircuit, Volume2, Mic } from 'lucide-react';
import Link from 'next/link';
import { encodeWAV } from '@/utils/wavUtils';

export default function ChatPage() {
    const [mascotState, setMascotState] = useState('idle');
    const [statusText, setStatusText] = useState('Initializing...');
    const [showPermissionModal, setShowPermissionModal] = useState(false);
    const [hasPermission, setHasPermission] = useState(false);


    // VAD & State Refs
    const isAiSpeakingRef = useRef(false);
    const isProcessingRef = useRef(false);
    const silenceTimerRef = useRef(null);
    const mediaStreamRef = useRef(null);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const processorRef = useRef(null);
    const audioChunksRef = useRef([]);
    const audioPlayerRef = useRef(null);

    // Constants
    const SILENCE_THRESHOLD = 1200; // ms (Balanced for natural pauses)
    const VOLUME_THRESHOLD = 0.04; // Increased to 0.04 to ignore background noise

    // 1. Initial Check on Mount
    useEffect(() => {
        checkPermissionAndStart();
        return () => cleanupAudio();
    }, []);

    const cleanupAudio = () => {
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
        }
        if (audioContextRef.current) {
            audioContextRef.current.close();
        }
    };

    const checkPermissionAndStart = async () => {
        // Show modal immediately as a visual cue
        setShowPermissionModal(true);

        try {
            // Try to trigger the native prompt immediately
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            // If user allowed:
            stream.getTracks().forEach(track => track.stop());
            setHasPermission(true);
            setShowPermissionModal(false);
            startSession();
        } catch (e) {
            // User denied or browser blocked auto-request (requires gesture)
            // Modal remains open for manual button click
            console.log("Auto-prompt failed/denied", e);
        }
    };

    const handleGrantPermission = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            // Stop immediately, we just wanted to trigger the browser prompt and get "granted" state
            stream.getTracks().forEach(track => track.stop());

            setHasPermission(true);
            setShowPermissionModal(false);
            startSession();
        } catch (err) {
            console.error("Permission denied", err);
            setStatusText("Need Mic Access");
        }
    };

    // 2. Start the Session Flow
    const startSession = async () => {
        setStatusText("Getting ready...");
        setMascotState('greeting');

        // 1. Generate Greeting Audio
        try {
            const formData = new FormData();
            formData.append('text', "Hi Nilesh, kaise ho? Aaj kya kiya tumne?");

            const response = await fetch('/api/respond', { method: 'POST', body: formData });
            const data = await response.json();

            if (data.audioUrl) {
                // Play greeting
                playResponse(data.audioUrl);
            } else {
                // Fallback if TTS fails
                setMascotState('idle');
                startVAD();
            }
        } catch (e) {
            console.error("Greeting failed", e);
            setMascotState('idle');
            startVAD();
        }
    };

    // 3. VAD Logic (The Core Loop)
    const startVAD = async () => {
        if (isAiSpeakingRef.current || isProcessingRef.current) return;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream;

            // Setup Analysis & Recording
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            audioContextRef.current = audioContext;

            const source = audioContext.createMediaStreamSource(stream);
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 512;
            analyserRef.current = analyser;

            // Processor for raw data (bufferSize, inputChannels, outputChannels)
            const bufferSize = 4096;
            const processor = audioContext.createScriptProcessor(bufferSize, 1, 1);
            processorRef.current = processor;
            audioChunksRef.current = []; // Store Float32Arrays

            processor.onaudioprocess = (e) => {
                if (isAiSpeakingRef.current || isProcessingRef.current) return;
                const inputData = e.inputBuffer.getChannelData(0);
                // We must copy the data, as the buffer is reused
                audioChunksRef.current.push(new Float32Array(inputData));
            };

            // Connect graph: Source -> Analyser -> Processor -> Destination (mute)
            // Note: Processor must be connected to destination for onaudioprocess to fire in some browsers
            source.connect(analyser);
            analyser.connect(processor);
            processor.connect(audioContext.destination);

            setMascotState('listening');
            setStatusText("Listening...");

            monitorVolume();

        } catch (err) {
            console.error("VAD Setup Error", err);
        }
    };

    const monitorVolume = () => {
        if (!analyserRef.current || !analyserRef.current.getByteTimeDomainData) return;

        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyserRef.current.getByteTimeDomainData(dataArray);

        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
            const x = (dataArray[i] - 128) / 128.0;
            sum += x * x;
        }
        const rms = Math.sqrt(sum / bufferLength);

        // If volume > threshold, reset silence timer
        if (rms > VOLUME_THRESHOLD) {
            if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = setTimeout(() => {
                stopVAD();
            }, SILENCE_THRESHOLD);
        }

        if (mediaStreamRef.current?.active && !isProcessingRef.current) {
            requestAnimationFrame(monitorVolume);
        }
    };

    const stopVAD = () => {
        // Stop tracks
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
        }
        // Disconnect nodes
        if (processorRef.current) {
            processorRef.current.disconnect();
            processorRef.current = null;
        }
        if (analyserRef.current) {
            analyserRef.current.disconnect();
        }
        // Close context (stops processing)
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close().then(() => {
                processAudio();
            });
        } else {
            processAudio();
        }
    };

    // 4. Process & Response
    const processAudio = async () => {
        if (audioChunksRef.current.length === 0) {
            startVAD();
            return;
        }

        isProcessingRef.current = true;
        setMascotState('thinking');
        setStatusText("Thinking...");

        // 1. Flatten the chunks
        const totalLength = audioChunksRef.current.reduce((acc, chunk) => acc + chunk.length, 0);
        const mergedBuffer = new Float32Array(totalLength);
        let offset = 0;
        for (const chunk of audioChunksRef.current) {
            mergedBuffer.set(chunk, offset);
            offset += chunk.length;
        }

        // 2. Encode to WAV
        // Note: AudioContext default is usually 44100 or 48000.
        // We use the context's sample rate.
        const sampleRate = audioContextRef.current?.sampleRate || 44100;
        const wavDataView = encodeWAV(mergedBuffer, sampleRate);
        const audioBlob = new Blob([wavDataView], { type: 'audio/wav' });

        const formData = new FormData();
        formData.append('audio', audioBlob);

        try {
            const response = await fetch('/api/respond', { method: 'POST', body: formData });
            const data = await response.json();

            if (data.audioUrl) {
                playResponse(data.audioUrl);
            } else {
                // No audio? Loop back.
                isProcessingRef.current = false;
                startVAD();
            }
        } catch (err) {
            console.error("API Error", err);
            isProcessingRef.current = false;
            startVAD(); // Retry loop
        }
    };

    const playResponse = (audioSrc) => {
        if (audioPlayerRef.current) {
            isAiSpeakingRef.current = true;

            // Note: isProcessingRef stays false, but isAiSpeakingRef is true to block VAD

            audioPlayerRef.current.src = audioSrc;
            audioPlayerRef.current.play();

            setMascotState('talking');
            setStatusText("Speaking...");

            audioPlayerRef.current.onended = () => {
                isAiSpeakingRef.current = false;
                isProcessingRef.current = false; // Just to be safe
                // LOOP: Start Listening Again
                startVAD();
            };
        }
    };

    return (
        <main className="flex flex-col items-center min-h-screen bg-gradient-to-b from-[#E0F7FA] to-[#B2EBF2] relative overflow-hidden">

            <PermissionModal
                isOpen={showPermissionModal}
                onGrant={handleGrantPermission}
            />

            <audio ref={audioPlayerRef} className="hidden" />

            {/* Back Button */}
            <Link href="/" className="absolute top-6 left-6 z-20">
                <button className="bg-white/80 p-3 rounded-full shadow-sm hover:bg-white transition-colors">
                    <ArrowLeft className="text-text-navy w-6 h-6" />
                </button>
            </Link>

            {/* Header */}
            <div className="pt-8 pb-4 z-10 text-center select-none">
                <h2 className="text-2xl font-extrabold text-[#00838F]">{statusText}</h2>
            </div>

            {/* Mascot */}
            <div className="flex-1 flex items-center justify-center w-full z-10 transition-all duration-500">
                <Mascot state={mascotState} />
            </div>

            {/* Visualizer / Status Indicator */}
            <div className="w-full pb-12 flex flex-col items-center justify-center gap-6 z-10">
                {/* Dynamic State Indicator Button */}
                <motion.button
                    onClick={mascotState === 'listening' ? stopVAD : null}
                    whileTap={mascotState === 'listening' ? { scale: 0.9 } : {}}
                    className={`w-24 h-24 rounded-full flex items-center justify-center shadow-xl transition-all duration-500 scale-110 
                        ${mascotState === 'listening' ? 'bg-red-500 cursor-pointer animate-pulse' :
                            mascotState === 'thinking' ? 'bg-purple-500' :
                                mascotState === 'talking' ? 'bg-green-500' : 'bg-primary-yellow'
                        }`}
                >
                    {mascotState === 'listening' && <Ear className="w-10 h-10 text-white" />}
                    {mascotState === 'thinking' && <BrainCircuit className="w-10 h-10 text-white animate-spin-slow" />}
                    {mascotState === 'talking' && <Volume2 className="w-10 h-10 text-white animate-bounce" />}
                    {(mascotState === 'idle' || mascotState === 'greeting') && <Mic className="w-10 h-10 text-white" />}
                </motion.button>

                <p className="text-text-navy/60 font-bold text-sm">
                    {mascotState === 'listening' ? 'Listening...' :
                        mascotState === 'thinking' ? 'Thinking...' :
                            mascotState === 'talking' ? 'Speaking...' : 'Ready'}
                </p>
            </div>

            <div className="absolute top-20 right-10 text-4xl opacity-20 text-white select-none">☁️</div>
            <div className="absolute bottom-40 left-10 text-5xl opacity-20 text-white select-none">☁️</div>
        </main>
    );
}
