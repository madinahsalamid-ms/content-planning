const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');
const csv = require('csv-parser');

const serviceAccount = require('./serviceAccountKey.json');

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();
const collectionName = 'content-planning'; 

const results = [];

fs.createReadStream('Content Planning Madinah Salam - Sheet1.csv')
  .pipe(csv())
  .on('data', (data) => results.push(data))
  .on('end', async () => {
    let count = 0;
    console.log(`Membaca ${results.length} baris dari CSV. Mulai proses upload ke Firestore...`);
    
    for (const row of results) {
      // Hapus kolom yang kosong jika tidak diperlukan (opsional)
      const cleanedRow = Object.fromEntries(
        Object.entries(row).filter(([_, v]) => v != null && v !== '')
      );
      
      try {
        if (cleanedRow.id) {
          // Jika ada ID khusus, gunakan ID tersebut sebagai ID dokumen
          const docRef = db.collection(collectionName).doc(cleanedRow.id);
          await docRef.set(cleanedRow);
        } else {
          // Biarkan Firestore membuat ID otomatis
          await db.collection(collectionName).add(cleanedRow);
        }
        count++;
        console.log(`Berhasil upload baris ke-${count}: ${cleanedRow.judul || 'Tanpa Judul'}`);
      } catch (error) {
        console.error(`Gagal upload baris:`, error);
      }
    }
    console.log(`Selesai! ${count} data berhasil diunggah ke Firebase.`);
    process.exit(0);
  });
