import React from 'react';
import { LogoIcon, DownloadIcon, RetryIcon } from './icons';

interface ResultsPanelProps {
  isLoading: boolean;
  loadingMessage: string;
  error: string | null;
  images: string[];
  videoUrls: string[];
  onRegenerate: () => void;
}

const LoadingState: React.FC<{ message: string }> = ({ message }) => (
    <div className="flex flex-col items-center justify-center text-center gap-4">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-brand-primary"></div>
        <p className="text-brand-light font-semibold text-lg">Đang xử lý...</p>
        <p className="text-brand-subtle text-sm max-w-xs">{message}</p>
    </div>
);

const InitialState: React.FC = () => (
    <div className="flex flex-col items-center justify-center text-center gap-4 text-brand-muted">
        <LogoIcon className="w-16 h-16 opacity-50"/>
        <h3 className="text-xl font-bold text-brand-subtle uppercase">Kết quả sáng tạo của bạn</h3>
        <p className="max-w-xs">Các hình ảnh hoặc video được tạo sẽ xuất hiện ở đây.</p>
    </div>
);

const ErrorState: React.FC<{ message: string }> = ({ message }) => (
    <div className="flex flex-col items-center justify-center text-center gap-4 text-red-400">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="text-xl font-bold">Oops! Đã có lỗi xảy ra</h3>
        <p className="max-w-xs bg-red-900/50 p-3 rounded-md text-sm whitespace-pre-wrap">{message}</p>
    </div>
);

const ActionButton: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void; }> = ({ icon, label, onClick }) => (
    <button onClick={onClick} className="flex-1 bg-brand-muted/50 hover:bg-brand-muted text-brand-light font-semibold py-2 px-4 rounded-md flex items-center justify-center gap-2 transition-colors duration-200 text-sm">
        {icon}
        {label}
    </button>
);


export const ResultsPanel: React.FC<ResultsPanelProps> = ({ isLoading, loadingMessage, error, images, videoUrls, onRegenerate }) => {
    const hasResults = images.length > 0 || videoUrls.length > 0;

    const downloadImage = (base64: string, index: number) => {
        const link = document.createElement('a');
        link.href = `data:image/png;base64,${base64}`;
        link.download = `thangmui-creative-${Date.now()}-${index}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    
  return (
    <div className="bg-brand-surface rounded-xl p-6 shadow-2xl flex flex-col items-center justify-center min-h-[60vh] lg:min-h-full">
        <div className="w-full h-full flex flex-col justify-center items-center">
        {isLoading && <LoadingState message={loadingMessage} />}
        {!isLoading && error && <ErrorState message={error} />}
        {!isLoading && !error && !hasResults && <InitialState />}
        {!isLoading && !error && hasResults && (
            <div className="w-full flex flex-col gap-6">
                 {hasResults && (
                    <div className="flex justify-end">
                        <button onClick={onRegenerate} className="flex items-center gap-2 bg-brand-primary hover:bg-brand-primary-hover text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200">
                            <RetryIcon className="w-5 h-5" />
                            Tạo lại
                        </button>
                    </div>
                 )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {images.map((img, index) => (
                        <div key={index} className="flex flex-col gap-3">
                            <div className="bg-brand-dark rounded-lg overflow-hidden">
                               <img src={`data:image/png;base64,${img}`} alt={`Generated result ${index + 1}`} className="w-full h-auto" />
                            </div>
                             <ActionButton
                                icon={<DownloadIcon className="w-4 h-4" />}
                                label="Tải xuống"
                                onClick={() => downloadImage(img, index)}
                            />
                        </div>
                    ))}
                    {videoUrls.map((videoUrl, index) => (
                        <div key={`video-${index}`} className="flex flex-col gap-3">
                            <div className="aspect-video bg-brand-dark rounded-lg overflow-hidden">
                                <video src={videoUrl} controls autoPlay loop className="w-full h-full object-contain" />
                            </div>
                            <a
                                href={videoUrl}
                                download={`thangmui-creative-video-${Date.now()}-${index}.mp4`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full bg-brand-muted/50 hover:bg-brand-muted text-brand-light font-semibold py-2 px-4 rounded-md flex items-center justify-center gap-2 transition-colors duration-200 text-sm"
                            >
                                <DownloadIcon className="w-4 h-4" />
                                Tải xuống
                            </a>
                        </div>
                    ))}
                </div>
            </div>
        )}
        </div>
    </div>
  );
};
