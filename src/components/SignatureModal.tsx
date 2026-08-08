"use client";

import React, { useState, useRef, useEffect } from 'react';
import { X, Video, Square, CheckCircle, UploadCloud, RefreshCw, Eraser } from 'lucide-react';
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
    const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [stampType, setStampType] = useState('APPROVED');
    const [idType, setIdType] = useState('NATIONAL_ID');
    const [idFrontFile, setIdFrontFile] = useState<File | null>(null);
    const [idBackFile, setIdBackFile] = useState<File | null>(null);
    const [isVerified, setIsVerified] = useState(false);
    const [loadingIdentity, setLoadingIdentity] = useState(true);
    
    const videoRef = useRef<HTMLVideoElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const sigCanvasRef = useRef<any>(null);

    useEffect(() => {
        if (!isOpen) {
            stopCamera();
            setVideoBlob(null);
            setError('');
        } else {
            // Check identity status
            const checkIdentity = async () => {
                setLoadingIdentity(true);
                try {
                    const res = await api.get('/auth/me');
                    setIsVerified(!!res.data.isIdentityVerified);
                } catch (err) {
                    console.error('Error checking identity:', err);
                } finally {
                    setLoadingIdentity(false);
                }
            };
            checkIdentity();
        }
    }, [isOpen]);

    const startCamera = async () => {
        try {
            setError('');
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err: any) {
            console.error('Error accessing media devices:', err);
            setError('Could not access camera/microphone. Please check permissions.');
        }
    };

    const startRecording = () => {
        if (!streamRef.current) {
            startCamera().then(() => {
                if (streamRef.current) {
                    beginRecording(streamRef.current);
                }
            });
        } else {
            beginRecording(streamRef.current);
        }
    };

    const beginRecording = (stream: MediaStream) => {
        let options: MediaRecorderOptions = { mimeType: 'video/webm' };
        if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) {
            options = { mimeType: 'video/webm;codecs=vp8', videoBitsPerSecond: 250000 };
        }
        const mediaRecorder = new MediaRecorder(stream, options);
        mediaRecorderRef.current = mediaRecorder;
        
        const chunks: BlobPart[] = [];
        mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunks.push(e.data);
        };
        
        mediaRecorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'video/webm' });
            setVideoBlob(blob);
            stopCamera();
        };

        mediaRecorder.start();
        setRecording(true);

        // Auto stop after 5 seconds
        setTimeout(() => {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                stopRecording();
            }
        }, 5000);
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
            setRecording(false);
        }
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

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    };

    const retakeVideo = () => {
        setVideoBlob(null);
        startCamera();
    };

    const handleSubmit = async () => {
        if (!isVerified && !videoBlob) {
            setError('Please record a video consent first.');
            return;
        }

        let signatureImage = null;
        if (sigCanvasRef.current && !sigCanvasRef.current.isEmpty()) {
            signatureImage = sigCanvasRef.current.getTrimmedCanvas().toDataURL('image/png');
        }

        setSubmitting(true);
        setError('');

        try {
            if (!isVerified) {
                // 1. Upload video and ID to verify identity
                const formData = new FormData();
                formData.append('video', videoBlob!);
                formData.append('idType', idType);
                if (idFrontFile) formData.append('idFront', await compressImage(idFrontFile));
                if (idBackFile) formData.append('idBack', await compressImage(idBackFile));
                
                await api.post('/proxy-identity-verify', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }

            // 2. Sign document
            await api.post(`/documents/${documentId}/sign`, { 
                signatureImage,
                stampType
            });
            
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className={`relative w-full max-w-lg rounded-2xl shadow-2xl flex flex-col overflow-hidden ${
                darkMode ? 'bg-slate-900 border border-slate-800' : 'bg-white'
            }`}>
                
                {/* Header */}
                <div className={`px-6 py-4 border-b flex justify-between items-center ${
                    darkMode ? 'border-slate-800 bg-slate-900/50' : 'border-slate-100 bg-slate-50'
                }`}>
                    <h3 className={`text-lg font-bold ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                        Video Consent Signature
                    </h3>
                    <button 
                        onClick={onClose}
                        className={`p-1.5 rounded-lg transition-colors ${
                            darkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-200 text-slate-500'
                        }`}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 flex flex-col items-center">
                    {loadingIdentity ? (
                        <div className="w-full flex items-center justify-center p-8">
                            <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
                        </div>
                    ) : !isVerified && (
                        <>
                            <p className={`text-sm text-center mb-6 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                To apply a legally binding signature, please record a short 5-second video clearly stating your name and your consent to approve this document.
                            </p>

                            {error && (
                                <div className="mb-4 w-full p-3 text-sm rounded-lg bg-red-500/10 text-red-500 border border-red-500/20 text-center">
                                    {error}
                                </div>
                            )}

                            {/* Video Area */}
                            <div className={`relative w-full aspect-video rounded-xl overflow-hidden mb-6 flex items-center justify-center ${
                                darkMode ? 'bg-slate-950' : 'bg-slate-100'
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

                                {!videoBlob && !streamRef.current && !recording && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 gap-2">
                                        <Video className="w-8 h-8 opacity-50" />
                                        <span className="text-sm font-medium">Camera off</span>
                                    </div>
                                )}

                                {recording && (
                                    <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/90 text-white text-xs font-bold animate-pulse">
                                        <div className="w-2 h-2 rounded-full bg-white" />
                                        RECORDING
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {/* Stamp and Signature Area (Shown after video is recorded, or immediately if verified) */}
                    {(videoBlob || isVerified) && (
                        <div className="w-full flex flex-col gap-4 mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {!isVerified && (
                                <div className="flex flex-col gap-4 mb-2">
                                    <label className={`block text-xs font-bold uppercase ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                        Identity Verification
                                    </label>
                                    <div className="flex gap-4">
                                        <div className="flex-1">
                                            <label className={`block text-[10px] mb-1 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>ID Type</label>
                                            <select 
                                                value={idType}
                                                onChange={(e) => setIdType(e.target.value)}
                                                className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                                    darkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
                                                }`}
                                            >
                                                <option value="NATIONAL_ID">National ID</option>
                                                <option value="PASSPORT">Passport</option>
                                                <option value="DRIVING_LICENSE">Driving License</option>
                                            </select>
                                        </div>
                                        <div className="flex-1 flex flex-col gap-2">
                                            <div>
                                                <label className={`block text-[10px] mb-1 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Front Page</label>
                                                <input type="file" accept="image/*" onChange={(e) => setIdFrontFile(e.target.files?.[0] || null)} className={`w-full text-xs file:mr-4 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`} />
                                            </div>
                                            <div>
                                                <label className={`block text-[10px] mb-1 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Back Page</label>
                                                <input type="file" accept="image/*" onChange={(e) => setIdBackFile(e.target.files?.[0] || null)} className={`w-full text-xs file:mr-4 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div className="h-px w-full bg-slate-200 dark:bg-slate-800 mb-2"></div>
                            
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className={`block text-xs font-bold mb-2 uppercase ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                        Digital Stamp
                                    </label>
                                    <select 
                                        value={stampType}
                                        onChange={(e) => setStampType(e.target.value)}
                                        className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold ${
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
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-center mb-2">
                                        <label className={`block text-xs font-bold uppercase ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                            Draw Signature
                                        </label>
                                        <button 
                                            onClick={() => sigCanvasRef.current?.clear()}
                                            className={`text-xs flex items-center gap-1 hover:text-blue-500 transition-colors ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}
                                        >
                                            <Eraser className="w-3 h-3" /> Clear
                                        </button>
                                    </div>
                                    <div className={`w-full h-24 rounded-xl border overflow-hidden ${
                                        darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                                    }`}>
                                        <SignatureCanvas 
                                            ref={sigCanvasRef}
                                            penColor={darkMode ? '#e2e8f0' : '#0f172a'}
                                            canvasProps={{ className: 'w-full h-full' }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Controls */}
                    <div className="flex justify-center gap-4 w-full">
                        {loadingIdentity ? null : (!videoBlob && !isVerified) ? (
                            recording ? (
                                <button 
                                    onClick={stopRecording}
                                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 transition-colors"
                                >
                                    <Square className="w-4 h-4 fill-current" /> Stop Recording
                                </button>
                            ) : (
                                <button 
                                    onClick={startRecording}
                                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-white bg-blue-500 hover:bg-blue-600 transition-colors"
                                >
                                    <Video className="w-4 h-4" /> Start Recording
                                </button>
                            )
                        ) : (
                            <>
                                {!isVerified && (
                                    <button 
                                        onClick={retakeVideo}
                                        disabled={submitting}
                                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-colors ${
                                            darkMode 
                                                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' 
                                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                    >
                                        <RefreshCw className="w-4 h-4" /> Retake
                                    </button>
                                )}
                                
                                <button 
                                    onClick={handleSubmit}
                                    disabled={submitting || (!isVerified && (!videoBlob || !idFrontFile || !idBackFile))}
                                    className="flex flex-1 items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-white bg-gradient-to-r from-primary-500 to-teal-500 hover:from-primary-400 hover:to-teal-400 transition-colors disabled:opacity-50"
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
