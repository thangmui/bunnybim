import React, { useState, useCallback, useRef } from 'react';
import { ImageIcon } from './icons';
import type { ImageFile } from '../types';

interface ImageUploaderProps {
  label: React.ReactNode;
  onImageUpload: (file: ImageFile | null) => void;
  id: string;
}

const fileToImageFile = (file: File): Promise<ImageFile> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = (event.target?.result as string).split(',')[1];
      if (base64) {
        resolve({
          name: file.name,
          base64,
          mimeType: file.type,
        });
      } else {
        reject(new Error("Failed to read file as base64."));
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

export const ImageUploader: React.FC<ImageUploaderProps> = ({ label, onImageUpload, id }) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // FIX: Refactored file handling to fix an issue with pasting files.
  // The file processing logic is extracted into `processFile` to handle single files from different sources (input, drop, paste).
  const processFile = useCallback(async (file: File) => {
    try {
      const imageFile = await fileToImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      onImageUpload(imageFile);
    } catch (error) {
      console.error("Error processing file:", error);
      onImageUpload(null);
    }
  }, [onImageUpload]);

  const handleFileChange = useCallback(async (files: FileList | null) => {
    if (files && files[0]) {
      await processFile(files[0]);
    }
  }, [processFile]);

  const onDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const onDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const onDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileChange(e.dataTransfer.files);
  };

  const onPaste = async (e: React.ClipboardEvent<HTMLLabelElement>) => {
    const items = e.clipboardData.items;
    for (const item of items) {
      if (item.type.indexOf("image") !== -1) {
        const blob = item.getAsFile();
        if (blob) {
            await processFile(blob);
        }
        break;
      }
    }
  };


  return (
    <div>
      <span className="block text-sm font-medium text-brand-subtle mb-1 min-h-[2.5rem] flex items-end">{label}</span>
      <label
        htmlFor={`file-upload-${id}`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onPaste={onPaste}
        tabIndex={0}
        className={`flex justify-center items-center w-full h-36 rounded-lg border-2 border-dashed transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 focus:ring-offset-brand-surface ${
          isDragging ? 'border-brand-primary bg-brand-primary/10' : 'border-brand-muted hover:border-brand-subtle'
        } ${imagePreview ? 'p-0' : 'p-4'}`}
      >
        <input ref={fileInputRef} id={`file-upload-${id}`} type="file" className="sr-only" accept="image/*" onChange={(e) => handleFileChange(e.target.files)} />
        {imagePreview ? (
          <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded-md" />
        ) : (
          <div className="text-center text-brand-subtle">
            <ImageIcon className="mx-auto h-8 w-8" />
            <p className="mt-2 text-xs">Nhấp, kéo thả hoặc dán ảnh</p>
          </div>
        )}
      </label>
    </div>
  );
};