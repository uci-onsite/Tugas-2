const STORAGE_KEY = 'sitta_ut_stok_v1';

function loadStokFromStorage() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed;
    } catch (e) {
        console.warn('Gagal load stok dari localStorage:', e);
        return [];
    }
}

function saveStokToStorage(stokArr) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stokArr));
    } catch (e) {
        console.warn('Gagal simpan stok ke localStorage:', e);
    }
}

new Vue({
    el: '#tracking-app',
    data: {
        pengirimanList: [
            { kode: "REG", nama: "Reguler (3-5 hari)" },
            { kode: "EXP", nama: "Ekspres (1-2 hari)" }
        ],
        paket: [
            { kode: "PAKET-UT-001", nama: "PAKET IPS Dasar", isi: ["EKMA4116","EKMA4115"], harga: 120000 },
            { kode: "PAKET-UT-002", nama: "PAKET IPA Dasar", isi: ["BIOL4201","FISIP4001"], harga: 140000 }
        ],
        tracking: {
            "DO2025-001": { nim: "123456789", nama: "Rina Wulandari", total: 120000 }
        },
        formDO: {
            nim: '',
            nama: '',
            ekspedisi: '',
            paket: '',
            tanggalKirim: new Date().toISOString().substr(0, 10)
        },
        successMsg: '',
        errorMsg: ''
    },
    computed: {
        generatedDO() {
            // Mengambil tahun saat ini
            const tahun = new Date().getFullYear();
            // Menghitung jumlah data di object tracking dan menambahkannya 1 (Sequence)
            const jumlahData = Object.keys(this.tracking).length + 1;
            // PadStart untuk menghasilkan format -001, -002, dst.
            const seq = String(jumlahData).padStart(3, '0');
            return `DO${tahun}-${seq}`;
        },
        detailPaketTerpilih() {
            // Jika paket dipilih, cari detailnya di array paket
            if(!this.formDO.paket) return null;
            return this.paket.find(p => p.kode === this.formDO.paket);
        }
    },
    methods: {
        submitDO() {
            this.successMsg = '';
            this.errorMsg = '';

            if (!this.detailPaketTerpilih) {
                this.errorMsg = "Paket belum dipilih.";
                return;
            }

            const stok = loadStokFromStorage();
            if (stok.length === 0) {
                this.errorMsg = "Data stok belum tersedia. Silakan buka halaman Stok terlebih dahulu.";
                return;
            }

            const doBaru = this.generatedDO;
            const hargaTotal = this.detailPaketTerpilih.harga;

            // Validasi stok: 1 unit per kode MK di paket.isi
            const kebutuhanKode = this.detailPaketTerpilih.isi || [];
            const stokKekurangan = [];

            kebutuhanKode.forEach(kodeMK => {
                const item = stok.find(s => s.kode === kodeMK);
                if (!item) {
                    stokKekurangan.push(`${kodeMK} (tidak ditemukan di stok)`);
                    return;
                }
                if (item.qty < 1) {
                    stokKekurangan.push(`${kodeMK} (qty sekarang: ${item.qty})`);
                }
            });

            if (stokKekurangan.length > 0) {
                this.errorMsg = `Stok tidak cukup untuk: ${stokKekurangan.join(', ')}.`;
                return;
            }

            // Kurangi stok
            kebutuhanKode.forEach(kodeMK => {
                const item = stok.find(s => s.kode === kodeMK);
                if (item) item.qty = item.qty - 1;
            });

            saveStokToStorage(stok);

            // Simpan DO ke Object Tracking DB (Dummy) dan (opsional) ke storage
            this.$set(this.tracking, doBaru, {
                nim: this.formDO.nim,
                nama: this.formDO.nama,
                ekspedisi: this.formDO.ekspedisi,
                paket: this.formDO.paket,
                tanggalKirim: this.formDO.tanggalKirim,
                total: hargaTotal
            });

            this.successMsg = `Berhasil! Nomor Tracking Anda adalah ${doBaru} dengan total biaya Rp ${hargaTotal.toLocaleString('id-ID')}`;

            // Reset form
            this.formDO.nim = '';
            this.formDO.nama = '';
            this.formDO.ekspedisi = '';
            this.formDO.paket = '';
        }
    }
});
