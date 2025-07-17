'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';

interface OcrResult {
  identification_number?: string;
  name_th?: string;
  name_en?: string;
  date_of_birth?: string;
  date_of_expiry?: string;
  raw_text?: string;
}

type VerificationStatus = 'idle' | 'capturing' | 'preview' | 'processing' | 'pass' | 'fail';

const videoConstraints = {
  width: 1280,
  height: 720,
  facingMode: "environment"
};

export default function IdCardOcrUploader() {
  const [ocrResult, setOcrResult] = useState<OcrResult | null>(null);
  const [status, setStatus] = useState<VerificationStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isImageBlurry, setIsImageBlurry] = useState<boolean>(false);

  const webcamRef = useRef<Webcam>(null);
  const [cvLoaded, setCvLoaded] = useState(false);

  // Dynamically load OpenCV.js
  useEffect(() => {
    if (!(window as any).cv) {
      const script = document.createElement('script');
      script.src = 'https://docs.opencv.org/4.x/opencv.js';
      script.async = true;
      script.onload = () => {
        // Wait for OpenCV to be ready
        (window as any).cv['onRuntimeInitialized'] = () => {
          setCvLoaded(true);
        };
      };
      document.body.appendChild(script);
    } else {
      setCvLoaded(true);
    }
  }, []);

  const startCamera = () => {
    setOcrResult(null);
    setError(null);
    setCapturedImage(null);
    setStatus('capturing');
    setIsImageBlurry(false);
  };

const handleCapture = useCallback(() => {
  console.log("เรียก handleCapture แล้ว");
  if (!webcamRef.current) return;
  const imageSrc = webcamRef.current.getScreenshot();
  if (!imageSrc) {
    setError('ไม่สามารถจับภาพได้');
    return;
  }
  setCapturedImage(imageSrc);

  // Check blur using OpenCV
  const checkImageBlurOpenCV = (imageDataUrl: string) => {
    if (!(window as any).cv) {
      setError('OpenCV.js ยังไม่โหลด กรุณารอสักครู่แล้วลองใหม่');
      return;
    }
    const cv = (window as any).cv;
    const img = new Image();
    img.src = imageDataUrl;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0);

      const src = cv.imread(canvas);
      const gray = new cv.Mat();
      cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);

      const laplacian = new cv.Mat();
      cv.Laplacian(gray, laplacian, cv.CV_64F);

      const mean = new cv.Mat();
      const stddev = new cv.Mat();
      cv.meanStdDev(laplacian, mean, stddev);

      const variance = Math.pow(stddev.doubleAt(0, 0), 2);

      console.log('OpenCV.js Variance:', variance);

      const blurryThreshold = 100;  // ตั้งค่าตามต้องการ
      const isBlurry = variance < blurryThreshold;

      setIsImageBlurry(isBlurry);

      if (isBlurry) {
        setStatus('capturing');
        setError('รูปเบลอ กรุณาถ่ายใหม่');
      } else {
        setStatus('preview');
        setError(null);
      }

      src.delete();
      gray.delete();
      laplacian.delete();
      mean.delete();
      stddev.delete();
    };
  };

  checkImageBlurOpenCV(imageSrc);
}, [webcamRef]);



  const handleSubmit = async () => {
    if (!capturedImage || isImageBlurry) return;
    setStatus('processing');
    setError(null);

    const response = await fetch(capturedImage);
    const blob = await response.blob();
    const file = new File([blob], "id_card_capture.jpg", { type: "image/jpeg" });
    const formData = new FormData();
    formData.append('idCardImage', file);

    try {
      const apiResponse = await fetch('/api/ocr', { method: 'POST', body: formData });
      if (!apiResponse.ok) {
        const errData = await apiResponse.json();
        throw new Error(errData.error || `Server error: ${apiResponse.statusText}`);
      }
      const result = await apiResponse.json();
      setOcrResult(result);
      setStatus('pass'); // or 'fail' based on your logic
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการส่งข้อมูล');
      setStatus('fail');
    }
  };

  return (
    <div>
      <h1 className="text-xl font-bold text-center text-white mb-4">ตรวจสอบข้อมูลบัตรประชาชน</h1>
      {status === 'idle' && (
        <button
          onClick={startCamera}
          className="w-full px-4 py-3 font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          เริ่มถ่ายรูปบัตรประชาชน
        </button>
      )}

      {status === 'capturing' && (
        <div className="relative w-full aspect-[9/16] bg-black rounded-lg overflow-hidden">
          {!cvLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 z-10">
              <span className="text-white">กำลังโหลด OpenCV.js...</span>
            </div>
          )}
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={videoConstraints}
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2">
            <button onClick={handleCapture} className="w-16 h-16 bg-white rounded-full border-4 border-gray-400 shadow-lg" disabled={!cvLoaded}></button>
          </div>
        </div>
      )}

      {status === 'preview' && capturedImage && (
        <div>
          <img src={capturedImage} alt="Captured ID Card" className="rounded-lg mb-4" />
          {isImageBlurry && <p className="text-red-400 font-semibold mb-4">❌ รูปเบลอ กรุณาถ่ายใหม่</p>}
          <button
            onClick={handleSubmit}
            disabled={isImageBlurry}
            className={`w-full px-4 py-3 font-bold rounded-lg ${isImageBlurry ? 'bg-gray-500' : 'bg-green-600 hover:bg-green-700 text-white'}`}
          >
            ยืนยันและส่งตรวจสอบ
          </button>
          <button
            onClick={startCamera}
            className="w-full mt-3 px-4 py-3 font-bold text-white bg-gray-600 rounded-lg hover:bg-gray-500"
          >
            ถ่ายใหม่
          </button>
        </div>
      )}

      {status === 'processing' && <p className="text-center text-white">กำลังประมวลผล...</p>}

      {error && <p className="text-red-400 mt-4 text-center">{error}</p>}

      {status === 'pass' && ocrResult && (
        <div className="mt-4 bg-white rounded-lg p-4">
          <h2 className="font-bold mb-2">ผลลัพธ์ OCR</h2>
          <pre className="text-xs">{JSON.stringify(ocrResult, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
