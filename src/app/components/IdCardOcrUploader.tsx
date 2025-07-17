'use client';

import { useState, useRef, useCallback } from 'react';
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

  const startCamera = () => {
    setOcrResult(null);
    setError(null);
    setCapturedImage(null);
    setStatus('capturing');
    setIsImageBlurry(false);
  };

  const handleCapture = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        setCapturedImage(imageSrc);
        checkImageBlur(imageSrc);
      }
    }
  }, []);

  const checkImageBlur = (imageDataUrl: string) => {
    const img = new Image();
    img.src = imageDataUrl;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

      let sumSqDiff = 0;
      let count = 0;

      for (let i = 0; i < imageData.length - 4 * 4; i += 4) {
        const r1 = imageData[i];
        const r2 = imageData[i + 4];
        const diff = Math.abs(r1 - r2);

        sumSqDiff += diff * diff;
        count++;
      }

      const variance = sumSqDiff / count;
      const blurryThreshold = 20;

      const isBlurry = variance < blurryThreshold;
      setIsImageBlurry(isBlurry);

      if (isBlurry) {
        setStatus('capturing');
        setError('รูปที่ถ่ายเบลอ กรุณาถ่ายใหม่ให้ชัดเจน');
      } else {
        setStatus('preview');
        setError(null);
      }
    };
  };

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
      if (result.success) {
        setOcrResult(result.data);
        setStatus(result.verificationStatus);
      } else {
        throw new Error(result.error || 'ไม่สามารถประมวลผลไฟล์ได้');
      }
    } catch (err: any) {
      setStatus('fail');
      setError(err.message);
    }
  };

  return (
    <div className="w-full max-w-lg p-4 mx-auto bg-gray-800 rounded-xl">
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
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={videoConstraints}
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2">
            <button onClick={handleCapture} className="w-16 h-16 bg-white rounded-full border-4 border-gray-400 shadow-lg"></button>
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
    </div>
  );
}
