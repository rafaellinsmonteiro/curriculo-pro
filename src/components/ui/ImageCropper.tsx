import React, { useState, useRef } from 'react';
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { X, Check } from 'lucide-react';

interface ImageCropperProps {
  imageUrl: string;
  onCropComplete: (base64: string) => void;
  onCancel: () => void;
}

export function ImageCropper({ imageUrl, onCropComplete, onCancel }: ImageCropperProps) {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<Crop>();
  const imgRef = useRef<HTMLImageElement>(null);

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    const crop = centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 90,
        },
        1,
        width,
        height
      ),
      width,
      height
    );
    setCrop(crop);
  }

  const getCroppedImg = async () => {
    if (!completedCrop || !imgRef.current) return;

    const image = imgRef.current;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Resize to 300x300 max for PDF performance
    const targetWidth = 300;
    const targetHeight = 300;

    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    // Draw the image onto the canvas using the crop dimensions
    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      targetWidth,
      targetHeight
    );

    // Get base64 string
    const base64Image = canvas.toDataURL('image/jpeg', 0.9);
    
    // We want the base64 part only, but it's easier to handle data URL sometimes, let's keep it as data URL
    // but the backend might expect pure base64. Actually data URL is fine.
    onCropComplete(base64Image);
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 9999,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{ 
        background: 'var(--bg-elevated)', borderRadius: 'var(--radius-lg)', padding: '20px',
        maxWidth: '100%', maxHeight: '100%', display: 'flex', flexDirection: 'column', gap: '20px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0 }}>Ajustar Foto de Perfil</h3>
          <button onClick={onCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-color)' }}>
            <X size={24} />
          </button>
        </div>
        
        <div style={{ overflow: 'auto', maxHeight: '60vh', textAlign: 'center', backgroundColor: '#000' }}>
          <ReactCrop
            crop={crop}
            onChange={(c) => setCrop(c)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={1}
            circularCrop
          >
            <img 
              ref={imgRef}
              src={imageUrl} 
              alt="Upload" 
              onLoad={onImageLoad}
              style={{ maxHeight: '60vh', maxWidth: '100%', objectFit: 'contain' }}
            />
          </ReactCrop>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={onCancel}>
            Cancelar
          </button>
          <button className="btn btn-primary" onClick={getCroppedImg} disabled={!completedCrop?.width || !completedCrop?.height}>
            <Check size={16} /> Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}
