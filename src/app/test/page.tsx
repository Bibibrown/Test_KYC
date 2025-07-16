// app/page.tsx
import React from 'react';
import WebCam from '../../../components/WebCam';

export default function HomePage() {
  return (
    <div>
      <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>My Camera App</h1>
      <WebCam /> {/* Render the webcam component */}
    </div>
  );
}