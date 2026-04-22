import React, { useState, useEffect, useMemo } from 'react';
import Papa from 'papaparse';
import { Search, Package, Calendar, Tag, AlertCircle, Loader2, Info, Factory, Cpu, Hash, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ProductionData {
  "ID": string;
  "NAMA PRODUK": string;
  "KARUNG": string;
  "KODE PRODUKSI": string;
  "TAMBAHAN KODE": string;
  "EXPIRED (BULAN)": string;
  "JENIS": string;
}

const SHEET_URL = "https://docs.google.com/spreadsheets/d/1dBtgje5qNQTqlMNBd69QBBIb4rKkU4NT9VtSd_NvAJA/export?format=csv";
const ENCODING_KEY = "FKSMALTOYI"; 

export default function App() {
  const [data, setData] = useState<ProductionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [noCarousel, setNoCarousel] = useState('01');
  const [prodLine, setProdLine] = useState('A');
  const [plantCode, setPlantCode] = useState('1');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(SHEET_URL);
        if (!response.ok) throw new Error('Gagal mengambil data.');
        const csvString = await response.text();
        Papa.parse(csvString, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            const normalizedData = (results.data as any[]).map((row, index) => ({
              "ID": row[""] || row["ID"] || String(index + 1),
              "NAMA PRODUK": row["NAMA PRODUK"] || "Tidak Diketahui",
              "KARUNG": row["KARUNG"] || "-",
              "KODE PRODUKSI": row["KODE PRODUKSI"] || "-",
              "TAMBAHAN KODE": row["TAMBAHAN KODE "] || row["TAMBAHAN KODE"] || "-",
              "EXPIRED (BULAN)": row["EXPIRED (BULAN)"] || "0",
              "JENIS": row["JENIS"] || "-"
            }));
            setData(normalizedData);
            setLoading(false);
          }
        });
      } catch (err: any) {
        setError(err.message);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const generateCodes = (expiredMonths: string, tambahanKode: string = "-") => {
    const now = currentTime;
    const expDate = new Date(now);
    expDate.setMonth(expDate.getMonth() + (parseInt(expiredMonths) || 0));
    const line1 = `${String(expDate.getDate()).padStart(2, '0')}${String(expDate.getMonth() + 1).padStart(2, '0')}${expDate.getFullYear()}`;
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const monthEncoded = month.split('').map(digit => ENCODING_KEY[parseInt(digit)]).join('');
    const day = String(now.getDate()).padStart(2, '0');
    const year = String(now.getFullYear()).slice(-2);
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    const line2 = `${monthEncoded}${noCarousel.padStart(2, '0')}${day}${year}${prodLine}${plantCode} ${timeStr}${tambahanKode && tambahanKode !== "-" ? " " + tambahanKode : ""}`;
    return { line1, line2 };
  };

  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return data.filter(item => 
      item["NAMA PRODUK"].toLowerCase().includes(searchQuery.toLowerCase()) ||
      item["KARUNG"].toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [data, searchQuery]);

  const plantName = (code: string) => {
    switch(code) {
      case '1': return 'Cilegon';
      case '2': return 'Medan';
      case '3': return 'Makassar';
      default: return 'Unknown';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-12">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-6 h-6 text-blue-600" />
            <h1 className="font-bold text-xl tracking-tight">Sistem Kode Produksi</h1>
          </div>
          <div className="flex items-center gap-4">
             <div className="text-slate-500 font-mono text-xs">{currentTime.toLocaleTimeString()}</div>
             {loading && <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 mb-8">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Cpu className="w-5 h-5" /> Konfigurasi Generator</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase">No. Carousel</label>
              <input type="text" maxLength={2} className="w-full px-4 py-3 bg-slate-50 border rounded-xl" value={noCarousel} onChange={(e) => setNoCarousel(e.target.value.replace(/\D/g, ''))} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase">Production Line</label>
              <input type="text" maxLength={1} className="w-full px-4 py-3 bg-slate-50 border rounded-xl uppercase" value={prodLine} onChange={(e) => setProdLine(e.target.value.toUpperCase())} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase">Lokasi Plant</label>
              <select className="w-full px-4 py-3 bg-slate-50 border rounded-xl" value={plantCode} onChange={(e) => setPlantCode(e.target.value)}>
                <option value="1">1 - Cilegon</option>
                <option value="2">2 - Medan</option>
                <option value="3">3 - Makassar</option>
              </select>
            </div>
          </div>
        </section>

        <section className="mb-12 flex gap-3 max-w-2xl mx-auto">
          <input type="text" placeholder="Cari Produk..." className="flex-grow px-6 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm outline-none" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </section>

        <div className="grid gap-8">
          {filteredData.map((item, index) => {
            const codes = generateCodes(item["EXPIRED (BULAN)"], item["TAMBAHAN KODE"]);
            return (
              <div key={index} className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-slate-900 px-6 py-4 text-slate-400 text-xs font-mono flex justify-between">
                  <span>ONLINE</span>
                  <span>ID: {item.ID}</span>
                </div>
                <div className="p-8">
                  <h3 className="text-3xl font-black mb-4">{item["NAMA PRODUK"]}</h3>
                  <div className="bg-slate-950 rounded-2xl p-6 font-mono space-y-4">
                     <div className="flex flex-col"><span className="text-[10px] text-slate-500 uppercase">Line 1</span><span className="text-2xl text-white">{codes.line1}</span></div>
                     <div className="flex flex-col"><span className="text-[10px] text-slate-500 uppercase">Line 2</span>
                        <div className="text-xl text-white">
                           {codes.line2.split(' ')[0]} <span className="text-blue-500">{codes.line2.split(' ')[1]}</span> 
                           {codes.line2.split(' ').length > 2 && <span className="text-yellow-400 ml-2">{codes.line2.split(' ').slice(2).join(' ')}</span>}
                        </div>
                     </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
