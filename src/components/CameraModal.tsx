import React, { useRef, useEffect, useState } from 'react';
import { X, Camera } from 'lucide-react';

interface CameraModalProps {
    onCapture: (file: File) => void;
    onClose: () => void;
}

export const CameraModal: React.FC<CameraModalProps> = ({ onCapture, onClose }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let stream: MediaStream | null = null;

        const startCamera = async () => {
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'environment' } // Prefer back camera on mobile
                });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            } catch (err) {
                console.error("Camera error:", err);
                setError("Kamera konnte nicht gestartet werden. Bitte Berechtigungen prüfen.");
            }
        };

        startCamera();

        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const handleCapture = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;

            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

                canvas.toBlob((blob) => {
                    if (blob) {
                        const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
                        onCapture(file);
                    }
                }, 'image/jpeg', 0.8);
            }
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.8)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
        }}>
            <div style={{
                backgroundColor: 'var(--bg-card)',
                padding: '1rem',
                borderRadius: '1rem',
                maxWidth: '600px',
                width: '100%',
                position: 'relative'
            }}>
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '0.5rem',
                        right: '0.5rem',
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-primary)',
                        cursor: 'pointer'
                    }}
                >
                    <X size={24} />
                </button>

                <h2 style={{ marginBottom: '1rem', textAlign: 'center' }}>Foto aufnehmen</h2>

                {error ? (
                    <div style={{ color: 'var(--danger)', textAlign: 'center', padding: '2rem' }}>
                        {error}
                    </div>
                ) : (
                    <div style={{
                        width: '100%',
                        height: '0',
                        paddingBottom: '75%', // 4:3 aspect ratio
                        position: 'relative',
                        backgroundColor: '#000',
                        borderRadius: '0.5rem',
                        overflow: 'hidden',
                        marginBottom: '1rem'
                    }}>
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover'
                            }}
                        />
                    </div>
                )}

                <canvas ref={canvasRef} style={{ display: 'none' }} />

                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <button
                        className="btn btn-primary"
                        onClick={handleCapture}
                        disabled={!!error}
                        style={{
                            borderRadius: '50%',
                            width: '64px',
                            height: '64px',
                            padding: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <Camera size={32} />
                    </button>
                </div>
            </div>
        </div>
    );
};
