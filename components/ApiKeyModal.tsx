
import React, { useState, useEffect } from 'react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentKeys: string;
  onSave: (keys: string) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, currentKeys, onSave }) => {
  const [keys, setKeys] = useState(currentKeys);

  useEffect(() => {
    setKeys(currentKeys);
  }, [currentKeys, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(keys);
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-brand-surface rounded-xl p-6 shadow-2xl w-full max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-bold text-brand-light">Quản lý Khóa API Gemini</h3>
          <button onClick={onClose} className="text-brand-subtle hover:text-brand-light text-2xl leading-none">&times;</button>
        </div>
        
        <p className="text-brand-subtle text-sm mb-4">
          Để sử dụng ứng dụng, vui lòng nhập (các) Khóa API bạn đã lấy từ Google AI Studio. Khóa sẽ được lưu an toàn ngay trên trình duyệt, cho phép ứng dụng hoạt động trên mọi nền tảng hosting như Netlify.
        </p>

        <textarea
          value={keys}
          onChange={(e) => setKeys(e.target.value)}
          rows={4}
          className="w-full bg-brand-dark border border-brand-muted rounded-md p-2.5 text-brand-light focus:ring-brand-primary focus:border-brand-primary resize-y"
          placeholder="Dán (các) Khóa API Gemini của bạn vào đây..."
        />
        
        <p className="text-xs text-brand-muted mt-2">
            **Mẹo:** Bạn có thể cung cấp nhiều Khóa API, phân tách bằng dấu phẩy (ví dụ: key1,key2,key3). Hệ thống sẽ tự động xoay vòng giữa các khóa khi một khóa đạt đến giới hạn sử dụng.
        </p>

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSave}
            className="bg-brand-primary hover:bg-brand-primary-hover text-white font-bold py-2 px-6 rounded-lg transition-colors duration-200"
          >
            Lưu Khóa
          </button>
        </div>
      </div>
    </div>
  );
};
