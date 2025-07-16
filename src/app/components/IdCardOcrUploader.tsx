'use client';

import { useState, ChangeEvent } from 'react';

// กำหนด type สำหรับผลลัพธ์ OCR
interface OcrResult {
  identification_number?: string;
  name_th?: string;
  name_en?: string;
  date_of_birth?: string;
  date_of_expiry?: string;
  raw_text?: string;
}

// กำหนด type สำหรับสถานะการตรวจสอบ
type VerificationStatus = 'idle' | 'processing' | 'pass' | 'fail';


export default function IdCardOcrUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<OcrResult | null>(null);
  const [status, setStatus] = useState<VerificationStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    // รีเซ็ตสถานะก่อนเริ่ม
    setOcrResult(null);
    setStatus('idle');
    setError(null);
    setPreviewUrl(null);
    setFile(null);

    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      
      // สร้าง URL สำหรับแสดงภาพตัวอย่าง
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      alert('กรุณาถ่ายรูปบัตรประชาชนก่อน');
      return;
    }

    setStatus('processing');
    setOcrResult(null);
    setError(null);

    const formData = new FormData();
    formData.append('idCardImage', file);

    try {
      const response = await fetch('/api/ocr', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || `Server error: ${response.statusText}`);
      }

      const result = await response.json();
      
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
  
  const getStatusChip = () => {
    switch (status) {
      case 'processing':
        return <span className="px-3 py-1 text-sm font-semibold text-blue-800 bg-blue-200 rounded-full">กำลังประมวลผล...</span>;
      case 'pass':
        return <span className="px-3 py-1 text-sm font-semibold text-green-800 bg-green-200 rounded-full">ผ่าน (ข้อมูลตรง)</span>;
      case 'fail':
        return <span className="px-3 py-1 text-sm font-semibold text-red-800 bg-red-200 rounded-full">ไม่ผ่าน (ข้อมูลไม่ตรง หรืออ่านไม่ได้)</span>;
      default:
        return null;
    }
  }

  return (
    <div className="w-full max-w-lg p-8 mx-auto space-y-6 bg-gray-800 rounded-xl">
      <h1 className="text-3xl font-bold text-center text-white">ตรวจสอบข้อมูลบัตรประชาชน</h1>
      
      {/* ส่วนแสดงภาพตัวอย่าง */}
      <div className="w-full h-48 bg-gray-700 rounded-lg flex items-center justify-center">
        {previewUrl ? (
          <img src={previewUrl} alt="ID Card Preview" className="object-contain h-full w-full rounded-lg" />
        ) : (
          <p className="text-gray-400">ภาพตัวอย่างจะแสดงที่นี่</p>
        )}
      </div>

      {/* ปุ่มถ่ายรูป และ Submit */}
      {!previewUrl ? (
         <label className="w-full cursor-pointer px-4 py-3 text-lg font-bold text-white text-center bg-blue-600 rounded-lg block hover:bg-blue-700">
            📷 ถ่ายรูปบัตรประชาชน
            <input 
              type="file" 
              accept="image/*"
              capture="environment" // เปิดกล้องหลัง
              onChange={handleFileChange} 
              className="hidden" 
            />
         </label>
      ) : (
        <div className="space-y-3">
            <button 
                onClick={handleSubmit} 
                disabled={status === 'processing'}
                className="w-full px-4 py-3 text-lg font-bold text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:bg-gray-500"
            >
                {status === 'processing' ? 'กำลังตรวจสอบ...' : 'ส่งข้อมูลเพื่อตรวจสอบ'}
            </button>
            <button 
                onClick={() => handleFileChange({ target: { files: null } } as any)}
                disabled={status === 'processing'}
                className="w-full px-4 py-2 text-md font-semibold text-gray-300 bg-gray-600 rounded-lg hover:bg-gray-500"
            >
                ถ่ายรูปใหม่
            </button>
        </div>
      )}

      {/* ส่วนแสดงผลลัพธ์ */}
      {status !== 'idle' && status !== 'processing' && (
        <div className="p-6 bg-gray-700 rounded-lg">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">ผลการตรวจสอบ</h2>
            {getStatusChip()}
          </div>
          
          {error && <p className="mt-4 text-red-400">สาเหตุ: {error}</p>}

          {ocrResult && (
            <div className="mt-4 space-y-2 text-gray-300 font-mono">
              <p><strong>ID:</strong> {ocrResult.identification_number || 'N/A'}</p>
              <p><strong>TH:</strong> {ocrResult.name_th || 'N/A'}</p>
              <p><strong>EN:</strong> {ocrResult.name_en || 'N/A'}</p>
              <p><strong>DOB:</strong> {ocrResult.date_of_birth || 'N/A'}</p>
              <p><strong>EXP:</strong> {ocrResult.date_of_expiry || 'N/A'}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
