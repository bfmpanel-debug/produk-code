/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import Papa from 'papaparse';
import { Search, Package, Calendar, Tag, AlertCircle, Loader2, Info, Factory, Cpu, Hash, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

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
const ENCODING_KEY = "FKSMALTOYI"; // 0123456789

export default function App() {
  const [data, setData] = useState<ProductionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Generator Inputs
  const [noCarousel, setNoCarousel] = useState('01');
  const [prodLine, setProdLine] = useState('A');
  const [plantCode, setPlantCode] = useState('1'); // 1: Cilegon, 2: Medan, 3: Makassar
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(SHEET_URL);
        if (!response.ok) throw new Error('Gagal mengambil data dari Google Sheets. Pastikan sheet bersifat publik.');
        const csvString = await response.text();
        
        Papa.parse(csvString, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            // Map the data to normalize header names if they have trailing spaces
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
          },
          error: (err: Error) => {
            setError(err.message);
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
    
    // Line 1: Expired Date (DDMMYYYY)
    const expDate = new Date(now);
    expDate.setMonth(expDate.getMonth() + (parseInt(expiredMonths) || 0));
    const line1 = `${String(expDate.getDate()).padStart(2, '0')}${String(expDate.getMonth() + 1).padStart(2, '0')}${expDate.getFullYear()}`;

    // Line 2: Production Code
    // Structure: [MonthCode][Carousel][Day][Year][Line][Plant] [Time] [TambahanKode]?
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
    const query = searchQuery.toLowerCase();
    return data.filter(item => 
      item["NAMA PRODUK"].toLowerCase().includes(query) ||
      item["KARUNG"].toLowerCase().includes(query)
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
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg shadow-lg shadow-blue-100">
              <Package className="w-5 h-5 text-white" />
            </div>
            <h1 className="font-bold text-lg sm:text-xl tracking-tight text-slate-800">Sistem Kode Produksi</h1>
          </div>
          <div className="flex items-center gap-4">
             <div className="hidden sm:flex items-center gap-2 text-slate-500 bg-slate-100 px-3 py-1 rounded-full text-xs font-mono">
               <Clock className="w-3.5 h-3.5" />
               {currentTime.toLocaleTimeString()}
             </div>
             {loading && <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Input Configuration Grid */}
        <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 mb-8 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 opacity-50" />
          <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-blue-600" />
            Konfigurasi Generator
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-500 flex items-center gap-2 uppercase tracking-wider">
                <Hash className="w-4 h-4" />
                No. Carousel
              </label>
              <input
                type="text"
                maxLength={2}
                placeholder="02"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-mono text-lg"
                value={noCarousel}
                onChange={(e) => setNoCarousel(e.target.value.replace(/\D/g, ''))}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-500 flex items-center gap-2 uppercase tracking-wider">
                <Tag className="w-4 h-4" />
                Production Line
              </label>
              <input
                type="text"
                maxLength={1}
                placeholder="B"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-lg uppercase"
                value={prodLine}
                onChange={(e) => setProdLine(e.target.value.toUpperCase())}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-500 flex items-center gap-2 uppercase tracking-wider">
                <Factory className="w-4 h-4" />
                Lokasi Plant
              </label>
              <select
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-lg appearance-none cursor-pointer"
                value={plantCode}
                onChange={(e) => setPlantCode(e.target.value)}
              >
                <option value="1">1 - Cilegon</option>
                <option value="2">2 - Medan</option>
                <option value="3">3 - Makassar</option>
              </select>
            </div>
          </div>
        </section>

        {/* Search Section */}
        <section className="mb-12">
          <div className="max-w-2xl mx-auto flex flex-col sm:flex-row gap-3">
            <div className="relative group flex-grow">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              </div>
              <input
                type="text"
                placeholder="Cari Produk (Contoh: Jawara, Roket...)"
                className="block w-full pl-11 pr-12 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-lg font-medium"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoComplete="off"
                id="search-input"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <AlertCircle className="w-5 h-5 rotate-45" />
                </button>
              )}
            </div>
            <button 
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-100 active:transform active:scale-95 transition-all flex items-center justify-center gap-2 group"
              onClick={() => document.getElementById('search-input')?.focus()}
            >
              <Search className="w-5 h-5 group-hover:scale-110 transition-transform" />
              Cek Produk
            </button>
          </div>
        </section>

        {/* Status Messages */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-red-50 border border-red-200 p-5 rounded-2xl flex items-start gap-3 mb-8"
            >
              <AlertCircle className="w-6 h-6 text-red-500 shrink-0" />
              <div>
                <p className="font-bold text-red-800">Koneksi Bermasalah</p>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </motion.div>
          )}

          {!loading && searchQuery && filteredData.length === 0 && !error && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16 bg-white rounded-3xl border-2 border-dashed border-slate-200"
            >
              <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-10 h-10 text-slate-300" />
              </div>
              <p className="text-slate-600 font-bold text-xl">Produk Tidak Ditemukan</p>
              <p className="text-slate-400 mt-1">Gunakan nama yang lebih spesifik</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results List */}
        <div className="grid gap-8">
          <AnimatePresence>
            {filteredData.map((item, index) => {
              const codes = generateCodes(item["EXPIRED (BULAN)"], item["TAMBAHAN KODE"]);
              return (
                <motion.div
                  key={`${item.ID}-${index}`}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all"
                >
                  <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-slate-400 text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      SYSTEM STATUS: ONLINE
                    </div>
                    <span className="uppercase tracking-widest">DATABASE ID: {item.ID}</span>
                  </div>
                  
                  <div className="p-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                      <div>
                        <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
                          {item.JENIS}
                        </span>
                        <h3 className="text-3xl font-black text-slate-900 tracking-tight">{item["NAMA PRODUK"]}</h3>
                        <p className="text-slate-500 font-medium">Karung: {item.KARUNG}</p>
                      </div>
                      
                      <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <Calendar className="w-8 h-8 text-blue-600" />
                        <div>
                          <p className="text-xs font-bold text-slate-400 uppercase">Masa Expired</p>
                          <p className="text-xl font-black text-slate-800">{item["EXPIRED (BULAN)"]} Bulan</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-6">
                      {/* Generated Code Display */}
                      <div className="bg-slate-950 rounded-2xl p-6 shadow-inner relative group/code">
                        <div className="absolute top-4 right-4 group-hover:scale-110 transition-transform">
                          <Cpu className="w-6 h-6 text-blue-500 opacity-50" />
                        </div>
                        <h4 className="text-blue-400 text-xs font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                          Generated Production Code
                        </h4>
                        
                        <div className="space-y-4 font-mono">
                          <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 flex flex-col gap-1">
                             <span className="text-[10px] text-slate-600 font-bold uppercase">Line 1: Expired Date</span>
                             <span className="text-2xl text-white font-black tracking-widest">{codes.line1}</span>
                          </div>
                          
                          <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 flex flex-col gap-1">
                             <span className="text-[10px] text-slate-600 font-bold uppercase">Line 2: Encoded Data</span>
                             <span className="text-xl sm:text-2xl text-white font-black tracking-widest break-all">
                                {codes.line2.split(' ')[0]}
                                <span className="text-blue-500 ml-2">{codes.line2.split(' ')[1]}</span>
                                {codes.line2.split(' ').length > 2 && (
                                  <span className="text-yellow-400 ml-2">{codes.line2.split(' ').slice(2).join(' ')}</span>
                                )}
                             </span>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-4 text-[10px] font-bold text-slate-500 uppercase">
                          <span>Plant: {plantName(plantCode)}</span>
                          <span>Carousel: {noCarousel.padStart(2, '0')}</span>
                          <span>Line: {prodLine}</span>
                          {item["TAMBAHAN KODE"] && item["TAMBAHAN KODE"] !== "-" && (
                            <span className="text-blue-400">Tambahan: {item["TAMBAHAN KODE"]}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Initial Empty State */}
        {!searchQuery && !loading && !error && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            className="text-center py-24"
          >
             <div className="bg-slate-200 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                <Cpu className="w-12 h-12 text-slate-400" />
              </div>
              <p className="text-xl font-bold text-slate-600">Sistem Siap Digunakan</p>
              <p className="text-sm text-slate-400 mt-2">Pilih konfigurasi dan cari produk untuk Generate Kode</p>
          </motion.div>
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto px-4 py-8 mt-12 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Production encoding key</p>
          <p className="text-sm font-mono text-blue-600 font-bold">{ENCODING_KEY}</p>
        </div>
        <p className="text-xs font-bold text-slate-400">
          &copy; {new Date().getFullYear()} Generator Kode Produksi • Ver 2.0
        </p>
      </footer>
    </div>
  );
}
