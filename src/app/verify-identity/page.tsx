"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Video, UploadCloud, CheckCircle, RefreshCw, Eraser, AlertCircle, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import SignatureCanvas from 'react-signature-canvas';

export default function VerifyIdentityPage() {
    const [darkMode, setDarkMode] = useState(false);
    const [recording, setRecording] = useState(false);
    const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
    const [idFrontFile, setIdFrontFile] = useState<File | null>(null);
    const [idBackFile, setIdBackFile] = useState<File | null>(null);
    const [idType, setIdType] = useState('NATIONAL_ID');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [isVerified, setIsVerified] = useState(false);
    const [loading, setLoading] = useState(true);

    const videoRef = useRef<HTMLVideoElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    
    // 3 Signature Pads
    const sigCanvas1Ref = useRef<any>(null);
    const sigCanvas2Ref = useRef<any>(null);
    const sigCanvas3Ref = useRef<any>(null);

    const router = useRouter();

    useEffect(() => {
        const checkStatus = async () => {
            try {
                const res = await api.get('/auth/me');
                if (res.data.isVerified) {
                    setIsVerified(true);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        checkStatus();
        
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') setDarkMode(true);
    }, []);

    const startCamera = async () => {
        try {
            setError('');
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            setError('Could not access camera/microphone. Please check permissions.');
        }
    };

    const startRecording = () => {
        if (!streamRef.current) {
            startCamera().then(() => {
                if (streamRef.current) beginRecording(streamRef.current);
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

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
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
                }, 'image/jpeg', 0.6);
            };
            img.onerror = (error) => reject(error);
        });
    };

    const handleSubmit = async () => {
        if (!videoBlob || !idFrontFile || !idBackFile) {
            setError('Please complete the video recording and upload both sides of your ID.');
            return;
        }

        if (sigCanvas1Ref.current?.isEmpty() || sigCanvas2Ref.current?.isEmpty() || sigCanvas3Ref.current?.isEmpty()) {
            setError('Please provide all 3 signature samples.');
            return;
        }

        setSubmitting(true);
        setError('');

        try {
            const formData = new FormData();
            formData.append('idType', idType);
            
            const compressedFront = await compressImage(idFrontFile);
            const compressedBack = await compressImage(idBackFile);
            formData.append('idFront', compressedFront);
            formData.append('idBack', compressedBack);
            
            const compressedVideo = new File([videoBlob], "consent.webm", { type: "video/webm" });
            formData.append('video', compressedVideo);

            // Use the third signature as the master signature
            const masterSignatureUrl = sigCanvas3Ref.current?.getTrimmedCanvas().toDataURL('image/png');
            formData.append('masterSignatureUrl', masterSignatureUrl);

            await api.post('/users/verify', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setSuccess(true);
            setIsVerified(true);
        } catch (err: any) {
            console.error('Error verifying identity:', err);
            setError(err.response?.data?.message || 'Failed to verify identity. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className={`min-h-screen flex ${darkMode ? 'bg-slate-900' : 'bg-slate-50'}`}>
                <Sidebar darkMode={darkMode} toggleTheme={() => setDarkMode(!darkMode)} user={{}} />
                <main className="flex-1 p-8 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
                </main>
            </div>
        );
    }

    return (
        <div className={`min-h-screen flex ${darkMode ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
            <Sidebar darkMode={darkMode} toggleTheme={() => setDarkMode(!darkMode)} user={{}} />
            <main className="flex-1 p-8 max-w-5xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <ShieldCheck className="w-8 h-8 text-primary-600" />
                        Identity Verification
                    </h1>
                    <p className={`mt-2 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        Complete your identity verification early to sign future documents effortlessly.
                    </p>
                </div>

                {isVerified ? (
                    <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center text-green-800">
                        <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
                        <h2 className="text-2xl font-bold mb-2">Identity Verified</h2>
                        <p>You have successfully completed your identity verification. You can now sign documents seamlessly.</p>
                        <button 
                            onClick={() => router.push('/documents')}
                            className="mt-6 px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700"
                        >
                            Go to Documents
                        </button>
                    </div>
                ) : (
                    <div className="space-y-8 pb-20">
                        {error && (
                            <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-2 border border-red-100">
                                <AlertCircle className="w-5 h-5" />
                                {error}
                            </div>
                        )}

                        {/* ID Uploads */}
                        <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <UploadCloud className="w-5 h-5 text-primary-600" />
                                1. Upload National ID
                            </h3>
                            <select 
                                value={idType}
                                onChange={(e) => setIdType(e.target.value)}
                                className={`w-full p-3 rounded-xl border mb-4 focus:ring-2 focus:ring-primary-500 outline-none transition-all ${
                                    darkMode ? 'bg-slate-700 border-slate-600 text-slate-200' : 'bg-slate-50 border-slate-200'
                                }`}
                            >
                                <option value="NATIONAL_ID">National ID Card</option>
                                <option value="PASSPORT">Passport</option>
                                <option value="DRIVING_LICENSE">Driving License</option>
                            </select>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Front Page</label>
                                    <input 
                                        type="file" 
                                        accept="image/*"
                                        onChange={(e) => setIdFrontFile(e.target.files?.[0] || null)}
                                        className={`w-full p-2 border rounded-xl text-sm ${darkMode ? 'border-slate-600 bg-slate-700' : 'border-slate-200'}`} 
                                    />
                                </div>
                                <div>
                                    <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Back Page</label>
                                    <input 
                                        type="file" 
                                        accept="image/*"
                                        onChange={(e) => setIdBackFile(e.target.files?.[0] || null)}
                                        className={`w-full p-2 border rounded-xl text-sm ${darkMode ? 'border-slate-600 bg-slate-700' : 'border-slate-200'}`} 
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Video Attestation */}
                        <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <Video className="w-5 h-5 text-primary-600" />
                                2. Video Attestation (5 Seconds)
                            </h3>
                            <p className="text-sm mb-4 text-slate-500">Record a 5-second video clearly showing your face to confirm your identity.</p>
                            
                            <div className="relative aspect-video bg-black rounded-xl overflow-hidden mb-4 max-w-xl mx-auto">
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
                                {recording && (
                                    <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium animate-pulse">
                                        <div className="w-2 h-2 bg-white rounded-full" /> Recording...
                                    </div>
                                )}
                            </div>
                            
                            <div className="flex justify-center gap-4">
                                {!videoBlob ? (
                                    <button 
                                        onClick={startRecording}
                                        disabled={recording}
                                        className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                                    >
                                        <Video className="w-4 h-4" /> 
                                        {recording ? 'Recording (5s)...' : 'Start Recording'}
                                    </button>
                                ) : (
                                    <button 
                                        onClick={() => { setVideoBlob(null); startCamera(); }}
                                        className={`px-6 py-2 border rounded-lg font-medium transition-colors flex items-center gap-2 ${
                                            darkMode ? 'border-slate-600 hover:bg-slate-700' : 'border-slate-200 hover:bg-slate-50'
                                        }`}
                                    >
                                        <RefreshCw className="w-4 h-4" /> Retake Video
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Signature Consistency */}
                        <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                            <h3 className="text-lg font-bold mb-4">
                                3. Signature Consistency (Sign 3 Times)
                            </h3>
                            <p className="text-sm mb-6 text-slate-500">Please provide 3 samples of your signature. This helps us ensure consistency and creates your master signature.</p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {[sigCanvas1Ref, sigCanvas2Ref, sigCanvas3Ref].map((ref, idx) => (
                                    <div key={idx} className="relative">
                                        <div className="text-sm font-semibold mb-2">Sample {idx + 1}</div>
                                        <div className="border-2 border-dashed border-slate-300 rounded-xl bg-white overflow-hidden">
                                            <SignatureCanvas 
                                                ref={ref}
                                                penColor="black"
                                                canvasProps={{ className: 'w-full h-40 cursor-crosshair' }}
                                            />
                                        </div>
                                        <button 
                                            onClick={() => ref.current?.clear()}
                                            className="absolute top-8 right-2 p-1.5 bg-slate-100 rounded-lg text-slate-500 hover:bg-slate-200 hover:text-red-500 transition-colors"
                                            title="Clear"
                                        >
                                            <Eraser className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <button
                                onClick={handleSubmit}
                                disabled={submitting}
                                className="px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold transition-all shadow-md disabled:opacity-70 flex items-center gap-2"
                            >
                                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                                {submitting ? 'Verifying...' : 'Complete Verification'}
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
