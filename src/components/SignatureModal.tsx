"use client";

import React, { useState, useRef, useEffect } from 'react';
import { X, Video, Square, CheckCircle, UploadCloud, RefreshCw, Eraser, AlertCircle, ShieldCheck } from 'lucide-react';
import api from '@/lib/api';
import SignatureCanvas from 'react-signature-canvas';

interface SignatureModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    documentId: string;
    darkMode: boolean;
}

export default function SignatureModal({ isOpen, onClose, onSuccess, documentId, darkMode }: SignatureModalProps) {
    const [recording, setRecording] = useState(false);
    const [recordingSeconds, setRecordingSeconds] = useState(5);
    const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [stampType, setStampType] = useState('APPROVED');
    const [idType, setIdType] = useState('NATIONAL_ID');
    const [idFrontFile, setIdFrontFile] = useState<File | null>(null);
    const [idBackFile, setIdBackFile] = useState<File | null>(null);
    const [isVerified, setIsVerified] = useState(false);
    const [cameraActive, setCameraActive] = useState(false);
    
    const videoRef = useRef<HTMLVideoElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const sigCanvasRef = useRef<any>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!isOpen) {
            stopCamera();
            setVideoBlob(null);
            setError('');
            setRecording(false);
            if (timerRef.current) clearInterval(timerRef.current);
        } else {
            // Check identity status
            const checkIdentity = async () => {
                try {
                    const res = await api.get('/auth/me');
                    setIsVerified(!!res.data.isVerified || !!res.data.isIdentityVerified);
                } catch (err) {
                    console.error('Error checking identity:', err);
                }
            };
            checkIdentity();
            startCamera();
        }
        return () => {
            stopCamera();
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isOpen]);

    // Ensure video stream connects to video element when mounted/opened
    useEffect(() => {
        if (isOpen && videoRef.current && streamRef.current && !videoBlob) {
            videoRef.current.srcObject = streamRef.current;
        }
    }, [isOpen, videoBlob, cameraActive]);

    const startCamera = async (): Promise<MediaStream | null> => {
        try {
            setError('');
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            streamRef.current = stream;
            setCameraActive(true);
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            return stream;
        } catch (err: any) {
            console.warn('Could not access camera/mic with audio, retrying video only:', err);
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
                streamRef.current = stream;
                setCameraActive(true);
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
                return stream;
            } catch (err2: any) {
                console.error('Error accessing camera:', err2);
                setCameraActive(false);
                return null;
            }
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setCameraActive(false);
    };

    const startRecording = async () => {
        setError('');
        let stream = streamRef.current;
        if (!stream) {
            stream = await startCamera();
        }
        if (!stream) {
            setError('Could not access camera/microphone. Please allow camera permissions in your browser.');
            return;
        }
        beginRecording(stream);
    };

    const beginRecording = (stream: MediaStream) => {
        try {
            let options: MediaRecorderOptions = {};
            if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) {
                options = { mimeType: 'video/webm;codecs=vp8', videoBitsPerSecond: 250000 };
            } else if (MediaRecorder.isTypeSupported('video/webm')) {
                options = { mimeType: 'video/webm' };
            } else if (MediaRecorder.isTypeSupported('video/mp4')) {
                options = { mimeType: 'video/mp4' };
            }

            const mediaRecorder = new MediaRecorder(stream, options);
            mediaRecorderRef.current = mediaRecorder;
            
            const chunks: BlobPart[] = [];
            mediaRecorder.ondataavailable = (e) => {
                if (e.data && e.data.size > 0) chunks.push(e.data);
            };
            
            mediaRecorder.onstop = () => {
                const mimeType = mediaRecorder.mimeType || 'video/webm';
                const blob = new Blob(chunks, { type: mimeType });
                setVideoBlob(blob);
                setRecording(false);
                stopCamera();
            };

            mediaRecorder.start();
            setRecording(true);
            setRecordingSeconds(5);

            if (timerRef.current) clearInterval(timerRef.current);
            timerRef.current = setInterval(() => {
                setRecordingSeconds((prev) => {
                    if (prev <= 1) {
                        if (timerRef.current) clearInterval(timerRef.current);
                        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                            stopRecording();
                        }
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } catch (err: any) {
            console.error('Error starting MediaRecorder:', err);
            setError('Failed to record video consent: ' + (err.message || 'MediaRecorder unsupported.'));
        }
    };

    const stopRecording = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
        }
        setRecording(false);
    };

    const retakeVideo = () => {
        setVideoBlob(null);
        startCamera();
    };

    const compressImage = async (file: File): Promise<File> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = URL.createObjectURL(file);
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 800;
                const scaleSize = MAX_WIDTH / img.width;
                canvas.width = MAX_WIDTH;
                canvas.height = img.height * scaleSize;
                
                const ctx = canvas.getContext('2d', { willReadFrequently: true });
                ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
                
                canvas.toBlob((blob) => {
                    if (blob) {
                        resolve(new File([blob], file.name, { type: 'image/jpeg' }));
                    } else {
                        reject(new Error('Canvas to Blob failed'));
                    }
                }, 'image/jpeg', 0.6); // 60% quality
            };
            img.onerror = (error) => reject(error);
        });
    };

    const handleSubmit = async () => {
        setError('');

        // Validate video recording
        if (!videoBlob) {
            setError('Please record your 5-second video consent first.');
            return;
        }

        // Validate signature on signing board
        let signatureImage: string | null = null;
        if (sigCanvasRef.current && !sigCanvasRef.current.isEmpty()) {
            signatureImage = sigCanvasRef.current.getTrimmedCanvas().toDataURL('image/png');
        }

        if (!signatureImage) {
            setError('Please draw your signature on the signing board before submitting.');
            return;
        }

        // Validate ID uploads if user is not pre-verified
        if (!isVerified) {
            if (!idFrontFile || !idBackFile) {
                setError('Please upload both the front and back images of your ID credential.');
                return;
            }
        }

        setSubmitting(true);

        try {
            if (!isVerified) {
                // Upload video & ID docs via proxy verification
                const formData = new FormData();
                formData.append('video', videoBlob);
                formData.append('idType', idType);
                if (idFrontFile) formData.append('idFront', await compressImage(idFrontFile));
                if (idBackFile) formData.append('idBack', await compressImage(idBackFile));
                
                const verifyRes = await api.post('/proxy-identity-verify', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });

                const { videoUrl, nationalIdFrontUrl, nationalIdBackUrl, idType: returnedIdType } = verifyRes.data;

                // Sign document with certificate and biometric proof
                await api.post(`/documents/${documentId}/sign`, { 
                    signatureImage,
                    stampType,
                    videoUrl,
                    nationalIdFrontUrl,
                    nationalIdBackUrl,
                    idType: returnedIdType
                });
            } else {
                // Pre-verified user: convert videoBlob to base64 for tamper-proof storage
                let videoUrl: string | null = null;
                if (videoBlob) {
                    const reader = new FileReader();
                    videoUrl = await new Promise<string>((resolve) => {
                        reader.onloadend = () => resolve(reader.result as string);
                        reader.readAsDataURL(videoBlob);
                    });
                }

                await api.post(`/documents/${documentId}/sign`, { 
                    signatureImage,
                    stampType,
                    videoUrl
                });
            }
            
            onSuccess();
            onClose();
        } catch (err: any) {
            console.error('Error signing document:', err);
            setError(err.response?.data?.message || 'Failed to submit signature. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <div className={`relative w-full max-w-xl max-h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden my-auto ${
                darkMode ? 'bg-slate-900 border border-slate-800' : 'bg-white'
            }`}>
                
                {/* Header */}
                <div className={`px-6 py-4 border-b flex justify-between items-center shrink-0 ${
                    darkMode ? 'border-slate-800 bg-slate-900/50' : 'border-slate-100 bg-slate-50'
                }`}>
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-primary-500/10 text-primary-500">
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className={`text-base font-bold ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                                Video Consent Signature
                            </h3>
                            <p className={`text-[11px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                Biometric Video Attestation & Cryptographic Signing
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className={`p-1.5 rounded-lg transition-colors ${
                            darkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-200 text-slate-500'
                        }`}
                        title="Close"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 flex flex-col overflow-y-auto space-y-4">
                    {error && (
                        <div className="p-3 text-xs rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Verified Status Banner */}
                    {isVerified ? (
                        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20 text-xs font-semibold">
                            <CheckCircle className="w-4 h-4 shrink-0 text-green-500" />
                            <span>National ID Pre-Verified. Please record your 5-second video consent and draw your signature below.</span>
                        </div>
                    ) : (
                        <p className={`text-xs text-center ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                            Record a short 5-second video stating your consent, and draw your signature on the signing board.
                        </p>
                    )}

                    {/* Video Area (Always Visible) */}
                    <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                            <label className={`block text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                1. Biometric Video Consent
                            </label>
                            {videoBlob && (
                                <span className="text-[11px] font-semibold text-green-500 flex items-center gap-1">
                                    <CheckCircle className="w-3.5 h-3.5" /> Video Recorded
                                </span>
                            )}
                        </div>

                        <div className={`relative w-full aspect-video rounded-xl overflow-hidden flex items-center justify-center border ${
                            darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-900 border-slate-200'
                        }`}>
                            {!videoBlob && (
                                <video 
                                    ref={videoRef} 
                                    autoPlay 
                                    muted 
                                    playsInline
                                    className="w-full h-full object-cover"
                                />
                            )}
                            
                            {videoBlob && (
                                <video 
                                    src={URL.createObjectURL(videoBlob)} 
                                    controls 
                                    className="w-full h-full object-cover"
                                />
                            )}

                            {!videoBlob && !cameraActive && !recording && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 gap-2 bg-slate-950/90">
                                    <Video className="w-8 h-8 opacity-40" />
                                    <span className="text-xs font-medium">Camera is inactive</span>
                                    <button 
                                        type="button"
                                        onClick={startCamera}
                                        className="mt-1 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-xs text-white rounded-lg border border-slate-700 transition-colors"
                                    >
                                        Enable Camera Preview
                                    </button>
                                </div>
                            )}

                            {recording && (
                                <div className="absolute top-3 right-3 flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/90 text-white text-xs font-bold animate-pulse shadow-lg">
                                    <div className="w-2 h-2 rounded-full bg-white" />
                                    RECORDING ({recordingSeconds}s)
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Unverified Users: ID Credentials Form */}
                    {!isVerified && (
                        <div className={`p-4 rounded-xl border border-dashed flex flex-col gap-3 ${
                            darkMode ? 'border-slate-800 bg-slate-950/50' : 'border-slate-300 bg-slate-50'
                        }`}>
                            <label className={`block text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                Identification Credentials
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div>
                                    <label className={`block text-[10px] mb-1 font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>ID Type</label>
                                    <select 
                                        value={idType}
                                        onChange={(e) => setIdType(e.target.value)}
                                        className={`w-full px-2.5 py-1.5 rounded-lg border text-xs focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                                            darkMode ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
                                        }`}
                                    >
                                        <option value="NATIONAL_ID">National ID</option>
                                        <option value="PASSPORT">Passport</option>
                                        <option value="DRIVING_LICENSE">Driving License</option>
                                    </select>
                                </div>
                                <div>
                                    <label className={`block text-[10px] mb-1 font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Front Document</label>
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        onChange={(e) => setIdFrontFile(e.target.files?.[0] || null)} 
                                        className={`w-full text-[11px] file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`} 
                                    />
                                </div>
                                <div>
                                    <label className={`block text-[10px] mb-1 font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Back Document</label>
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        onChange={(e) => setIdBackFile(e.target.files?.[0] || null)} 
                                        className={`w-full text-[11px] file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`} 
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Stamp and Signing Board Grid (Always Visible) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Digital Stamp Area */}
                        <div className="flex flex-col">
                            <label className={`block text-xs font-bold mb-1.5 uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                2. Digital Stamp
                            </label>
                            <select 
                                value={stampType}
                                onChange={(e) => setStampType(e.target.value)}
                                className={`w-full px-3 py-2 rounded-xl border text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                                    darkMode 
                                        ? 'bg-slate-950 border-slate-800 text-slate-200' 
                                        : 'bg-slate-50 border-slate-200 text-slate-800'
                                }`}
                            >
                                <option value="APPROVED">APPROVED</option>
                                <option value="VERIFIED">VERIFIED</option>
                                <option value="CONFIDENTIAL">CONFIDENTIAL</option>
                                <option value="REJECTED">REJECTED</option>
                                <option value="">NO STAMP</option>
                            </select>
                            <p className={`text-[10px] mt-1.5 leading-relaxed ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                                Select the authority classification stamp embossed onto the PDF certificate.
                            </p>
                        </div>

                        {/* Signing Board Area */}
                        <div className="flex flex-col">
                            <div className="flex justify-between items-center mb-1.5">
                                <label className={`block text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                    3. Signing Board
                                </label>
                                <button 
                                    type="button"
                                    onClick={() => sigCanvasRef.current?.clear()}
                                    className={`text-xs flex items-center gap-1 font-semibold transition-colors ${
                                        darkMode ? 'text-slate-400 hover:text-red-400' : 'text-slate-500 hover:text-red-500'
                                    }`}
                                >
                                    <Eraser className="w-3.5 h-3.5" /> Clear
                                </button>
                            </div>
                            <div className={`border-2 border-dashed rounded-xl overflow-hidden cursor-crosshair transition-colors ${
                                darkMode ? 'border-slate-700 bg-slate-950' : 'border-slate-300 bg-slate-50'
                            }`}>
                                <SignatureCanvas 
                                    ref={sigCanvasRef}
                                    penColor={darkMode ? '#ffffff' : '#000000'}
                                    canvasProps={{ 
                                        className: 'w-full h-28 cursor-crosshair',
                                        style: { width: '100%', height: '112px' }
                                    }}
                                />
                            </div>
                            <p className={`text-[10px] mt-1.5 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                                Draw your official handwritten signature using mouse or touch.
                            </p>
                        </div>
                    </div>

                    {/* Action Controls */}
                    <div className="pt-2 flex flex-col sm:flex-row gap-3 w-full shrink-0 border-t border-inherit">
                        {!videoBlob ? (
                            recording ? (
                                <button 
                                    type="button"
                                    onClick={stopRecording}
                                    className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 transition-colors shadow-md"
                                >
                                    <Square className="w-4 h-4 fill-current" /> Stop Recording ({recordingSeconds}s)
                                </button>
                            ) : (
                                <button 
                                    type="button"
                                    onClick={startRecording}
                                    className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-bold text-slate-900 bg-white border border-slate-200 hover:bg-slate-100 hover:border-slate-300 transition-all shadow-sm active:scale-98"
                                >
                                    <Video className="w-4 h-4" /> Start Video Recording (5s)
                                </button>
                            )
                        ) : (
                            <>
                                <button 
                                    type="button"
                                    onClick={retakeVideo}
                                    disabled={submitting}
                                    className={`py-3 px-5 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 ${
                                        darkMode 
                                            ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' 
                                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                    }`}
                                >
                                    <RefreshCw className="w-4 h-4" /> Retake Video
                                </button>
                                
                                <button 
                                    type="button"
                                    onClick={handleSubmit}
                                    disabled={submitting}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-bold text-slate-900 bg-white border border-slate-200 hover:bg-slate-100 hover:border-slate-300 transition-all shadow-sm disabled:opacity-50 active:scale-98"
                                >
                                    {submitting ? (
                                        <UploadCloud className="w-4 h-4 animate-bounce" />
                                    ) : (
                                        <CheckCircle className="w-4 h-4" />
                                    )}
                                    {submitting ? 'Applying Signature...' : 'Apply Signature & Stamp'}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
