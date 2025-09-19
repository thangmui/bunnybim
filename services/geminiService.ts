import { GoogleGenAI, Modality } from "@google/genai";
import type { ImageFile } from '../types';

let apiKeys: string[] = [];
let currentKeyIndex = 0;

/**
 * Initializes or updates the list of API keys available to the service.
 * @param keysString A string of API keys, separated by commas.
 */
export const initializeApiKeys = (keysString: string) => {
    apiKeys = keysString.split(',').map(k => k.trim()).filter(Boolean);
    currentKeyIndex = 0;
    console.log(`Initialized with ${apiKeys.length} API key(s).`);
};

/**
 * A centralized wrapper for making API calls that includes retry logic for quota errors.
 * @param apiCall The async function to call, which will receive a GoogleGenAI instance.
 * @returns The result of the successful API call.
 */
const makeApiCallWithRetry = async <T>(apiCall: (ai: GoogleGenAI) => Promise<T>): Promise<T> => {
    if (apiKeys.length === 0) {
        throw new Error("Vui lòng nhập Khóa API của bạn để sử dụng ứng dụng.");
    }

    const initialKeyIndex = currentKeyIndex;
    const triedIndexes = new Set<number>();

    while (triedIndexes.size < apiKeys.length) {
        try {
            const currentKey = apiKeys[currentKeyIndex];
            triedIndexes.add(currentKeyIndex);
            
            const ai = new GoogleGenAI({ apiKey: currentKey });
            return await apiCall(ai);

        } catch (error) {
            console.error(`API call with key index ${currentKeyIndex} failed.`);
            
            const apiError = handleApiError(error, "Lỗi không xác định");
            
            if (apiError.message.includes('Lỗi hạn ngạch')) {
                currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
                console.log(`Quota error. Rotating to key index ${currentKeyIndex}.`);
                // Continue to the next iteration to retry with the next key
            } else {
                // For any other error (e.g., authentication, server error), fail immediately
                throw apiError;
            }
        }
    }
    
    // If the loop completes, it means all keys have been tried and failed with a quota error.
    const errorMessage = `Tất cả ${apiKeys.length} Khóa API bạn cung cấp đều đã tạm thời đạt đến giới hạn sử dụng.

**Cách khắc phục:**
1. **Đợi một lúc:** Giới hạn thường được đặt lại sau mỗi phút. Vui lòng chờ một chút rồi thử lại.
2. **Thêm khóa mới:** Thêm các Khóa API từ các tài khoản Google khác vào phần "Quản lý Khóa API".`;
    throw new Error(errorMessage);
};

/**
 * A centralized handler to process API errors and return user-friendly messages.
 * @param error The error object caught.
 * @param defaultMessage A default message to use if the error is not specific.
 * @returns An Error object with a user-friendly message.
 */
const handleApiError = (error: unknown, defaultMessage: string): Error => {
    console.error("Gemini API Error:", error);

    let errorDetails: any = {};
    let potentialJson = "";

    if (error instanceof Error) {
        potentialJson = error.message;
    } else if (typeof error === 'string') {
        potentialJson = error;
    } else if (typeof error === 'object' && error !== null) {
        errorDetails = error;
    }

    if (potentialJson) {
        try {
            const parsed = JSON.parse(potentialJson);
            errorDetails = parsed;
        } catch (e) {
            const lowerMessage = potentialJson.toLowerCase();
            if (lowerMessage.includes('unauthenticated')) {
                 return new Error('Lỗi xác thực: Khóa API không hợp lệ hoặc đã bị thu hồi. Vui lòng kiểm tra lại.');
            }
            if (lowerMessage.includes('resource_exhausted') || lowerMessage.includes('quota')) {
                 return new Error('Lỗi hạn ngạch: Bạn đã vượt quá hạn ngạch sử dụng API. Vui lòng kiểm tra gói dịch vụ và thông tin thanh toán của bạn.');
            }
             if (lowerMessage.includes('unavailable')) {
                return new Error('Dịch vụ AI hiện đang quá tải hoặc không khả dụng. Vui lòng thử lại sau ít phút.');
            }
            if (lowerMessage.includes('internal error')) {
                return new Error('Máy chủ AI đã gặp lỗi nội bộ. Vui lòng thử lại sau.');
            }
            return new Error(potentialJson);
        }
    }
    
    const finalErrorObject = errorDetails.error || errorDetails;
    const code = finalErrorObject.code;
    const status = finalErrorObject.status;
    const message = finalErrorObject.message || defaultMessage;

    if (code === 401 || status === 'UNAUTHENTICATED') {
        return new Error('Lỗi xác thực: Khóa API không hợp lệ hoặc đã bị thu hồi. Vui lòng kiểm tra lại.');
    }
    if (code === 429 || status === 'RESOURCE_EXHAUSTED') {
        return new Error('Lỗi hạn ngạch: Bạn đã vượt quá hạn ngạch sử dụng API. Vui lòng kiểm tra gói dịch vụ và thông tin thanh toán của bạn.');
    }
    if (code === 503 || status === 'UNAVAILABLE') {
        return new Error('Dịch vụ AI hiện đang quá tải hoặc không khả dụng. Vui lòng thử lại sau ít phút.');
    }
    if (code === 500 || status === 'INTERNAL') {
        return new Error('Máy chủ AI đã gặp lỗi nội bộ. Vui lòng thử lại sau.');
    }

    if (typeof message === 'string' && (message.startsWith('Lỗi') || message.startsWith('Dịch vụ') || message.startsWith('Tạo ảnh') || message.startsWith('Chỉnh sửa'))) {
        return new Error(message);
    }
    
    return new Error(defaultMessage);
};


/**
 * Translates text to the target language using the Gemini API.
 */
export const translateText = async (text: string, targetLanguage: 'vi' | 'en'): Promise<string> => {
    if (!text || text.trim() === '') {
        return '';
    }
    try {
        return await makeApiCallWithRetry(async (ai) => {
            const prompt = `Translate the following text to ${targetLanguage === 'vi' ? 'Vietnamese' : 'English'}. Return only the translated text, without any introductory phrases or quotes. Text to translate: "${text}"`;
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    thinkingConfig: { thinkingBudget: 0 },
                    temperature: 0.1,
                }
            });
            return response.text.trim();
        });
    } catch (error) {
        throw handleApiError(error, `Dịch văn bản sang ${targetLanguage === 'vi' ? 'tiếng Việt' : 'tiếng Anh'} thất bại.`);
    }
};

/**
 * Generates an image from a text prompt.
 */
export const generateImageFromText = async (prompt: string, count: number, aspectRatio: string): Promise<string[]> => {
    try {
        return await makeApiCallWithRetry(async (ai) => {
            const response = await ai.models.generateImages({
                model: 'imagen-4.0-generate-001',
                prompt: prompt,
                config: {
                  numberOfImages: count,
                  outputMimeType: 'image/png',
                  aspectRatio: aspectRatio,
                },
            });

            if (!response.generatedImages || response.generatedImages.length === 0) {
                throw new Error("Không có ảnh nào được tạo. Yêu cầu có thể đã bị từ chối do chính sách an toàn.");
            }

            return response.generatedImages.map(img => img.image.imageBytes);
        });
    } catch (error) {
        throw handleApiError(error, "Tạo ảnh từ văn bản thất bại. Vui lòng thử lại.");
    }
};


/**
 * Generates a more creative and detailed prompt based on user's initial idea.
 */
export const generateCreativePrompt = async (basePrompt: string): Promise<string> => {
    try {
        return await makeApiCallWithRetry(async (ai) => {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: `Based on the following idea, generate a detailed, creative, and descriptive prompt for an AI image generator. The prompt should be in English to maximize compatibility with generation models. Idea: "${basePrompt}"`,
                config: {
                    thinkingConfig: { thinkingBudget: 0 },
                    temperature: 0.8,
                }
            });
            return response.text.trim();
        });
    } catch (error) {
        throw handleApiError(error, "Tạo prompt sáng tạo thất bại. Vui lòng thử lại.");
    }
};

// ... (The rest of the functions like generateCelebrityStylePrompt, etc. remain the same, as they don't directly call the API)
export const generateCelebrityStylePrompt = async (celebrityInput?: string, style?: string): Promise<string> => {
    const celebritiesList = ['Cristiano Ronaldo', 'Elon Musk', 'Taylor Swift', 'Lionel Messi', 'Bill Gates', 'Sơn Tùng M-TP', 'Lisa (Blackpink)', 'Leonardo DiCaprio', 'Keanu Reeves', 'Zendaya'];

    const scenarios = [
        {
            location: "a muddy rice field in Vietnam",
            activity: "laughing and splashing mud playfully like close friends",
            clothing: "simple Vietnamese farmer outfits (e.g., indigo cotton shirts, brown trousers)",
            style: "Soft natural sunlight, cinematic style, crisp detail on faces, with a blurred background of green rice paddies."
        },
        {
            location: "a glamorous red carpet event in Hollywood",
            activity: "posing for paparazzi and sharing a laugh, looking confident and happy",
            clothing: "elegant evening gowns and tuxedos",
            style: "Bright, flashing camera lights, dynamic angles, Vogue-style photoshoot, hyperrealistic."
        },
        {
            location: "a bustling, neon-lit street in Shinjuku, Tokyo at night",
            activity: "exploring the city and trying street food from a vibrant vendor stall",
            clothing: "trendy Japanese streetwear with unique accessories",
            style: "Vibrant neon lighting, deep shadows, Blade Runner aesthetic, cinematic, 8K resolution."
        },
        {
            location: "a cozy campfire in a serene forest at dusk",
            activity: "roasting marshmallows, telling stories, and enjoying the warm glow of the fire",
            clothing: "comfortable and casual outdoor clothes like flannel shirts, jeans, and beanies",
            style: "Warm, soft light from the fire, magical atmosphere, shallow depth of field, detailed textures."
        },
        {
            location: "the grandstand of a thrilling Formula 1 race",
            activity: "cheering excitedly for their favorite team, with blurry race cars in the background",
            clothing: "team-branded merchandise like caps and jackets over casual wear",
            style: "Dynamic, high-energy candid shot, motion blur in the background, sharp focus on the people, vibrant colors."
        }
    ];
    
    let selectedCelebrities: string[];
    if (celebrityInput && celebrityInput.trim() !== '') {
        selectedCelebrities = celebrityInput.split(',').map(name => name.trim()).filter(Boolean);
    } else {
        const numCelebrities = Math.floor(Math.random() * 2) + 1;
        const shuffledCelebs = celebritiesList.sort(() => 0.5 - Math.random());
        selectedCelebrities = shuffledCelebs.slice(0, numCelebrities);
    }
    
    if (selectedCelebrities.length === 0) {
        const shuffledCelebs = celebritiesList.sort(() => 0.5 - Math.random());
        selectedCelebrities = shuffledCelebs.slice(0, 1);
    }

    const celebrityNames = selectedCelebrities.join(' and ');
    const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
    const finalStyle = style || scenario.style;

    const prompt = `
Generate a hyperrealistic, high-resolution group photo featuring me (from the uploaded image) together with ${celebrityNames}.
The scene is ${scenario.location}. We are all ${scenario.activity}.
Our outfits are ${scenario.clothing}.

Crucial Instruction: My face and body must look exactly the same as in the uploaded reference photo, with a natural expression suitable for the scene. Do not alter me in any way. Seamlessly integrate me into the scene, matching the lighting and atmosphere.

Photo style: ${finalStyle}. The final image must be incredibly detailed, sharp, and photorealistic, achieving the quality of a professional photoshoot.
`;

    return prompt.trim().replace(/\n\s*\n/g, '\n');
};
export const generateIdPhotoPrompt = (options: { shirt: string; background: 'xanh' | 'trắng', wearSuit: boolean }): string => {
    const { shirt, background, wearSuit } = options;
    const backgroundColor = background === 'xanh' ? 'solid bright blue (#007bff)' : 'solid white (#ffffff)';
    
    const clothingInstruction = wearSuit 
        ? 'Change the person\'s attire to a professional business suit (e.g., a dark suit jacket, white dress shirt, and a formal tie). Ensure the suit looks natural and fits perfectly.'
        : `Change the person's attire to a professional ${shirt}. Ensure the clothing looks natural and fits well.`;

    const prompt = `
Create a professional, high-resolution ID-style portrait photo of the person from the uploaded image.

Crucial Instructions:
1.  Do Not Change Face or Hair: The person's face, facial features, and hairstyle must remain exactly as they are in the original photo. Do not alter their expression, add makeup, or change their hair. Preserve their identity 100%.
2.  Change Clothing: ${clothingInstruction}
3.  Background: The background must be a completely uniform, solid, and evenly lit ${backgroundColor}. There should be no shadows or gradients.
4.  Composition: The photo must be a centered, front-facing, chest-up portrait. The person should be looking directly at the camera with a neutral or slightly pleasant expression.
5.  Quality: The final image must be extremely clear, sharp, well-lit, and photorealistic, with perfect photographic quality suitable for an official document. It must be free of any digital noise or artifacts.
`;
    return prompt.trim().replace(/\n\s*\n/g, '\n');
};
export const generateDefaultPrompt = async (style?: string): Promise<string> => {
    const baseIdea = "A hyperrealistic photo of a person (subject) naturally using or showcasing a product.";
    let finalPrompt = `Based on the following idea, generate a short, creative, and descriptive prompt for an AI image generator. Describe a unique and interesting background and mood. The final prompt should only be about the scene and style, not mentioning "subject" or "product". The prompt must be in English. Idea: "${baseIdea}"`;
    if (style) {
        finalPrompt += `\n\nIncorporate this specific style: "${style}"`;
    }

    try {
        return await makeApiCallWithRetry(async (ai) => {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: finalPrompt,
                config: {
                    thinkingConfig: { thinkingBudget: 0 },
                    temperature: 0.9,
                }
            });
            return response.text.trim();
        });
    } catch (error) {
        console.error("Error generating default prompt:", error);
        return "A hyperrealistic photo of the subject naturally interacting with the product, set against a beautiful, complementary background. The focus is on realism and seamless integration.";
    }
};
export const generateCombinedPeoplePrompt = (style?: string): string => {
    const scenarios = [
        "standing together in a cozy, rustic coffee shop, sharing a laugh over a warm drink.",
        "hiking on a scenic mountain trail with a beautiful panoramic view behind them.",
        "attending a formal gala event, posing elegantly on a grand staircase.",
        "exploring a vibrant, bustling city street market, looking at interesting items.",
        "relaxing on a sunny beach, sitting on a blanket near the shore.",
        "working together on a project in a modern, sunlit office space."
    ];
    const randomScenario = scenarios[Math.floor(Math.random() * scenarios.length)];
    let prompt = `A realistic, perfectly blended photo of the two people from the uploaded images, ${randomScenario} The lighting and atmosphere are completely consistent between them.`;
    if (style) {
        prompt += `\n\nStyle Direction: ${style}`;
    }
    return prompt;
};
/**
 * Edits a single image based on a text prompt, preserving the original subject.
 */
export const editImage = async (prompt: string, image: ImageFile): Promise<string> => {
     try {
        return await makeApiCallWithRetry(async (ai) => {
            const fullPrompt = `You are an expert photo editor. Your primary instruction is to follow the user's prompt precisely. A key rule is to **never alter the person in the provided image unless specifically asked to**. The user wants to add elements around them or change the background. User prompt: "${prompt}"`;

            const imagePart = {
                inlineData: { data: image.base64, mimeType: image.mimeType }
            };

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image-preview',
                contents: {
                    parts: [
                        imagePart,
                        { text: fullPrompt },
                    ],
                },
                config: {
                    responseModalities: [Modality.IMAGE, Modality.TEXT],
                },
            });

            const imagePartResponse = response.candidates?.[0]?.content?.parts.find(part => part.inlineData);

            if (imagePartResponse && imagePartResponse.inlineData) {
                return imagePartResponse.inlineData.data;
            } else {
                const textPart = response.candidates?.[0]?.content?.parts.find(part => part.text);
                const refusalReason = textPart?.text || 'Không có ảnh nào được tạo. Yêu cầu có thể đã bị từ chối do chính sách an toàn.';
                throw new Error(`Tạo ảnh thất bại: ${refusalReason}`);
            }
        });
    } catch (error) {
        throw handleApiError(error, "Chỉnh sửa ảnh thất bại. Yêu cầu của bạn có thể đã bị chặn. Vui lòng điều chỉnh lại prompt hoặc hình ảnh.");
    }
}


/**
 * Generates a single image by combining a subject image, a product image, and a text prompt.
 */
export const generateCombinedImage = async (prompt: string, subjectImage: ImageFile, productImage: ImageFile): Promise<string> => {
    try {
        return await makeApiCallWithRetry(async (ai) => {
            const basePrompt = `
Analyze the two images provided. The first image contains a subject (e.g., a person, an animal). The second image contains a product (e.g., clothing, an object). Your task is to create a single, new, hyperrealistic photograph that seamlessly combines them in a logical and natural way.

Core Logic:
- If the product is wearable, the subject must be wearing it correctly.
- If the product is an object, the subject should be holding, using, or interacting with it appropriately.
- The final composition must look like a single, professionally shot photograph.

Crucial Constraints & Enhancements:
1.  Preserve Product Integrity: The product from the second image MUST be rendered with 100% accuracy. Do not change its shape, color, texture, details, patterns, or any branding. It must be perfectly recognizable.
2.  Preserve Subject Integrity: The subject from the first image must remain identical. DO NOT alter their facial features, body shape, or defining characteristics.
3.  Hyperrealism & Quality: The output must be an ultra-realistic, professional-grade photograph. Pay extreme attention to matching lighting, shadows, perspective, and scale. The final image must be exceptionally sharp, crisp, high-resolution, and completely free of any digital artifacts or noise.

User's Creative Direction:
- If the following user prompt is not empty, use it for creative guidance regarding the background, mood, or style. If it is empty, create a suitable, aesthetically pleasing background that complements the scene.
- User Prompt: "${prompt}"
`;

            const subjectImagePart = {
                inlineData: { data: subjectImage.base64, mimeType: subjectImage.mimeType }
            };
            const productImagePart = {
                inlineData: { data: productImage.base64, mimeType: productImage.mimeType }
            };

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image-preview',
                contents: {
                    parts: [
                        subjectImagePart,
                        productImagePart,
                        { text: basePrompt },
                    ],
                },
                config: {
                    responseModalities: [Modality.IMAGE, Modality.TEXT],
                },
            });

            const imagePart = response.candidates?.[0]?.content?.parts.find(part => part.inlineData);

            if (imagePart && imagePart.inlineData) {
                return imagePart.inlineData.data;
            } else {
                const textPart = response.candidates?.[0]?.content?.parts.find(part => part.text);
                const refusalReason = textPart?.text || 'Không có ảnh nào được tạo. Yêu cầu có thể đã bị từ chối do chính sách an toàn.';
                throw new Error(`Tạo ảnh thất bại: ${refusalReason}`);
            }
        });
    } catch (error) {
        throw handleApiError(error, "Tạo ảnh thất bại. Yêu cầu của bạn có thể đã bị chặn. Vui lòng điều chỉnh lại prompt hoặc hình ảnh.");
    }
};

/**
 * Generates a single image by combining two photos of people.
 */
export const generateCombinedPeopleImage = async (prompt: string, person1Image: ImageFile, person2Image: ImageFile): Promise<string> => {
    try {
        return await makeApiCallWithRetry(async (ai) => {
            const basePrompt = `
You are a world-class visual effects and compositing artist. Your task is to analyze two images, each with a person, and create a single, new, hyperrealistic photograph that seamlessly integrates both individuals into a shared, photorealistic scene. The final image must be indistinguishable from a real photograph shot with a high-end camera.

User's Creative Direction:
- The primary creative guidance for the scene, mood, and activity comes from this user prompt: "${prompt}"

Core Objective:
- Place both individuals in the scene described by the user.
- Position them naturally, as if they are interacting or posing together in the same physical space.

Technical & Artistic Integration Mandates (Non-negotiable):
1.  Identity Preservation (100% Accuracy): Both individuals MUST remain identical to their source photos. Do not alter their facial features, body shape, hair, or unique characteristics. They must be perfectly recognizable.
2.  Unified Lighting & Shadow: You MUST establish a single, consistent light source for the entire scene. The lighting (highlights, midtones, shadows) on both individuals must perfectly match each other and the environment. All shadows must be cast from this single light source with matching direction, softness, and intensity. There should be no conflicting lighting cues.
3.  Seamless Color Grading: Apply a uniform color grade across the entire final image. The color temperature, saturation, and contrast on both people must be identical and perfectly blended with the background's color palette.
4.  Cohesive Atmosphere & Depth: Ensure both individuals share the same atmospheric perspective (e.g., haze, fog) and depth of field. If the background is blurred, the focus on both subjects must be consistent.
5.  Perfect Perspective & Scale: The perspective, scale, and eye-lines of both individuals must be perfectly aligned with each other and the environment, creating a believable and coherent 3D space.
6.  Photographic Quality: The final output must be an ultra-realistic, professional-grade photograph. It must be exceptionally sharp, high-resolution, and completely free of digital artifacts, noise, or any signs of manipulation.
`;

            const person1ImagePart = {
                inlineData: { data: person1Image.base64, mimeType: person1Image.mimeType }
            };
            const person2ImagePart = {
                inlineData: { data: person2Image.base64, mimeType: person2Image.mimeType }
            };

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image-preview',
                contents: {
                    parts: [
                        person1ImagePart,
                        person2ImagePart,
                        { text: basePrompt },
                    ],
                },
                config: {
                    responseModalities: [Modality.IMAGE, Modality.TEXT],
                },
            });

            const imagePart = response.candidates?.[0]?.content?.parts.find(part => part.inlineData);

            if (imagePart && imagePart.inlineData) {
                return imagePart.inlineData.data;
            } else {
                const textPart = response.candidates?.[0]?.content?.parts.find(part => part.text);
                const refusalReason = textPart?.text || 'Không có ảnh nào được tạo. Yêu cầu có thể đã bị từ chối do chính sách an toàn.';
                throw new Error(`Tạo ảnh thất bại: ${refusalReason}`);
            }
        });
    } catch (error) {
        throw handleApiError(error, "Tạo ảnh thất bại. Yêu cầu của bạn có thể đã bị chặn. Vui lòng điều chỉnh lại prompt hoặc hình ảnh.");
    }
};


/**
 * Generates videos from a prompt and an optional image.
 */
export const generateVideo = async (prompt: string, image: ImageFile | null, count: number, onProgress: (message: string) => void): Promise<string[]> => {
    try {
        return await makeApiCallWithRetry(async (ai) => {
            onProgress("Bắt đầu yêu cầu tạo video...");
            
            const imagePayload = image ? { imageBytes: image.base64, mimeType: image.mimeType } : undefined;

            let operation = await ai.models.generateVideos({
                model: 'veo-2.0-generate-001',
                prompt,
                image: imagePayload,
                config: { numberOfVideos: count }
            });
            
            onProgress("Đã gửi yêu cầu, đang xử lý. Quá trình này có thể mất vài phút...");

            while (!operation.done) {
                await new Promise(resolve => setTimeout(resolve, 10000));
                onProgress("Đang kiểm tra tiến độ...");
                // Use the same 'ai' instance for polling
                operation = await ai.operations.getVideosOperation({ operation: operation });
            }

            onProgress("Video đã được tạo thành công!");

            const downloadLinks = operation.response?.generatedVideos?.map(v => v.video?.uri).filter(Boolean) as string[] | undefined;

            if (!downloadLinks || downloadLinks.length === 0) {
                throw new Error("Tạo video hoàn tất, nhưng không tìm thấy link tải xuống.");
            }
            
            return downloadLinks.map(link => link.replace('/v1main/', '/v1beta/'));
        });
    } catch (error) {
        throw handleApiError(error, "Tạo video thất bại. Vui lòng thử lại.");
    }
};

/**
 * Generates a video prompt by analyzing an uploaded image.
 */
export const generateVideoPromptFromImage = async (image: ImageFile): Promise<string> => {
    try {
        return await makeApiCallWithRetry(async (ai) => {
            const metaPrompt = `Analyze the provided image. Based on the visual content, create a detailed, dynamic prompt in English for an AI video generation model (like VEO). The prompt should describe a short, looping video scene that brings the image to life. Specify smooth, cinematic camera movements (like a slow dolly zoom or a gentle pan), ultra-high resolution, and photorealistic quality. Ensure the prompt requests seamless motion without any stuttering, aliasing, or artifacts. The prompt should focus on action and atmosphere, transforming the static image into a living moment. Return only the prompt itself.`;

            const imagePart = {
                inlineData: { data: image.base64, mimeType: image.mimeType }
            };

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image-preview',
                contents: {
                    parts: [
                        imagePart,
                        { text: metaPrompt },
                    ],
                },
                config: {
                    responseModalities: [Modality.TEXT],
                    temperature: 0.7
                },
            });

            return response.text.trim();
        });
    } catch (error) {
        throw handleApiError(error, "Phân tích ảnh để tạo prompt video thất bại.");
    }
};

// ... (All other prompt generation functions like generateOldPhotoRestorePrompt, etc. remain unchanged)
export const generateOldPhotoRestorePrompt = (): string => `A professional studio portrait edit of the person in the photo.
Key Instructions:
1.  Identity Preservation: Do NOT change the person's face, features, expression, or pose. Keep them 100% identical.
2.  Clothing: Subtly enhance the quality and texture of their existing clothes. Do not change the style or color.
3.  Lighting: Apply clean, soft, and even studio lighting. Use a main light from the front and a soft fill light to remove harsh shadows.
4.  Background: Replace the background with a solid, professional studio backdrop, preferably a dark navy blue or a neutral grey. Add a very subtle vignette.
5.  Retouching: Perform light, natural skin retouching. Smooth the skin slightly but retain texture. Reduce temporary blemishes. Brighten eyes and teeth subtly.
6.  Overall Quality: The final image must be ultra-sharp, high-resolution, and look like it was shot with a professional camera like a Canon EOS R5 with a 50mm lens. Enhance micro-contrast and color for a rich, true-to-life look. Do not over-process.`;
export const getRandomRestorationPrompt = (): string => {
  const prompts = [
    `Restore this old and damaged photograph. Remove scratches, folds, and fading. Improve sharpness, contrast, and color balance. If the photo is black and white, colorize it naturally and realistically. Retain the original composition and details. Maximize sharpness and image quality.`,
    `Perform a comprehensive, multi-stage restoration of the provided vintage photograph. The goal is to achieve an archival-quality digital copy, meticulously addressing degradation while preserving the original's authentic character. Systematically remove all surface defects like scratches and creases. Intelligently deblur and sharpen the image to recover fine details. If the source is monochrome, perform ultra-realistic and context-aware colorization. It is critical to maintain the original facial features and identity of the subjects. The final result must be a high-resolution, sharp, and natural-looking photograph.`
  ];
  return prompts[Math.floor(Math.random() * prompts.length)];
};
export const generatePhotoRestorationPrompt = (): string => {
    const prompt = `
You are a world-class photo restoration expert. Your task is to restore the provided old photograph to its former glory.

Core Objectives:
1.  Repair Damage: Meticulously remove any scratches, dust, creases, tears, and other signs of physical damage. The repair should be seamless and unnoticeable.
2.  Enhance Details: Increase the sharpness and clarity of the image. Bring out fine details in faces, clothing, and the background that have been lost over time. Do not over-sharpen.
3.  Colorize (if B&W): If the photo is black and white or sepia, apply natural, realistic, and historically appropriate colors. Skin tones should be lifelike, and colors for clothing and environment should be plausible for the era.
4.  Correct Tones: Adjust brightness, contrast, and levels to create a balanced and vibrant image. Fix any fading or yellowing.
5.  Noise Reduction: Gently reduce film grain and noise, but preserve the natural texture of the photograph. Avoid an overly smooth or "plastic" look.

Crucial Constraints:
-   Preserve Identity: DO NOT alter the facial features, expressions, or identities of the people in the photo.
-   Maintain Composition: Keep the original composition and framing of the photograph.
-   Authenticity: The final result should look like a well-preserved photograph from its original era, not a modern digital creation. The goal is restoration, not modernization.
`;
    return prompt.trim().replace(/\n\s*\n/g, '\n');
};
export const generateMangaPrompt = (): string => {
    const prompts = [
        `Convert the provided photograph into a high-quality, black-and-white manga panel. Use a professional manga art style with clear, detailed line work. For shading, apply classic manga screentone patterns; do not use simple gradients. It is crucial that the faces and core features of the people in the photo are accurately preserved and easily recognizable. Keep the original composition and pose. The final image must be sharp and high-resolution.`,
        `Transform the input image into a dramatic seinen manga panel. Emphasize emotional weight through heavy, contrasted shadows using dense cross-hatching and screentones. The line art should be sharp and expressive, capturing the subtle nuances of the subjects' expressions. Maintain the likeness of the individuals. The final output should feel like a page from a professionally published manga.`,
        `Re-imagine the photo as a panel from a classic shonen manga. Use dynamic, energetic line work and speed lines to create a sense of action and excitement, even if the pose is static. Use bold, impactful screentone patterns for shading and texture. The characters must be recognizable but stylized to fit the shonen aesthetic. The image needs to be crisp and clean.`
    ];
    return prompts[Math.floor(Math.random() * prompts.length)];
};
export const generatePencilSketchPrompt = (): string => {
    const prompts = [
        `Transform the provided photo into a delicate and classical pencil sketch portrait. Use soft, meticulous pencil strokes to create a harmonious transition of light and shadow, ensuring the subject's face is lifelike and expressive. The final artwork should be a high-quality, detailed pencil drawing that captures the essence of the original person while maintaining their recognizable features.`,
        `Create a realistic and highly detailed graphite pencil portrait from the photo. Focus on achieving a photorealistic texture, especially for skin and hair, using a wide range of pencil grades (from hard H to soft B). The shading should be smooth and blended flawlessly to create depth and volume. Preserve the exact likeness and expression of the subject.`,
        `Render the supplied photograph as an expressive, artistic charcoal sketch. Use bold, gestural strokes for the overall form and finer, more controlled lines for facial details. Emphasize high contrast between light and shadow to create a dramatic and emotional mood. The final piece should retain the subject's identity while feeling like a passionate, hand-drawn artwork.`
    ];
    return prompts[Math.floor(Math.random() * prompts.length)];
};
export const generateTravelCheckinPrompt = (): string => {
    const locations = [
        { name: 'Ha Long Bay, Vietnam', description: 'standing on a traditional junk boat, surrounded by the iconic limestone karsts and emerald green water of Ha Long Bay under a clear blue sky.' },
        { name: 'Eiffel Tower, Paris', description: 'in a classic Parisian street-style photo with the Eiffel Tower prominent in the background, during a beautiful sunset.' },
        { name: 'Santorini, Greece', description: 'posing against the famous blue-domed churches and white-washed buildings of Oia, Santorini, with the Aegean Sea sparkling behind.' },
        { name: 'Shibuya Crossing, Tokyo', description: 'captured in a dynamic, candid shot amidst the vibrant chaos and neon lights of Shibuya Crossing at night.' },
        { name: 'Nho Que River, Ha Giang', description: 'standing at a viewpoint overlooking the breathtaking Nho Que River canyon in Ha Giang, with majestic green mountains all around.' },
        { name: 'Golden Gate Bridge, San Francisco', description: 'on a scenic overlook with the iconic Golden Gate Bridge in the background, with a bit of morning fog rolling in.' },
        { name: 'Colosseum, Rome', description: 'enjoying a sunny day in Rome, with the ancient Colosseum providing a historic and grand backdrop.' }
    ];
    const location = locations[Math.floor(Math.random() * locations.length)];

    return `Realistically place the person from the uploaded photo into a new scene. The scene is them ${location.description}.
Crucial Instructions:
1.  Identity Preservation: The person's face, body, clothing, and pose must be kept exactly as they are in the original photo.
2.  Seamless Integration: The lighting, shadows, perspective, and scale on the person must perfectly match the new background environment.
3.  Photorealistic Quality: The final image must look like a single, high-resolution, professionally shot travel photograph. It should be indistinguishable from a real photo taken at that location.`;
};
export const generateLogoPrompt = (style: string, text: string): string => {
    const brandName = text || 'BRAND'; // Use a placeholder if text is empty

    const styleSpecificPrompts: { [key: string]: string[] } = {
        '3d': [
            `A vibrant, modern 3D logo for the brand "${brandName}". The design should be bold and chunky with a glossy, reflective finish. Use dynamic studio lighting to create soft shadows and bright highlights, giving it a tangible sense of depth. The background should be a clean, subtle gradient that complements the logo colors. The style is playful yet professional.`,
            `Create a high-impact 3D logo for "${brandName}". The letters should appear extruded and metallic, with beveled edges that catch the light. The lighting should be dramatic, like a spotlight, creating a strong contrast and a premium feel. The logo should cast a realistic soft shadow on a dark, textured surface.`,
            `Design a playful, inflated 3D balloon-style logo for "${brandName}". The letters should look soft and puffy, with a shiny, plastic-like texture. Use bright, cheerful colors. The scene should be well-lit with ambient light, making the logo feel friendly and approachable.`
        ],
        'chibi': [
            `An adorable "kawaii" chibi mascot logo for the brand "${brandName}". The character should be a cute animal or a simple, happy character with large expressive eyes and a friendly smile. Use simple, clean outlines with a soft, pastel color palette. The overall feeling should be joyful, friendly, and inviting. The brand name "${brandName}" should be written in a rounded, friendly font below the mascot.`,
            `A cute chibi mascot logo for "${brandName}" featuring a small, joyful creature (like a kitten or a bunny) holding a sign with the brand name. The art style should be clean with thick outlines and flat, soft colors. The mascot should have a winking expression. The font for "${brandName}" should be bubbly and fun.`,
            `Design a simple and charming chibi logo for "${brandName}". The logo is a minimalist depiction of a happy food item (like a smiling coffee cup or a piece of sushi) with tiny dot eyes and rosy cheeks. The brand name "${brandName}" is integrated below in a handwritten, playful script. The color palette is warm and gentle.`
        ],
        'vintage': [
            `A vintage, handcrafted-style logo for "${brandName}", inspired by early 20th-century packaging and labels. Use detailed, hand-drawn linework, possibly incorporating botanical or ornamental illustrations. The typography should be elegant, using serif or script fonts. The overall texture should feel like an aged paper or a woodcut print, with a limited, warm color palette.`,
            `Create a rustic, emblem-style logo for "${brandName}". The design should be circular, like a vintage bottle cap or a brewery crest. Include elements like wheat sheaves or mountain ranges in a rough, woodcut style. The text "${brandName}" should follow the curve of the emblem. Use a monochrome or two-tone color scheme on a textured, kraft paper background.`,
            `A retro logo for "${brandName}" inspired by 1950s American diners. Use a bold, flowing script font for the brand name. The design should incorporate classic retro shapes like boomerangs or starbursts. The color scheme should be optimistic and nostalgic, like teal, cream, and red. Add a subtle grain texture for an authentic feel.`
        ],
        'neon': [
            `A minimalist neon line art logo featuring the text "${brandName}". The design should be sleek and modern, using glowing neon lines against a dark, moody background (like a brick wall or a dark gradient). The neon should have a realistic vibrant glow. The style is sophisticated, energetic, and perfect for a modern brand.`,
            `A vibrant, multi-colored neon sign logo for "${brandName}". The brand name should be in a stylish script font, with a second, smaller line of text in a sans-serif font below. The neon tubes should appear realistic, with visible connectors and a bright, electric hum effect. The background is a dark, wet city street at night, with reflections of the sign on the pavement.`,
            `A clean, single-color neon icon logo representing the brand "${brandName}". The icon should be a simple, recognizable shape (e.g., an animal, an object) drawn with a single continuous neon line. The brand name "${brandName}" is placed subtly underneath in a simple, non-glowing font. The background is a clean, dark, solid color to make the icon pop.`
        ],
        'pixel': [
            `A retro 8-bit pixel art logo for the brand "${brandName}". The text should be in a classic, chunky pixel font. The design could be enclosed in a pixelated border or feature a simple pixel art icon next to the name, reminiscent of classic arcade games from the 1980s. Use a limited, high-contrast color palette for maximum authenticity.`,
            `A 16-bit era pixel art logo for "${brandName}", inspired by SNES RPGs. The text should have more detail and anti-aliasing than 8-bit, with a slight gradient or shadow effect. Accompany the text with a detailed pixel art sprite of a hero or a magical item. Use a richer color palette.`,
            `A modern pixel art logo for "${brandName}". The style is clean and isometric, with sharp pixels but a contemporary feel. The logo could represent a building or an object in isometric projection. The color palette is bright and modern, not limited by retro hardware constraints. The text is crisp and readable.`
        ]
    };

    if (style === 'default') {
        const allPrompts = Object.values(styleSpecificPrompts).flat();
        const genericPrompts = [
            `A modern, minimalist logo for "${brandName}". The design is clean, clever, and memorable, using a simple geometric shape and a professional sans-serif font.`,
            `An abstract, dynamic logo for "${brandName}". The design suggests movement and innovation, using flowing lines or overlapping shapes. The typography is modern and well-integrated.`,
            `An emblem logo for "${brandName}" that feels trustworthy and established, combining typography and a symbol within a containing shape like a circle or shield.`,
            `A wordmark logo for "${brandName}" with custom, unique typography. The lettering itself is the main design element, expressing the brand's personality.`
        ];
        const combinedPool = [...allPrompts, ...genericPrompts];
        return combinedPool[Math.floor(Math.random() * combinedPool.length)];
    }

    const selectedStylePrompts = styleSpecificPrompts[style];
    if (!selectedStylePrompts) {
        return `A professional and clean logo for the brand "${brandName}".`;
    }

    return selectedStylePrompts[Math.floor(Math.random() * selectedStylePrompts.length)];
};
export const generateProductBackgroundPrompt = (): string => {
    const prompts = [
        `Place the product from the image onto a clean, minimalist studio surface made of white marble. Add soft, natural lighting from the side to create gentle, realistic shadows. In the background, add subtle, out-of-focus elements related to the product's use (e.g., for a drink, add fresh fruit slices and mint leaves). The final image must be bright, airy, and look like a high-end commercial photograph, suitable for an e-commerce website.`,
        `Create a dynamic and vibrant lifestyle scene for the product in the image. The product should be the clear focus, captured with a shallow depth of field. Surround it with relevant, aesthetically pleasing props in a natural setting (e.g., for a cosmetic product, place it on a wooden tray with a soft towel and a delicate flower). The lighting should be warm, golden, and inviting. The final shot must be professional, high-resolution, and engaging.`,
        `Change the background to a dramatic, single-color backdrop that complements the product's colors. Use professional studio lighting with a strong key light and a subtle rim light to make the product "pop" and highlight its textures. Add a realistic, soft reflection of the product on the surface below. The style should be modern, sophisticated, and premium, perfect for a luxury brand advertisement.`
    ];

    return prompts[Math.floor(Math.random() * prompts.length)];
};
export const generateUpscaledImagePrompt = (): string => `
Your task is to upscale and enhance the provided image.
Crucial Instructions:
1.  Increase Resolution: Upscale the image to a higher resolution, making it suitable for high-quality display or printing.
2.  Sharpen Details: Intelligently sharpen the details and textures throughout the image to make them clearer and more defined.
3.  Denoise & De-artifact: Remove any visible digital noise, grain, and compression artifacts.
4.  Preserve Identity (100%): This is the most important rule. You MUST NOT change the original content, composition, colors, or subjects in any way. For any people in the photo, their facial features, expression, and identity must be perfectly preserved.
5.  Goal: The output should be a clean, sharp, high-resolution version of the exact same original image.
`;
export const generateProductModelPrompt = (): string => {
    const prompts = [
        `Create a professional advertisement photo featuring the provided product. Generate a suitable model (e.g., male for men's products, female for women's products) interacting naturally with the product. Place them in a luxurious, minimalist studio setting with soft, flattering light. The focus must be on the product, which should be sharp and clear. The model's face should be partially visible or slightly out of focus to emphasize the product.`,
        `Generate a vibrant lifestyle photograph for the product. Create a happy, energetic model using the product outdoors on a sunny day, perhaps in a beautiful park or a chic city street. The atmosphere should be bright and positive. The product must be the hero of the shot, perfectly lit and in sharp focus.`,
        `Produce a sophisticated and elegant advertisement image. Generate a professional model showcasing the product against a dark, moody background. Use dramatic studio lighting (like chiaroscuro) to highlight the product's form and texture. The overall feel should be premium and exclusive.`,
        `Create a clean, modern e-commerce photo. Generate a model with a friendly and approachable look using the product against a solid, neutral-colored background (like light gray or beige). The lighting should be even and shadowless, clearly showing all details of the product. The composition should be simple and direct.`
    ];
    return prompts[Math.floor(Math.random() * prompts.length)];
};
export const generateMotionBlurPrompt = (): string => {
    const prompts = [
        `Keep the subject in the foreground perfectly sharp and in focus, but apply a strong, high-speed motion blur to the background. The effect should create a sense of dynamic movement, as if the camera is tracking the subject at high speed. The final image must be crisp and dramatic.`,
        `Isolate the main subject from the background. Make the subject crystal clear and detailed. For the background, create a linear motion blur effect to simulate rapid movement. The lighting on the subject should be consistent, and the overall image should look professional and action-packed.`,
        `Create a professional motion blur effect on the provided photo. The person/object in the foreground must be maintained with extreme sharpness and detail. The background should be blurred horizontally to give the impression of speed. The final image should have a cinematic, high-energy feel.`
    ];
    return prompts[Math.floor(Math.random() * prompts.length)];
};
export const generate3dModelPrompt = (style: string): string => {
    const baseInstruction = `Transform the person from the provided photo into a 3D character model while perfectly preserving their facial features and recognizable identity. The final image must be high-quality, detailed, and masterfully executed in the specified style.`;

    const stylePrompts: { [key: string]: string[] } = {
        'Thế giới Online 3d': [
            `Style: A modern 3D social media profile. The character stands next to a floating, stylized social media post frame that shows their own profile picture. The character model should be in the popular, friendly "big tech" 3D art style, similar to what's used in social apps and advertising. The overall aesthetic is clean, vibrant, and engaging.`,
        ],
        'Góc nhà đồ chơi 3d': [
            `Style: A 3D toy diorama. The character is a miniature figure placed in a cozy, detailed, and stylized room corner or workshop that reflects their profession or hobby. The scene is enclosed in a wooden box frame, viewed from the front. The lighting is warm and inviting, creating a charming, miniature world effect.`,
        ],
        'Biếm họa bóng bay (mặt to)': [
            `Style: A humorous balloon head caricature. Exaggerate the person's head to a massive, inflated, balloon-like size while keeping the body small. The facial expression should be playful and funny. The texture should look like shiny, stretched plastic. The character is dressed in a suit, with a string tied around the neck as if holding the balloon head down.`,
        ],
        'Viên thuốc thu nhỏ': [
            `Style: A miniature capsule toy. The character is a tiny, adorable chibi-style 3D figure encapsulated within a clear glass or plastic pill-shaped capsule. A hand is gently holding the capsule. The character's name and a positive attribute (e.g., "Cute", "Happy") are printed on the capsule. The style is clean, modern, and minimalist.`,
        ],
        'Mô hình đóng gói 3D': [
            `Style: A 3D photorealistic model in a toy blister pack. The character is a plastic action figure, perfectly packaged in a transparent plastic bubble on a colorful cardboard backing. The packaging includes the character's name or a brand logo, along with some small accessory props. The style mimics a collectible toy found in a store.`,
        ],
        'Móc khóa 3D': [
            `Style: A cute 3D keychain. Transform the person into a small, vibrant 3D character figure attached to a realistic keychain with a metal ring and a branded strap. The scene shows a hand holding the keychain, creating a sense of scale and realism. The style is charming and suitable for a personalized souvenir.`,
        ],
        'Khung Polaroid chibi 3D': [
            `Style: A 3D claymation chibi character breaking the fourth wall. The character is sculpted from colorful clay and is sitting inside, or climbing out of, a classic white Polaroid frame. The aesthetic is soft, tactile, and playful, with a shallow depth of field focusing on the character.`,
        ],
        'Sinh nhật 3D': [
            `Style: A 3D birthday calendar scene. The character is a Pixar-style 3D model celebrating their birthday. They are placed next to a large, stylized calendar page showing their birth date. The scene is decorated with balloons, a small cake, and candles. The lighting is warm and cheerful, creating a heartwarming, celebratory atmosphere.`,
        ],
        'Hoạt hình dễ thương 3D': [
            `Style: A cute 3D animated character. The character is designed with a friendly, universally appealing aesthetic, featuring large, expressive eyes and a soft, rounded form, similar to modern animated movie characters. They are placed in a simple, colorful, and slightly out-of-focus background. The goal is to create a lovable and friendly character.`,
        ],
    };

    const promptsForStyle = stylePrompts[style];
    if (!promptsForStyle) {
        return `${baseInstruction} Style: A standard, high-quality 3D model.`;
    }

    const randomPrompt = promptsForStyle[Math.floor(Math.random() * promptsForStyle.length)];
    return `${baseInstruction} ${randomPrompt}`;
};