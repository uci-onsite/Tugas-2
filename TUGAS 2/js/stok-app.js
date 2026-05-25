const STORAGE_KEY = 'sitta_ut_stok_v1';

const initialStokData = [
    { kode: "EKMA4116", judul: "Pengantar Manajemen", kategori: "MK Wajib", upbjj: "Jakarta", lokasiRak: "R1-A3", harga: 65000, qty: 28, safety: 20, catatanHTML: "<em>Edisi 2024</em>" },
    { kode: "EKMA4115", judul: "Pengantar Akuntansi", kategori: "MK Wajib", upbjj: "Jakarta", lokasiRak: "R1-A4", harga: 60000, qty: 7, safety: 15, catatanHTML: "<strong>Cover baru</strong>" },
    { kode: "BIOL4201", judul: "Biologi Umum", kategori: "Praktikum", upbjj: "Surabaya", lokasiRak: "R3-B2", harga: 80000, qty: 12, safety: 10, catatanHTML: "Butuh <u>pendingin</u>" },
    { kode: "FISIP4001", judul: "Dasar Sosiologi", kategori: "MK Pilihan", upbjj: "Makassar", lokasiRak: "R2-C1", harga: 55000, qty: 0, safety: 8, catatanHTML: "<i>Kosong total</i>" }
];

function loadStokFromStorage() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return null;
        return parsed;
    } catch (e) {
        console.warn('Gagal load stok dari localStorage:', e);
        return null;
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
    el: '#stok-app',
    data: {
        upbjjList: ["Jakarta", "Surabaya", "Makassar", "Padang", "Denpasar"],
        kategoriList: ["MK Wajib", "MK Pilihan", "Praktikum", "Problem-Based"],
        stok: loadStokFromStorage() || initialStokData,
        filter: {
            upbjj: '',
            kategori: '',
            sortBy: 'judul',
            reorder: false
        },
        formBaru: { kode: '', judul: '', qty: '', safety: '' },
        errorMsg: ''
    },
    computed: {
        filteredStok() {
            let hasil = this.stok;

            // 1. Filter UPBJJ
            if (this.filter.upbjj) {
                hasil = hasil.filter(item => item.upbjj === this.filter.upbjj);
            }
            // 2. Filter Kategori
            if (this.filter.upbjj && this.filter.kategori) {
                hasil = hasil.filter(item => item.kategori === this.filter.kategori);
            }
            // 3. Filter Reorder (qty < safety atau qty == 0)
            if (this.filter.reorder) {
                hasil = hasil.filter(item => item.qty < item.safety || item.qty === 0);
            }
            // 4. Sorting
            hasil = hasil.sort((a, b) => {
                if (this.filter.sortBy === 'judul') return a.judul.localeCompare(b.judul);
                if (this.filter.sortBy === 'qty') return a.qty - b.qty;
                if (this.filter.sortBy === 'harga') return a.harga - b.harga;
            });

            return hasil;
        }
    },
    watch: {
        // Watcher 1: Mereset kategori jika UPBJJ diganti (Dependent Option)
        'filter.upbjj': function(newVal) {
            this.filter.kategori = '';
        },
        // Watcher 2: Memantau jika fitur 'Reorder' diaktifkan/dimatikan
        'filter.reorder': function(newVal) {
            if(newVal) console.log("Mode Re-order Aktif: Memeriksa stok kritis...");
        }
    },
    mounted() {
        // Pastikan data tampil sesuai storage terbaru
        const stokTerbaru = loadStokFromStorage();
        if (stokTerbaru) this.stok = stokTerbaru;
    },
    methods: {
        resetFilter() {
            this.filter = { upbjj: '', kategori: '', sortBy: 'judul', reorder: false };
        },
        tambahStok() {
            if(this.formBaru.qty < 0 || this.formBaru.safety < 0) {
                this.errorMsg = "Nilai stok tidak boleh negatif!";
                return;
            }
            this.stok.push({
                kode: this.formBaru.kode,
                judul: this.formBaru.judul,
                kategori: "Baru",
                upbjj: "Jakarta",
                lokasiRak: "R-Baru",
                harga: 0,
                qty: parseInt(this.formBaru.qty),
                safety: parseInt(this.formBaru.safety),
                catatanHTML: "Data Baru"
            });

            saveStokToStorage(this.stok);

            this.formBaru = { kode: '', judul: '', qty: '', safety: '' };
            this.errorMsg = '';
            alert("Data berhasil ditambahkan!");
        },
        editStok(kode) {
            // Simulasi Edit
            let buku = this.stok.find(b => b.kode === kode);
            if (!buku) return;

            let tambahQty = prompt(`Berapa qty baru untuk ${buku.judul}?`, buku.qty);
            if(tambahQty !== null) {
                buku.qty = parseInt(tambahQty);
                saveStokToStorage(this.stok);
            }
        }
    }
});
