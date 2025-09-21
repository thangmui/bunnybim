
import React from 'react';
import { LogoIcon, KeyIcon } from './icons';

interface HeaderProps {
  onOpenApiKeyModal: () => void;
  hasApiKeys: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onOpenApiKeyModal, hasApiKeys }) => {
  const buttonText = hasApiKeys ? 'Quản lý Khóa API' : 'Kích hoạt API';
  
  return (
    <header className="relative text-center">
      <div className="flex items-center justify-center gap-3">
        <LogoIcon className="w-8 h-8 text-brand-primary" />
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-brand-light">
          TM CREATIVE
        </h1>
      </div>
      <p className="mt-2 text-md sm:text-lg text-brand-subtle">
        Sáng tạo theo trí tưởng tượng của bạn
      </p>
      <div className="absolute top-0 right-0">
         <button 
            onClick={onOpenApiKeyModal}
            className="bg-brand-surface hover:bg-brand-muted text-brand-subtle font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors duration-200 text-sm"
            title={buttonText}
          >
           <KeyIcon className="w-4 h-4" />
           <span className="hidden sm:inline">{buttonText}</span>
         </button>
      </div>
    </header>
  );
};