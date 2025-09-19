import React, { useState } from 'react';
import type { ActiveTab, ImageFile } from '../types';
import { ImageUploader } from './ImageUploader';
import { SparklesIcon, BookOpenIcon } from './icons';
import { StyleLibraryModal } from './StyleLibraryModal';

interface ControlPanelProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  prompt: string;
  setPrompt: (prompt: string) => void;
  subjectImage: ImageFile | null;
  setSubjectImage: (file: ImageFile | null) => void;
  productImage: ImageFile | null;
  setProductImage: (file: ImageFile | null) => void;
  aspectRatio: string;
  setAspectRatio: (ratio: string) => void;
  resolution: string;
  setResolution: (res: string) => void;
  selectedFeature: string;
  setSelectedFeature: (feature: string) => void;
  rememberStyle: boolean;
  setRememberStyle: (remember: boolean) => void;
  celebrityNames: string;
  setCelebrityNames: (names: string) => void;
  idPhotoShirtColor: string;
  setIdPhotoShirtColor: (color: string) => void;
  idPhotoBackground: 'xanh' | 'trắng';
  setIdPhotoBackground: (bg: 'xanh' | 'trắng') => void;
  wearSuit: boolean;
  setWearSuit: (wearSuit: boolean) => void;
  selectedStyle: string | null;
  setSelectedStyle: (style: string | null) => void;
  numberOfImages: number;
  setNumberOfImages: (num: number) => void;
  numberOfVideos: number;
  setNumberOfVideos: (num: number) => void;
  logoStyle: string;
  setLogoStyle: (style: string) => void;
  logoText: string;
  setLogoText: (text: string) => void;
  model3dStyle: string;
  setModel3dStyle: (style: string) => void;
  isLoading: boolean;
  onGenerateCreativePrompt: () => void;
  onGenerateCreativeVideoPrompt: () => void;
  onGenerateImage: () => void;
  onGenerateVideo: () => void;
}

const TabButton: React.FC<{ label: string; isActive: boolean; onClick: () => void }> = ({ label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full py-3 px-4 text-sm font-bold uppercase rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 focus:ring-offset-brand-surface ${
      isActive
        ? 'bg-brand-primary text-white shadow-lg'
        : 'bg-brand-dark hover:bg-brand-muted text-brand-subtle'
    }`}
  >
    {label}
  </button>
);

const SelectInput: React.FC<{ label: string; value: string | number; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; children: React.ReactNode }> = ({ label, value, onChange, children }) => (
    <div>
        <label className="block text-sm font-medium text-brand-subtle mb-1">{label}</label>
        <select
            value={value}
            onChange={onChange}
            className="w-full bg-brand-dark border border-brand-muted rounded-md p-2.5 text-brand-light focus:ring-brand-primary focus:border-brand-primary"
        >
            {children}
        </select>
    </div>
);


export const ControlPanel: React.FC<ControlPanelProps> = (props) => {
  const { 
    activeTab, setActiveTab, prompt, setPrompt, 
    aspectRatio, setAspectRatio,
    selectedFeature, setSelectedFeature, isLoading,
    celebrityNames, setCelebrityNames,
    idPhotoShirtColor, setIdPhotoShirtColor,
    idPhotoBackground, setIdPhotoBackground,
    wearSuit, setWearSuit,
    setSelectedStyle, numberOfImages, setNumberOfImages,
    numberOfVideos, setNumberOfVideos, onGenerateCreativeVideoPrompt,
    logoStyle, setLogoStyle, logoText, setLogoText,
    model3dStyle, setModel3dStyle,
  } = props;

  const [isStyleModalOpen, setIsStyleModalOpen] = useState(false);

  const features: { [key: string]: string } = {
      "Tạo LOGO": "Tạo LOGO",
      "Tạo ảnh từ văn bản": "Tạo ảnh từ văn bản",
      "Thay đổi phông nền sản phẩm": "Thay đổi phông nền sản phẩm",
      "Chụp ảnh cùng sản phẩm mẫu": "Chụp ảnh cùng sản phẩm mẫu",
      "Chụp ảnh cùng người nổi tiếng": "Chụp ảnh cùng người nổi tiếng",
      "Tạo ảnh thẻ": "Tạo ảnh thẻ",
      "Check-in địa điểm du lịch": "Check-in địa điểm du lịch",
      "Phục chế ảnh cũ (1 chủ thể)": "Phục chế ảnh cũ thành ảnh Studio (1 chủ thể)",
      "Phục chế ảnh cũ": "Phục chế ảnh cũ, mờ, hỏng",
      "Làm nét/ tăng độ phân giải ảnh": "Làm nét/ tăng độ phân giải ảnh",
      "Truyện tranh": "Truyện tranh Manga",
      "Chân dung phác thảo bút chì": "Chân dung phác thảo bút chì",
      "Nền chuyển động": "Nền chuyển động",
      "Tạo mô hình 3D": "Tạo mô hình 3D",
  };

  const newPlaceholder = `ví dụ: phong cách cyberpunk, ánh sáng neon...\nNhấn vào nút "Sáng tạo" để hệ thống tự động viết Prompt cho bạn\nNhấn vào nút "Phong cách" nếu bạn đang bí ý tưởng.`;

  const showPromptForImage = !['Phục chế ảnh cũ (1 chủ thể)', 'Làm nét/ tăng độ phân giải ảnh'].includes(selectedFeature);
  const showAdvancedImageControls = activeTab === 'image' && ['', 'Tạo ảnh từ văn bản', 'Tạo LOGO', 'Thay đổi phông nền sản phẩm'].includes(selectedFeature);
  const showImageUploaderForImage = activeTab === 'image' && !['Tạo ảnh từ văn bản', 'Tạo LOGO'].includes(selectedFeature);
  const showSingleImageUploader = ['Tạo ảnh thẻ', 'Phục chế ảnh cũ (1 chủ thể)', 'Phục chế ảnh cũ', 'Truyện tranh', 'Chân dung phác thảo bút chì', 'Check-in địa điểm du lịch', 'Thay đổi phông nền sản phẩm', 'Làm nét/ tăng độ phân giải ảnh', 'Chụp ảnh cùng sản phẩm mẫu', 'Nền chuyển động', 'Tạo mô hình 3D'].includes(selectedFeature);


  return (
    <div className="bg-brand-surface rounded-xl p-6 shadow-2xl flex flex-col gap-6 h-full">
      <div className="grid grid-cols-2 gap-4">
        <TabButton label="Tạo ảnh" isActive={activeTab === 'image'} onClick={() => setActiveTab('image')} />
        <TabButton label="Tạo video" isActive={activeTab === 'video'} onClick={() => setActiveTab('video')} />
      </div>
      
      {activeTab === 'image' && (
        <div className="flex flex-col gap-6">
            <div>
                <div className="flex justify-between items-center mb-1">
                    <label htmlFor="creative-style-select" className="block text-sm font-medium text-brand-subtle">Cách sáng tạo</label>
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="remember-style"
                            checked={props.rememberStyle}
                            onChange={(e) => props.setRememberStyle(e.target.checked)}
                            className="h-4 w-4 rounded border-brand-muted text-brand-primary focus:ring-brand-primary bg-brand-dark cursor-pointer"
                        />
                        <label htmlFor="remember-style" className="text-xs font-medium text-brand-subtle cursor-pointer">Nhớ sáng tạo</label>
                    </div>
                </div>
                <select
                    id="creative-style-select"
                    value={selectedFeature}
                    onChange={(e) => {
                    setSelectedFeature(e.target.value);
                    setPrompt('');
                    }}
                    className={`w-full bg-brand-dark border border-brand-muted rounded-md p-2.5 focus:ring-brand-primary focus:border-brand-primary text-brand-light text-sm`}
                >
                    <option value="">Mặc định (Kết hợp ảnh)</option>
                    {Object.keys(features).sort((a, b) => a.localeCompare(b)).map(key => <option key={key} value={key} className="text-brand-light bg-brand-surface text-sm">{features[key]}</option>)}
                </select>
            </div>
      
            {selectedFeature === 'Tạo LOGO' && (
              <div className="space-y-4">
                  <div>
                      <label htmlFor="logo-text" className="block text-sm font-medium text-brand-subtle mb-1">Tên thương hiệu / Văn bản logo</label>
                      <input
                          type="text"
                          id="logo-text"
                          value={logoText}
                          onChange={(e) => setLogoText(e.target.value)}
                          className="w-full bg-brand-dark border border-brand-muted rounded-md p-2.5 text-brand-light focus:ring-brand-primary focus:border-brand-primary"
                          placeholder="ví dụ: Penci, ThangMui Creative"
                      />
                  </div>
                  <SelectInput label="Phong cách Logo" value={logoStyle} onChange={(e) => setLogoStyle(e.target.value)}>
                        <option value="default">Mặc định (Không có phong cách)</option>
                        <option value="3d">3D chân thực</option>
                        <option value="chibi">Chibi</option>
                        <option value="vintage">Thủ công hoài cổ</option>
                        <option value="neon">Đường nét Neon</option>
                        <option value="pixel">Pixel</option>
                    </SelectInput>
              </div>
            )}

            {selectedFeature === 'Tạo mô hình 3D' && (
                <SelectInput label="Phong cách 3D" value={model3dStyle} onChange={(e) => setModel3dStyle(e.target.value)}>
                    <option value="Thế giới Online 3d">Thế giới Online 3d</option>
                    <option value="Góc nhà đồ chơi 3d">Góc nhà đồ chơi 3d</option>
                    <option value="Biếm họa bóng bay (mặt to)">Biếm họa bóng bay (mặt to)</option>
                    <option value="Viên thuốc thu nhỏ">Viên thuốc thu nhỏ</option>
                    <option value="Mô hình đóng gói 3D">Mô hình đóng gói 3D</option>
                    <option value="Móc khóa 3D">Móc khóa 3D</option>
                    <option value="Khung Polaroid chibi 3D">Khung Polaroid chibi 3D</option>
                    <option value="Sinh nhật 3D">Sinh nhật 3D</option>
                    <option value="Hoạt hình dễ thương 3D">Hoạt hình dễ thương 3D</option>
                </SelectInput>
            )}
      
            {showImageUploaderForImage && (
              <>
                {showSingleImageUploader ? (
                  <ImageUploader 
                    id="single-subject" 
                    label={selectedFeature === 'Chụp ảnh cùng sản phẩm mẫu' ? 'Ảnh sản phẩm' : 'Ảnh của bạn'} 
                    onImageUpload={props.setSubjectImage} 
                  />
                ) : selectedFeature === 'Chụp ảnh cùng người nổi tiếng' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ImageUploader id="celebrity-subject" label="Ảnh gốc của bạn (chủ thể)" onImageUpload={props.setSubjectImage} />
                    <ImageUploader 
                      id="celebrity-person" 
                      label={
                        <span>
                          <span className="text-brand-light">Ảnh người nổi tiếng</span>
                          <br />
                          <span className="font-normal text-xs">(hoặc người bạn muốn chụp cùng)</span>
                        </span>
                      }
                      onImageUpload={props.setProductImage}
                    />
                  </div>
                ) : ( // Default mode
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ImageUploader id="default-subject" label="Ảnh người mẫu / Chủ thể" onImageUpload={props.setSubjectImage} />
                    <ImageUploader id="default-product" label="Ảnh sản phẩm" onImageUpload={props.setProductImage} />
                  </div>
                )}
              </>
            )}
            
            {showPromptForImage && (
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label htmlFor="prompt" className="block text-sm font-medium text-brand-subtle">
                    Viết ý tưởng sáng tạo của bạn (Prompt)
                  </label>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setIsStyleModalOpen(true)}
                      disabled={isLoading}
                      className="flex items-center gap-1.5 text-xs font-bold text-blue-400 hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <BookOpenIcon className="w-4 h-4" />
                      Phong cách
                    </button>
                    <button
                      onClick={props.onGenerateCreativePrompt}
                      disabled={isLoading}
                      className="flex items-center gap-1.5 text-xs font-bold text-blue-400 hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <SparklesIcon className="w-4 h-4" />
                      Sáng tạo
                    </button>
                  </div>
                </div>
                <textarea
                  id="prompt"
                  rows={10}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="w-full bg-brand-dark border border-brand-muted rounded-md p-2.5 text-brand-light focus:ring-brand-primary focus:border-brand-primary resize-none"
                  placeholder={newPlaceholder}
                />
              </div>
            )}
      
            {selectedFeature === 'Chụp ảnh cùng người nổi tiếng' && (
              <div>
                <label htmlFor="celebrity-names" className="block text-sm font-medium text-brand-subtle mb-1">
                  Tên nhân vật bạn muốn chụp ảnh chung (nếu không tải ảnh lên)
                </label>
                <input
                  type="text"
                  id="celebrity-names"
                  value={celebrityNames}
                  onChange={(e) => setCelebrityNames(e.target.value)}
                  className="w-full bg-brand-dark border border-brand-muted rounded-md p-2.5 text-brand-light focus:ring-brand-primary focus:border-brand-primary"
                  placeholder='nhiều nhân vật thì thêm dấu "," vào giữa'
                />
              </div>
            )}
      
            {selectedFeature === 'Tạo ảnh thẻ' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                    <div>
                        <label htmlFor="shirt-color" className="block text-sm font-medium text-brand-subtle mb-1">
                            Chọn màu áo
                        </label>
                        <input
                            type="text"
                            id="shirt-color"
                            value={idPhotoShirtColor}
                            onChange={(e) => setIdPhotoShirtColor(e.target.value)}
                            className="w-full bg-brand-dark border border-brand-muted rounded-md p-2.5 text-brand-light focus:ring-brand-primary focus:border-brand-primary disabled:opacity-50 disabled:cursor-not-allowed"
                            placeholder='ví dụ: Sơ mi trắng'
                            disabled={wearSuit}
                        />
                    </div>
                    <div className="flex items-center justify-center bg-brand-dark border border-brand-muted rounded-md p-2.5 h-[46px]">
                        <input
                            type="checkbox"
                            id="wear-suit"
                            checked={wearSuit}
                            onChange={(e) => setWearSuit(e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary bg-brand-dark cursor-pointer"
                        />
                        <label htmlFor="wear-suit" className="ml-2 block text-sm font-medium text-brand-subtle uppercase cursor-pointer">
                            Mặc vest chuyên nghiệp
                        </label>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-brand-subtle mb-1">
                        Phông nền
                    </label>
                    <div className="flex items-center justify-around w-full bg-brand-dark border border-brand-muted rounded-md p-2.5 text-brand-light">
                        <div className="flex items-center">
                            <input id="bg-blue" name="background-color" type="radio" value="xanh" checked={idPhotoBackground === 'xanh'} onChange={() => setIdPhotoBackground('xanh')} className="h-4 w-4 border-gray-300 text-brand-primary focus:ring-brand-primary cursor-pointer"/>
                            <label htmlFor="bg-blue" className="ml-2 block text-sm font-medium text-brand-subtle uppercase cursor-pointer">XANH</label>
                        </div>
                        <div className="flex items-center">
                            <input id="bg-white" name="background-color" type="radio" value="trắng" checked={idPhotoBackground === 'trắng'} onChange={() => setIdPhotoBackground('trắng')} className="h-4 w-4 border-gray-300 text-brand-primary focus:ring-brand-primary cursor-pointer"/>
                            <label htmlFor="bg-white" className="ml-2 block text-sm font-medium text-brand-subtle uppercase cursor-pointer">TRẮNG</label>
                        </div>
                    </div>
                </div>
              </div>
            )}
            
            {showAdvancedImageControls && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-1">
                    <SelectInput label="Số lượng ảnh" value={numberOfImages} onChange={(e) => setNumberOfImages(parseInt(e.target.value, 10))}>
                        <option value={1}>1</option>
                        <option value={2}>2</option>
                        <option value={4}>4</option>
                    </SelectInput>
                  </div>
                  {selectedFeature !== 'Tạo LOGO' && selectedFeature !== 'Thay đổi phông nền sản phẩm' && (
                    <div className="md:col-span-2">
                      <SelectInput label="Tỉ lệ khung hình" value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)}>
                          <option value="9:16">9:16</option>
                          <option value="16:9">16:9</option>
                          <option value="1:1">1:1</option>
                          <option value="4:3">4:3</option>
                          <option value="3:4">3:4</option>
                      </SelectInput>
                    </div>
                  )}
              </div>
            )}
        </div>
      )}

      {activeTab === 'video' && (
          <div className="flex flex-col gap-6">
              <ImageUploader id="video-subject" label="Ảnh đầu vào" onImageUpload={props.setSubjectImage} />
              
              <div>
                  <div className="flex justify-between items-center mb-1">
                      <label htmlFor="prompt-video" className="block text-sm font-medium text-brand-subtle">
                          Viết ý tưởng sáng tạo của bạn (Prompt)
                      </label>
                      <button
                          onClick={onGenerateCreativeVideoPrompt}
                          disabled={isLoading || !props.subjectImage}
                          className="flex items-center gap-1.5 text-xs font-bold text-blue-400 hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          title={!props.subjectImage ? "Vui lòng tải ảnh lên trước" : "Sáng tạo prompt từ ảnh"}
                      >
                          <SparklesIcon className="w-4 h-4" />
                          Sáng tạo
                      </button>
                  </div>
                  <textarea
                      id="prompt-video"
                      rows={10}
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      className="w-full bg-brand-dark border border-brand-muted rounded-md p-2.5 text-brand-light focus:ring-brand-primary focus:border-brand-primary resize-none"
                      placeholder="ví dụ: một chiếc ô tô đang chạy trên đường cao tốc lúc hoàng hôn, camera lia theo..."
                  />
              </div>

              <SelectInput label="Số lượng video" value={numberOfVideos} onChange={(e) => setNumberOfVideos(parseInt(e.target.value, 10))}>
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                  <option value={4}>4</option>
              </SelectInput>
          </div>
      )}


      <button
        onClick={activeTab === 'image' ? props.onGenerateImage : props.onGenerateVideo}
        disabled={isLoading}
        className="w-full mt-auto bg-brand-primary hover:bg-brand-primary-hover text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 transform hover:scale-105 disabled:bg-brand-muted disabled:cursor-not-allowed"
      >
        <SparklesIcon className="w-5 h-5" />
        {isLoading ? 'Đang xử lý...' : 'BẮT ĐẦU SÁNG TẠO'}
      </button>

      <StyleLibraryModal
        isOpen={isStyleModalOpen}
        onClose={() => setIsStyleModalOpen(false)}
        onSelectStyle={(style) => {
          setSelectedStyle(style);
          setIsStyleModalOpen(false);
        }}
      />
    </div>
  );
};
