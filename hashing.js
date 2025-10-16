const bcrypt = require('bcrypt');
const readline = require('readline');

// Cost factor yang disarankan
const SALT_ROUNDS = 10; 

class PasswordManager {
    
    // Fungsi Hashing (Pendaftaran)
    async hashPassword(password) {
        return await bcrypt.hash(password, SALT_ROUNDS);
    }

    // Fungsi Verifikasi (Login)
    async verifyPassword(password, storedHash) {
        return await bcrypt.compare(password, storedHash);
    }
}

// --- Logika Utama CLI ---

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const pm = new PasswordManager();
let storedHashGlobal = ""; // Variabel untuk menyimpan hash hasil pendaftaran

// Langkah 1: Minta password untuk di-hash (Pendaftaran)
function step1_get_password_to_hash() {
    rl.question('Langkah 1 (Pendaftaran): Masukkan Password untuk di-hash: ', async (password) => {
        try {
            const hashedPassword = await pm.hashPassword(password);
            storedHashGlobal = hashedPassword; // Simpan hash global untuk verifikasi
            
            console.log('\n--- HASIL HASHING DENGAN SALT (Tersimpan) ---');
            console.log(`Password Asli: ${password}`);
            console.log(`Hash Lengkap (Tersimpan): ${storedHashGlobal}`);
            console.log('--------------------------------------------\n');

            // Lanjut ke langkah 2
            step2_verify_password(password); 
            
        } catch (error) {
            console.error(`\nERROR selama hashing: ${error.message}`);
            rl.close();
        }
    });
}

// Langkah 2: Minta password verifikasi (Login)
function step2_verify_password(originalPassword) {
    rl.question('Langkah 2 (Login): Masukkan Password untuk Verifikasi: ', async (loginPassword) => {
        
        try {
            // Verifikasi menggunakan password yang dimasukkan saat login dan hash yang disimpan
            const isVerified = await pm.verifyPassword(loginPassword, storedHashGlobal);
            
            console.log('\n--- HASIL VERIFIKASI LOGIN ---');
            console.log(`Hash Tersimpan: ${storedHashGlobal.substring(0, 30)}...`);
            console.log(`Password Login: ${loginPassword}`);
            console.log(`Status Verifikasi: ${isVerified ? 'BERHASIL (Login Diterima) ✅' : 'GAGAL (Password Salah) ❌'}`);
            console.log('------------------------------');

        } catch (error) {
            console.error(`\nERROR selama verifikasi: ${error.message}`);
        } finally {
            rl.close();
        }
    });
}

// Mulai program
step1_get_password_to_hash();