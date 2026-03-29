import { storage } from '../firebase/config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export const uploadToStorage = async (file) => {
    try {
        const fileRef = ref(storage, `items/${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(fileRef, file);
        const url = await getDownloadURL(snapshot.ref);
        return url;
    } catch (error) {
        console.error("Firebase Storage Upload Error:", error);
        throw error;
    }
};
