import { storage, db } from './firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc } from 'firebase/firestore';

export async function uploadReceiptImage(file: File, employeeName: string) {
  try {
    const filename = `receipts/${employeeName}/${Date.now()}_${file.name}`;
    const storageRef = ref(storage, filename);
    
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    const receiptDoc = await addDoc(collection(db, 'receipts'), {
      filename: file.name,
      employee: employeeName,
      imageUrl: downloadURL,
      uploadedAt: new Date(),
      processed: false
    });
    
    return {
      id: receiptDoc.id,
      url: downloadURL,
      name: file.name
    };
  } catch (error) {
    console.error('Upload error:', error);
    throw new Error('Failed to upload receipt');
  }
}