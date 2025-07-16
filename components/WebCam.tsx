// components/WebcamCapture.tsx
'use client'; // This component uses client-side features (hooks, DOM access)

import React, { useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';

const WebcamCapture: React.FC = () => {
  const webcamRef = useRef<Webcam | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user'); // 'user' = front camera, 'environment' = back camera

  // Function to capture an image
  const capture = useCallback(() => {
    if (webcamRef.current) {
      const screenshot = webcamRef.current.getScreenshot();
      setImageSrc(screenshot);
    }
  }, [webcamRef]);

  // Function to clear the captured image
  const clearImage = useCallback(() => {
    setImageSrc(null);
  }, []);

  // Function to switch camera (front/back)
  const toggleFacingMode = useCallback(() => {
    setFacing(prevMode => (prevMode === 'user' ? 'environment' : 'user'));
  }, []);

  const videoConstraints = {
    facingMode: facingMode,
    width: { ideal: 1280 }, // Example ideal width
    height: { ideal: 720 }, // Example ideal height
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px' }}>
      <h2>Webcam Capture</h2>

      {/* ถ้ายังไม่มีรูปที่ถ่าย หรือต้องการถ่ายใหม่ */}
      {!imageSrc && (
        <div style={{ marginBottom: '20px', border: '1px solid #ccc', borderRadius: '8px', overflow: 'hidden' }}>
          <Webcam
            audio={false} // ไม่ใช้เสียง
            ref={webcamRef}
            screenshotFormat="image/jpeg" // รูปแบบของภาพที่ถ่าย
            videoConstraints={videoConstraints}
            width={640} // กำหนดความกว้างของวิดีโอ
            height={480} // กำหนดความสูงของวิดีโอ
            style={{ borderRadius: '8px' }}
          />
        </div>
      )}

      {/* แสดงรูปที่ถ่ายได้ */}
      {imageSrc && (
        <div style={{ marginBottom: '20px', border: '1px solid #ccc', borderRadius: '8px', overflow: 'hidden' }}>
          <h3>Captured Image:</h3>
          <img src={imageSrc} alt="Captured" style={{ width: '100%', maxWidth: '640px', borderRadius: '8px' }} />
        </div>
      )}

      {/* ปุ่มควบคุม */}
      <div style={{ display: 'flex', gap: '10px' }}>
        {!imageSrc ? (
          <>
            <button
              onClick={capture}
              style={{ padding: '10px 20px', fontSize: '16px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
            >
              Capture Photo
            </button>
            <button
              onClick={toggleFacingMode}
              style={{ padding: '10px 20px', fontSize: '16px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
            >
              Switch Camera ({facingMode === 'user' ? 'Front' : 'Back'})
            </button>
          </>
        ) : (
          <button
            onClick={clearImage}
            style={{ padding: '10px 20px', fontSize: '16px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
          >
            Retake Photo
          </button>
        )}
      </div>
    </div>
  );
};

export default WebcamCapture;

function setFacing(arg0: (prevMode: any) => "environment" | "user") {
    throw new Error('Function not implemented.');
}
