/**
 * Direct ImageKit Upload via REST API with client-side signature generation.
 * This approach generates the signature locally without a backend.
 */

// Helper to convert File to Base64
const fileToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(',')[1]); // Remove the data:image/jpeg;base64, prefix
    reader.onerror = (error) => reject(error);
});

// Helper to generate HMAC-SHA1 signature using Web Crypto API
async function generateSignature(token, expire, privateKey) {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(privateKey);
    const messageData = encoder.encode(token + expire);

    const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-1' },
        false,
        ['sign']
    );

    const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
    
    // Convert ArrayBuffer to Hex String
    return Array.from(new Uint8Array(signatureBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

export const uploadImageToImageKit = async (file, fileName, folder = 'RestaurantItems') => {
    try {
        /**
         * ⚠️ IMPORTANT: In a production app, the Private Key MUST NEVER be in the frontend.
         * For this project bypass, we are generating the signature locally.
         * Please replace the placeholder below with your real ImageKit Private Key.
         */
        const publicKey = "public_UwlZUVKBoqWEAGMd0RqLJGFp6n4=";
        const privateKey = "private_hsCeuLWgJvTSjc02hpRiJfIvGSQ=";
        const urlEndpoint = "https://ik.imagekit.io/peh3xvmh1";

        const token = crypto.randomUUID();
        const expire = Math.floor(Date.now() / 1000) + 1800; // 30 mins valid
        const signature = await generateSignature(token, expire, privateKey);

        const base64File = await fileToBase64(file);

        const formData = new FormData();
        formData.append("file", base64File);
        formData.append("fileName", fileName);
        formData.append("folder", folder);
        formData.append("publicKey", publicKey);
        formData.append("signature", signature);
        formData.append("expire", expire.toString());
        formData.append("token", token);

        const response = await fetch("https://upload.imagekit.io/api/v1/files/upload", {
            method: "POST",
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Upload failed");
        }

        const result = await response.json();
        return result; // contains url, fileId, name, etc.
    } catch (error) {
        console.error("Manual ImageKit Upload Error:", error);
        throw error;
    }
};

export default uploadImageToImageKit;
