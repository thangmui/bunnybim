
import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { ControlPanel } from './components/ControlPanel';
import { ResultsPanel } from './components/ResultsPanel';
import { ApiKeyModal } from './components/ApiKeyModal';
import { ImageFile, ActiveTab, GenerationRequest } from './types';
import { 
    initializeApiKeys,
    generateCombinedImage, 
    generateVideo, 
    generateCelebrityStylePrompt, 
    editImage, 
    translateText, 
    generateDefaultPrompt, 
    generateIdPhotoPrompt,
    generateCombinedPeoplePrompt,
    generateCombinedPeopleImage,
    generateOldPhotoRestorePrompt,
    getRandomRestorationPrompt,
    generateMangaPrompt,
    generatePencilSketchPrompt,
    generateImageFromText,
    generateTravelCheckinPrompt,
    generateLogoPrompt,
    generateProductBackgroundPrompt,
    generateUpscaledImagePrompt,
    generateProductModelPrompt,
    generateVideoPromptFromImage,
    generateMotionBlurPrompt,
    generate3dModelPrompt,
    generateBackgroundRemovalPrompt,
} from './services/geminiService';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('image');
  const [prompt, setPrompt] = useState('');
  const [subjectImage, setSubjectImage] = useState<ImageFile | null>(null);
  const [productImage, setProductImage] = useState<ImageFile | null>(null);
  const [aspectRatio, setAspectRatio] = useState('9:16');
  const [resolution, setResolution] = useState('Full HD: 1920x1080');
  const [selectedFeature, setSelectedFeature] = useState('');
  const [rememberStyle, setRememberStyle] = useState<boolean>(false);
  const [celebrityNames, setCelebrityNames] = useState('');
  const [idPhotoShirtColor, setIdPhotoShirtColor] = useState('');
  const [idPhotoBackground, setIdPhotoBackground] = useState<'xanh' | 'trắng'>('xanh');
  const [wearSuit, setWearSuit] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [numberOfImages, setNumberOfImages] = useState(2);
  const [numberOfVideos, setNumberOfVideos] = useState(1);
  const [logoStyle, setLogoStyle] = useState('default');
  const [logoText, setLogoText] = useState('');
  const [model3dStyle, setModel3dStyle] = useState('Thế giới Online 3d');

  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [generatedVideos, setGeneratedVideos] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [lastRequest, setLastRequest] = useState<GenerationRequest | null>(null);
  
  const [apiKeys, setApiKeys] = useState<string>('');
  const [isApiModalOpen, setIsApiModalOpen] = useState(false);

  // Load keys from localStorage and initialize the service
  useEffect(() => {
    try {
      const savedKeys = localStorage.getItem('geminiApiKeys') || '';
      setApiKeys(savedKeys);
      initializeApiKeys(savedKeys);
      // Open modal on first load if no keys are present
      if (!savedKeys) {
        setIsApiModalOpen(true);
      }
    } catch (e) {
      console.error("Failed to access localStorage:", e);
    }
  }, []);

  const handleSaveApiKeys = (keys: string) => {
    try {
      localStorage.setItem('geminiApiKeys', keys);
      setApiKeys(keys);
      initializeApiKeys(keys);
      setIsApiModalOpen(false);
    } catch (e) {
      console.error("Failed to save keys to localStorage:", e);
      setError("Không thể lưu Khóa API. Trình duyệt của bạn có thể đang chặn Local Storage.");
    }
  };


  // Load saved settings from localStorage on initial mount
  useEffect(() => {
    try {
      const savedRememberStyle = localStorage.getItem('rememberCreativeStyle');
      const savedCreativeStyle = localStorage.getItem('savedCreativeStyle');

      if (savedRememberStyle === 'true') {
        setRememberStyle(true);
        if (savedCreativeStyle) {
          setSelectedFeature(savedCreativeStyle);
        }
      }
    } catch (e) {
      console.error("Failed to access localStorage:", e);
    }
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('rememberCreativeStyle', JSON.stringify(rememberStyle));
      if (rememberStyle) {
        localStorage.setItem('savedCreativeStyle', selectedFeature);
      } else {
        localStorage.removeItem('savedCreativeStyle');
      }
    } catch (e) {
      console.error("Failed to access localStorage:", e);
    }
  }, [selectedFeature, rememberStyle]);

  // Auto-populate prompt for specific features
  useEffect(() => {
    if (selectedFeature === 'Phục chế ảnh cũ (1 chủ thể)') {
      setPrompt(generateOldPhotoRestorePrompt());
    } else if (selectedFeature === 'Làm nét/ tăng độ phân giải ảnh') {
      setPrompt(generateUpscaledImagePrompt());
    } else if (selectedFeature === 'Xóa nền') {
      setPrompt(generateBackgroundRemovalPrompt());
    }
  }, [selectedFeature]);


  const handleCreativePrompt = useCallback(async () => {
    setIsLoading(true);
    setLoadingMessage('Sáng tạo prompt...');
    setError(null);
    try {
      let englishPrompt = '';
      if (selectedFeature === 'Tạo LOGO') {
        englishPrompt = generateLogoPrompt(logoStyle, logoText);
      } else if (selectedFeature === 'Chụp ảnh cùng người nổi tiếng') {
        if (productImage) { // If a second person's image is uploaded
            englishPrompt = generateCombinedPeoplePrompt(selectedStyle ?? undefined);
        } else { // Fallback to using names
            englishPrompt = await generateCelebrityStylePrompt(celebrityNames, selectedStyle ?? undefined);
        }
      } else if (selectedFeature === 'Tạo ảnh thẻ') {
        const shirtColorForPrompt = idPhotoShirtColor.trim() === '' ? 'sơ mi trắng' : idPhotoShirtColor;
        englishPrompt = generateIdPhotoPrompt({ shirt: shirtColorForPrompt, background: idPhotoBackground, wearSuit });
      } else if (selectedFeature === 'Phục chế ảnh cũ') {
        englishPrompt = getRandomRestorationPrompt();
      } else if (selectedFeature === 'Truyện tranh') {
        englishPrompt = generateMangaPrompt();
      } else if (selectedFeature === 'Chân dung phác thảo bút chì') {
        englishPrompt = generatePencilSketchPrompt();
      } else if (selectedFeature === 'Check-in địa điểm du lịch') {
        englishPrompt = generateTravelCheckinPrompt();
      } else if (selectedFeature === 'Thay đổi phông nền sản phẩm') {
        englishPrompt = generateProductBackgroundPrompt();
      } else if (selectedFeature === 'Chụp ảnh cùng sản phẩm mẫu') {
        englishPrompt = generateProductModelPrompt();
      } else if (selectedFeature === 'Nền chuyển động') {
        englishPrompt = generateMotionBlurPrompt();
      } else if (selectedFeature === 'Tạo mô hình 3D') {
        englishPrompt = generate3dModelPrompt(model3dStyle);
      } else { // Default and Text-to-Image use the same logic
        englishPrompt = await generateDefaultPrompt(selectedStyle ?? undefined);
      }
      
      setLoadingMessage('Đang dịch prompt...');
      const vietnamesePrompt = await translateText(englishPrompt, 'vi');
      setPrompt(vietnamesePrompt);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đã có lỗi xảy ra khi tạo prompt.');
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, [selectedFeature, celebrityNames, idPhotoShirtColor, idPhotoBackground, wearSuit, selectedStyle, productImage, logoStyle, logoText, model3dStyle]);

  const handleCreativeVideoPrompt = useCallback(async () => {
    if (!subjectImage) {
      setError('Vui lòng tải ảnh lên trước khi tạo prompt video.');
      return;
    }
    setIsLoading(true);
    setLoadingMessage('Phân tích ảnh để tạo prompt video...');
    setError(null);
    try {
      const englishPrompt = await generateVideoPromptFromImage(subjectImage);
      setLoadingMessage('Đang dịch prompt...');
      const vietnamesePrompt = await translateText(englishPrompt, 'vi');
      setPrompt(vietnamesePrompt);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đã có lỗi xảy ra khi tạo prompt video.');
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, [subjectImage]);


  const handleImageGeneration = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setGeneratedImages([]);
    setGeneratedVideos([]);
  
    try {
      if (selectedFeature === 'Tạo ảnh từ văn bản' || selectedFeature === 'Tạo LOGO') {
        if (selectedFeature === 'Tạo ảnh từ văn bản' && !prompt) {
            throw new Error('Vui lòng nhập ý tưởng sáng tạo (prompt) trước khi bắt đầu.');
        }
        if (selectedFeature === 'Tạo LOGO' && !logoText && !prompt) {
            throw new Error('Vui lòng nhập Tên thương hiệu hoặc viết một prompt để tạo logo.');
        }

        const effectivePrompt = selectedFeature === 'Tạo LOGO' ? (prompt || generateLogoPrompt(logoStyle, logoText)) : prompt;
        const effectiveAspectRatio = selectedFeature === 'Tạo LOGO' ? '1:1' : aspectRatio;
        
        setLoadingMessage('Đang tạo hình ảnh từ văn bản...');
        const englishPromptForApi = await translateText(effectivePrompt, 'en');
        
        const request: GenerationRequest = { 
            type: 'image', 
            prompt: effectivePrompt, 
            subjectImage: null, 
            productImage: null, 
            aspectRatio: effectiveAspectRatio, 
            selectedFeature, 
            numberOfImages, 
            selectedStyle,
            logoStyle,
            logoText
        };
        setLastRequest(request);

        const results = await generateImageFromText(englishPromptForApi, numberOfImages, effectiveAspectRatio);
        setGeneratedImages(results);

      } else {
         // Logic for all other image-based features
        if (!prompt && !['Phục chế ảnh cũ (1 chủ thể)', 'Làm nét/ tăng độ phân giải ảnh', 'Xóa nền'].includes(selectedFeature)) {
          setError('Vui lòng nhập hoặc tạo một ý tưởng sáng tạo (prompt) trước khi bắt đầu.');
          setIsLoading(false);
          return;
        }

        let request: GenerationRequest | null = null;
        let generationPromises: Promise<string>[] = [];
        let englishPromptForApi = '';
      
        if (['Phục chế ảnh cũ (1 chủ thể)', 'Làm nét/ tăng độ phân giải ảnh', 'Xóa nền'].includes(selectedFeature)) {
          englishPromptForApi = prompt;
        } else {
          setLoadingMessage('Đang dịch prompt của bạn...');
          englishPromptForApi = await translateText(prompt, 'en');
        }
        
        if (selectedFeature === 'Chụp ảnh cùng người nổi tiếng') {
          if (!subjectImage) throw new Error('Vui lòng tải lên ảnh gốc của bạn.');

          if (productImage) { // Logic for combining two uploaded images
            setLoadingMessage('Đang ghép ảnh hai người, vui lòng đợi...');
            request = { type: 'image', prompt, subjectImage, productImage, selectedFeature, selectedStyle };
            generationPromises = [
              generateCombinedPeopleImage(englishPromptForApi, subjectImage, productImage),
              generateCombinedPeopleImage(englishPromptForApi, subjectImage, productImage),
            ];
          } else { // Logic for using text name input
            setLoadingMessage('Đang ghép ảnh cùng người nổi tiếng, vui lòng đợi...');
            request = { type: 'image', prompt, subjectImage, selectedFeature, celebrityNames, selectedStyle };
            generationPromises = [
              editImage(englishPromptForApi, subjectImage),
              editImage(englishPromptForApi, subjectImage),
            ];
          }

        } else if (selectedFeature === 'Tạo ảnh thẻ') {
          if (!subjectImage) throw new Error('Vui lòng tải lên ảnh của bạn.');
          setLoadingMessage('Đang tạo ảnh thẻ...');
          request = { type: 'image', prompt, subjectImage, selectedFeature, idPhotoShirtColor, idPhotoBackground, wearSuit, selectedStyle };
          generationPromises = [
            editImage(englishPromptForApi, subjectImage),
            editImage(englishPromptForApi, subjectImage),
          ];

        } else if (['Phục chế ảnh cũ (1 chủ thể)', 'Làm nét/ tăng độ phân giải ảnh'].includes(selectedFeature)) {
          if (!subjectImage) throw new Error('Vui lòng tải lên ảnh bạn muốn xử lý.');
          setLoadingMessage(selectedFeature === 'Làm nét/ tăng độ phân giải ảnh' ? 'Đang làm nét ảnh...' : 'Đang phục chế ảnh...');
          request = { type: 'image', prompt, subjectImage, selectedFeature, selectedStyle };
          generationPromises = [
            editImage(englishPromptForApi, subjectImage),
            editImage(englishPromptForApi, subjectImage),
          ];
        } else if (selectedFeature === 'Xóa nền') {
          if (!subjectImage) throw new Error('Vui lòng tải lên ảnh bạn muốn xóa nền.');
          setLoadingMessage('Đang xóa nền ảnh...');
          request = { type: 'image', prompt, subjectImage, selectedFeature, selectedStyle };
          generationPromises = [editImage(englishPromptForApi, subjectImage)];
        } 
        else if (['Phục chế ảnh cũ', 'Truyện tranh', 'Chân dung phác thảo bút chì', 'Check-in địa điểm du lịch', 'Chụp ảnh cùng sản phẩm mẫu', 'Nền chuyển động', 'Tạo mô hình 3D'].includes(selectedFeature)) {
            if (!subjectImage) throw new Error('Vui lòng tải lên ảnh của bạn.');
            setLoadingMessage('Đang xử lý ảnh, vui lòng đợi...');
            request = { type: 'image', prompt, subjectImage, selectedFeature, selectedStyle, model3dStyle };
            generationPromises = [
                editImage(englishPromptForApi, subjectImage),
                editImage(englishPromptForApi, subjectImage),
            ];
        }
        else if (selectedFeature === 'Thay đổi phông nền sản phẩm') {
          if (!subjectImage) throw new Error('Vui lòng tải lên ảnh sản phẩm của bạn.');
          setLoadingMessage('Đang thay đổi phông nền, vui lòng đợi...');
          request = { type: 'image', prompt, subjectImage, selectedFeature, selectedStyle, numberOfImages };
          for (let i = 0; i < numberOfImages; i++) {
              generationPromises.push(editImage(englishPromptForApi, subjectImage));
          }
        } 
        
        else { // Default mode (Combine subject + product)
          if (!subjectImage || !productImage) {
            throw new Error('Vui lòng tải lên cả ảnh người mẫu và ảnh sản phẩm.');
          }
          setLoadingMessage('Đang tạo hình ảnh, vui lòng đợi...');
          request = { type: 'image', prompt: prompt, subjectImage, productImage, aspectRatio, selectedFeature, selectedStyle, numberOfImages };
          for (let i = 0; i < numberOfImages; i++) {
              generationPromises.push(generateCombinedImage(englishPromptForApi, subjectImage, productImage));
          }
        }
    
        setLastRequest(request);
        const results = await Promise.all(generationPromises);
        setGeneratedImages(results);
      }
  
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Đã có lỗi xảy ra khi tạo ảnh.';
      setError(errorMessage);
      setGeneratedImages([]);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, [prompt, subjectImage, productImage, aspectRatio, selectedFeature, idPhotoShirtColor, idPhotoBackground, wearSuit, selectedStyle, celebrityNames, numberOfImages, logoStyle, logoText, model3dStyle]);

  const handleVideoGeneration = useCallback(async () => {
    if (!prompt) {
      setError('Vui lòng nhập ý tưởng sáng tạo của bạn.');
      return;
    }

    setLoadingMessage('Đang dịch prompt của bạn...');
    const englishPromptForApi = await translateText(prompt, 'en');

    const request: GenerationRequest = { type: 'video', prompt, subjectImage, selectedStyle, numberOfVideos };
    setLastRequest(request);

    setIsLoading(true);
    setError(null);
    setGeneratedImages([]);
    setGeneratedVideos([]);
    
    try {
      const videoUris = await generateVideo(englishPromptForApi, subjectImage, numberOfVideos, (message) => setLoadingMessage(message));
      setGeneratedVideos(videoUris);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đã có lỗi xảy ra khi tạo video.');
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, [prompt, subjectImage, selectedStyle, numberOfVideos]);

  const handleRegenerate = () => {
    if (!lastRequest) return;

    setPrompt(lastRequest.prompt);
    setSubjectImage(lastRequest.subjectImage || null);
    setProductImage(lastRequest.productImage || null);
    setAspectRatio(lastRequest.aspectRatio || '9:16');
    setSelectedFeature(lastRequest.selectedFeature || '');
    setCelebrityNames(lastRequest.celebrityNames || '');
    setIdPhotoShirtColor(lastRequest.idPhotoShirtColor ?? '');
    setIdPhotoBackground(lastRequest.idPhotoBackground || 'xanh');
    setWearSuit(lastRequest.wearSuit || false);
    setSelectedStyle(lastRequest.selectedStyle || null);
    setNumberOfImages(lastRequest.numberOfImages || 2);
    setNumberOfVideos(lastRequest.numberOfVideos || 1);
    setLogoStyle(lastRequest.logoStyle || 'default');
    setLogoText(lastRequest.logoText || '');
    setModel3dStyle(lastRequest.model3dStyle || 'Thế giới Online 3d');


    if (lastRequest.type === 'image') {
      setTimeout(handleImageGeneration, 0);
    } else if (lastRequest.type === 'video') {
      setTimeout(handleVideoGeneration, 0);
    }
  };


  return (
    <div className="min-h-screen bg-brand-dark flex flex-col p-4 sm:p-6 lg:p-8 font-sans">
      <Header 
        onOpenApiKeyModal={() => setIsApiModalOpen(true)}
        hasApiKeys={!!apiKeys}
      />
      <main className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        <ControlPanel
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          prompt={prompt}
          setPrompt={setPrompt}
          subjectImage={subjectImage}
          setSubjectImage={setSubjectImage}
          productImage={productImage}
          setProductImage={setProductImage}
          aspectRatio={aspectRatio}
          setAspectRatio={setAspectRatio}
          resolution={resolution}
          setResolution={setResolution}
          selectedFeature={selectedFeature}
          setSelectedFeature={setSelectedFeature}
          rememberStyle={rememberStyle}
          setRememberStyle={setRememberStyle}
          celebrityNames={celebrityNames}
          setCelebrityNames={setCelebrityNames}
          idPhotoShirtColor={idPhotoShirtColor}
          setIdPhotoShirtColor={setIdPhotoShirtColor}
          idPhotoBackground={idPhotoBackground}
          setIdPhotoBackground={setIdPhotoBackground}
          wearSuit={wearSuit}
          setWearSuit={setWearSuit}
          selectedStyle={selectedStyle}
          setSelectedStyle={setSelectedStyle}
          numberOfImages={numberOfImages}
          setNumberOfImages={setNumberOfImages}
          numberOfVideos={numberOfVideos}
          setNumberOfVideos={setNumberOfVideos}
          logoStyle={logoStyle}
          setLogoStyle={setLogoStyle}
          logoText={logoText}
          setLogoText={setLogoText}
          model3dStyle={model3dStyle}
          setModel3dStyle={setModel3dStyle}
          isLoading={isLoading}
          onGenerateCreativePrompt={handleCreativePrompt}
          onGenerateCreativeVideoPrompt={handleCreativeVideoPrompt}
          onGenerateImage={handleImageGeneration}
          onGenerateVideo={handleVideoGeneration}
        />
        <ResultsPanel
          isLoading={isLoading}
          loadingMessage={loadingMessage}
          error={error}
          images={generatedImages}
          videoUrls={generatedVideos}
          onRegenerate={handleRegenerate}
        />
      </main>
      <ApiKeyModal 
        isOpen={isApiModalOpen}
        onClose={() => setIsApiModalOpen(false)}
        currentKeys={apiKeys}
        onSave={handleSaveApiKeys}
      />
    </div>
  );
};

export default App;