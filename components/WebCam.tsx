// components/WebcamCapture.tsx
'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';

const WebcamCapture: React.FC = () => {
  const webcamRef = useRef<Webcam | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user'); // 'user' = front camera, 'environment' = back camera

  // State เพื่อเก็บขนาดของ Webcam Container ที่ responsive
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [containerHeight, setContainerHeight] = useState<number>(0);

  // Hook เพื่อคำนวณขนาด container ตามขนาดหน้าจอ
  useEffect(() => {
    const handleResize = () => {
      // ใช้ window.innerWidth เพื่อกำหนดความกว้างสูงสุดที่เหมาะสมกับหน้าจอ
      // เช่น 90% ของ viewport width แต่ไม่เกิน 640px
      const maxWidth = 640;
      const calculatedWidth = Math.min(window.innerWidth * 0.9, maxWidth);
      
      // รักษาสัดส่วน 4:3 หรือ 16:9 ของกล้อง
      // ถ้ากล้องหลักใช้ 640x480 (4:3) หรือ 1280x720 (16:9)
      const aspectRatio = 4 / 3; // หรือ 16 / 9 หากต้องการสัดส่วนที่กว้างกว่า
      const calculatedHeight = calculatedWidth / aspectRatio;

      setContainerWidth(calculatedWidth);
      setContainerHeight(calculatedHeight);
    };

    // เรียกครั้งแรกเมื่อ component mount
    handleResize();

    // เพิ่ม event listener สำหรับ resize
    window.addEventListener('resize', handleResize);

    // Clean up event listener เมื่อ component unmount
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []); // [] ทำให้ Effect รันแค่ครั้งเดียวตอน Mount

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
    setFacingMode(prevMode => (prevMode === 'user' ? 'environment' : 'user'));
  }, []);

  // Constraints for the video stream
  const videoConstraints = {
    facingMode: facingMode,
    width: { ideal: containerWidth || 1280 }, // ใช้ containerWidth หรือค่าเริ่มต้นถ้ายังไม่ได้คำนวณ
    height: { ideal: containerHeight || 720 }, // ใช้ containerHeight หรือค่าเริ่มต้นถ้ายังไม่ได้คำนวณ
  };

  if (containerWidth === 0) {
    // อาจแสดง loading หรือ null เพื่อรอให้ containerWidth ถูกคำนวณ
    return <div style={{ textAlign: 'center', padding: '20px' }}>Loading camera...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px' }}>
      <h2>Webcam Capture with Overlay Frame</h2>

      {/* ถ้ายังไม่มีรูปที่ถ่าย หรือต้องการถ่ายใหม่ */}
      {!imageSrc && (
        <div style={{
          position: 'relative',
          marginBottom: '20px',
          border: '1px solid #ccc',
          borderRadius: '8px',
          overflow: 'hidden',
          width: containerWidth,  // ใช้ความกว้างที่คำนวณได้
          height: containerHeight, // ใช้ความสูงที่คำนวณได้
          maxWidth: '100%', // ไม่ให้เกินความกว้างของ parent
        }}>
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={videoConstraints}
            width={containerWidth}  // กำหนดความกว้างของวิดีโอให้ตรงกับ container
            height={containerHeight} // กำหนดความสูงของวิดีโอให้ตรงกับ container
            style={{ display: 'block', objectFit: 'cover' }} // objectFit: 'cover' เพื่อให้เต็มพื้นที่โดยไม่ผิดสัดส่วน
          />

          {/* ----- นี่คือส่วนของกรอบ Overlay ----- */}
          <div style={{
            position: 'absolute',
            top: '10%',
            left: '10%',
            width: '80%',
            height: '80%',
            border: '5px solid #FFD700',
            boxSizing: 'border-box',
            pointerEvents: 'none',
            borderRadius: '15px',
          }}>
            <div style={{
              position: 'absolute',
              top: '-25px',
              left: '50%',
              transform: 'translateX(-50%)',
              color: '#FFD700',
              fontSize: '14px',
              fontWeight: 'bold',
              backgroundColor: 'rgba(0,0,0,0.6)',
              padding: '2px 8px',
              borderRadius: '5px'
            }}>
              Adjust your face here
            </div>
          </div>
          {/* ---------------------------------- */}
        </div>
      )}

      {/* แสดงรูปที่ถ่ายได้ */}
      {imageSrc && (
        <div style={{
          marginBottom: '20px',
          border: '1px solid #ccc',
          borderRadius: '8px',
          overflow: 'hidden'
        }}>
          <h3>Captured Image:</h3>
          <img
            src={imageSrc}
            alt="Captured"
            style={{
              width: '100%',
              maxWidth: `${containerWidth}px`, // ใช้ containerWidth เป็น max-width
              height: 'auto', // รักษาสัดส่วน
              borderRadius: '8px'
            }}
          />
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