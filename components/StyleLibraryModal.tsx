import React from 'react';

interface StyleLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectStyle: (style: string) => void;
}

const styles = [
  {
    title: 'Phong cách đường phố',
    description: 'trong bối cảnh đường phố đô thị, ảnh sáng tự nhiên, phong cách năng động, hợp thời trang.',
  },
  {
    title: 'Phong cách công sở',
    description: 'trong một văn phòng hiện đại hoặc bối cảnh doanh nghiệp, vẻ ngoài lịch lãm, chuyên nghiệp.',
  },
  {
    title: 'Chụp ảnh studio',
    description: 'trong một studio tối giản với ánh sáng chuyên nghiệp, tập trung vào quần áo, nền trơn.',
  },
  {
    title: 'Tối giản sang trọng',
    description: 'phong cách tối giản, tập trung vào các đường nét gọn gàng và chất liệu vải cao cấp, bảng màu trung tính.',
  },
  {
    title: 'Phiêu lưu ngoài trời',
    description: 'trong một khung cảnh thiên nhiên ấn tượng như núi hoặc rừng, thể hiện sự bền bỉ và phong cách.',
  },
];

const StyleCard: React.FC<{ title: string; description: string; onClick: () => void }> = ({ title, description, onClick }) => (
  <div
    onClick={onClick}
    className="bg-brand-dark p-4 rounded-lg border border-brand-muted hover:border-brand-primary hover:bg-brand-primary/10 transition-all duration-200 cursor-pointer"
  >
    <h4 className="font-bold text-brand-light">{title}</h4>
    <p className="text-sm text-brand-subtle mt-1">{description}</p>
  </div>
);

export const StyleLibraryModal: React.FC<StyleLibraryModalProps> = ({ isOpen, onClose, onSelectStyle }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-brand-surface rounded-xl p-6 shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-brand-light">Thư viện Phong cách</h3>
            <button onClick={onClose} className="text-brand-subtle hover:text-brand-light">&times;</button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {styles.map((style) => (
                <StyleCard
                    key={style.title}
                    title={style.title}
                    description={style.description}
                    onClick={() => onSelectStyle(style.description)}
                />
            ))}
        </div>
      </div>
    </div>
  );
};