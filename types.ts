
export type ActiveTab = 'image' | 'video';

export interface ImageFile {
  name: string;
  base64: string;
  mimeType: string;
}

export interface GenerationRequest {
  type: ActiveTab;
  prompt: string;
  subjectImage: ImageFile | null;
  productImage?: ImageFile | null;
  aspectRatio?: string;
  selectedFeature?: string;
  celebrityNames?: string;
  idPhotoShirtColor?: string;
  idPhotoBackground?: 'xanh' | 'trắng';
  wearSuit?: boolean;
  selectedStyle?: string | null;
  numberOfImages?: number;
  numberOfVideos?: number;
  logoStyle?: string;
  logoText?: string;
  model3dStyle?: string;
}
