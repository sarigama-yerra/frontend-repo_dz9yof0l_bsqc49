import { useEffect, useMemo, useState } from 'react'
import { BrowserRouter, Link, useNavigate } from 'react-router-dom'
import { Sun, Moon, FileSpreadsheet, FileText, Plus, Trash2, Eye, History } from 'lucide-react'

const BRAND = {
  primary: '#2B6CB0',
  secondary: '#1A202C',
  bg: '#F7FAFC'
}

function useDarkMode() {
  const [dark, setDark] = useState(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem('theme') === 'dark'
  })
  useEffect(() => {
    const root = document.documentElement
    if (dark) {
      root.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      root.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [dark])
  return { dark, setDark }
}

function Layout({ children, title }) {
  const { dark, setDark } = useDarkMode()
  return (
    <div className={`min-h-screen ${dark ? 'bg-secondary text-white' : 'bg-background text-secondary'}`}>      
      <header className="sticky top-0 z-40 border-b border-black/10 dark:border-white/10 bg-white/70 dark:bg-[#0f172a]/70 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[var(--primary,#2B6CB0)]" style={{background: BRAND.primary}}></div>
            <div>
              <h1 className="text-lg font-semibold">RAB & Laporan Keuangan</h1>
              <p className="text-xs opacity-70">Pembuatan otomatis • Export Word & Excel</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/" className="px-3 py-2 text-sm rounded-md hover:bg-black/5 dark:hover:bg-white/10">Dashboard</Link>
            <Link to="/rab" className="px-3 py-2 text-sm rounded-md hover:bg-black/5 dark:hover:bg-white/10">Buat Laporan</Link>
            <Link to="/riwayat" className="px-3 py-2 text-sm rounded-md hover:bg-black/5 dark:hover:bg-white/10">Riwayat</Link>
            <button onClick={() => setDark(v=>!v)} className="ml-2 inline-flex items-center gap-2 px-3 py-2 rounded-md border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10">
              {dark ? <Sun size={18}/> : <Moon size={18}/>}<span className="text-sm">{dark? 'Terang' : 'Gelap'}</span>
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-semibold mb-6">{title}</h2>
        {children}
      </main>
    </div>
  )
}

function Home() {
  const navigate = useNavigate()
  const list = JSON.parse(localStorage.getItem('rab_history')||'[]')
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="rounded-2xl border border-black/10 dark:border-white/10 p-6 bg-white dark:bg-slate-900 shadow-sm">
        <h3 className="text-xl font-semibold mb-2">Buat Laporan RAB</h3>
        <p className="text-sm opacity-70 mb-4">Mulai pembuatan laporan anggaran biaya dengan tabel dinamis.</p>
        <button onClick={()=>navigate('/rab')} className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-white" style={{background: BRAND.primary}}>
          <Plus size={18}/> Mulai Sekarang
        </button>
      </div>
      <div className="rounded-2xl border border-black/10 dark:border-white/10 p-6 bg-white dark:bg-slate-900 shadow-sm">
        <h3 className="text-xl font-semibold mb-2">Riwayat Laporan</h3>
        <p className="text-sm opacity-70 mb-4">Akses kembali laporan yang tersimpan di perangkat Anda.</p>
        <button onClick={()=>navigate('/riwayat')} className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-white" style={{background: BRAND.secondary, color: 'white'}}>
          <History size={18}/> Lihat Riwayat ({list.length})
        </button>
      </div>
    </div>
  )
}

function emptyRow() {
  return { no: '', kategori: '', keterangan: '', jumlah: '', satuan: '', harga: '' }
}

function validateNumber(v){
  if(v === '' || v === null || v === undefined) return ''
  const n = Number(v)
  return isNaN(n) ? '' : n
}

function currency(n){
  const val = Number(n||0)
  return val.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })
}

function groupByCategory(rows){
  const map = {}
  rows.forEach(r => {
    const total = (Number(r.jumlah||0) * Number(r.harga||0))
    if(!map[r.kategori||'-']) map[r.kategori||'-'] = 0
    map[r.kategori||'-'] += total
  })
  return map
}

function useLocalState(key, initial){
  const [state, setState] = useState(() => {
    try{
      const saved = localStorage.getItem(key)
      return saved ? JSON.parse(saved) : initial
    } catch(e){ return initial }
  })
  useEffect(() => {
    try{ localStorage.setItem(key, JSON.stringify(state)) }catch{}
  }, [key, state])
  return [state, setState]
}

function RABForm(){
  const [meta, setMeta] = useLocalState('rab_meta', { nama: 'Laporan RAB', tanggal: new Date().toISOString().slice(0,10) })
  const [rows, setRows] = useLocalState('rab_rows', [emptyRow()])

  const totals = useMemo(() => rows.map(r => Number(r.jumlah||0) * Number(r.harga||0)), [rows])
  const grandTotal = useMemo(() => totals.reduce((a,b)=>a+b,0), [totals])
  const categoryTotals = useMemo(() => groupByCategory(rows), [rows])

  function addRow(){ setRows([...rows, emptyRow()]) }
  function removeRow(i){ setRows(rows.filter((_,idx)=>idx!==i)) }
  function update(i, key, val){
    setRows(rows.map((r,idx)=> idx===i ? { ...r, [key]: key==='jumlah' || key==='harga' ? validateNumber(val) : val } : r))
  }

  function saveToHistory(){
    const history = JSON.parse(localStorage.getItem('rab_history')||'[]')
    const id = Date.now()
    const data = { id, meta, rows }
    localStorage.setItem('rab_history', JSON.stringify([{...data}, ...history].slice(0,50)))
    alert('Laporan disimpan ke Riwayat!')
  }

  function goPreview(){
    sessionStorage.setItem('rab_current', JSON.stringify({ meta, rows }))
    window.location.href = '/preview'
  }

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-slate-900">
          <label className="text-sm opacity-70">Nama Laporan</label>
          <input value={meta.nama} onChange={e=>setMeta({...meta, nama: e.target.value})} className="mt-1 w-full px-3 py-2 rounded-md border border-black/10 dark:border-white/10 bg-white dark:bg-slate-800" placeholder="Contoh: Proyek Renovasi"/>
        </div>
        <div className="p-4 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-slate-900">
          <label className="text-sm opacity-70">Tanggal</label>
          <input type="date" value={meta.tanggal} onChange={e=>setMeta({...meta, tanggal: e.target.value})} className="mt-1 w-full px-3 py-2 rounded-md border border-black/10 dark:border-white/10 bg-white dark:bg-slate-800"/>
        </div>
        <div className="p-4 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-slate-900">
          <label className="text-sm opacity-70">Aksi</label>
          <div className="mt-1 flex gap-2">
            <button onClick={addRow} className="px-3 py-2 rounded-md text-white inline-flex items-center gap-2" style={{background: BRAND.primary}}><Plus size={16}/> Tambah Baris</button>
            <button onClick={saveToHistory} className="px-3 py-2 rounded-md border border-black/10 dark:border-white/10">Simpan</button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl overflow-x-auto border border-black/10 dark:border-white/10 bg-white dark:bg-slate-900">
        <table className="w-full text-sm">
          <thead className="bg-black/5 dark:bg-white/5">
            <tr>
              <th className="p-3 text-left">No</th>
              <th className="p-3 text-left">Kategori</th>
              <th className="p-3 text-left">Keterangan</th>
              <th className="p-3 text-left">Jumlah</th>
              <th className="p-3 text-left">Satuan</th>
              <th className="p-3 text-left">Harga Satuan</th>
              <th className="p-3 text-left">Total</th>
              <th className="p-3 text-left">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t border-black/5 dark:border-white/5">
                <td className="p-3 w-16"><input className="w-full px-2 py-1 bg-transparent border rounded-md border-black/10 dark:border-white/10" value={r.no} onChange={e=>update(i,'no', e.target.value)} placeholder={String(i+1)}/></td>
                <td className="p-3"><input className="w-full px-2 py-1 bg-transparent border rounded-md border-black/10 dark:border-white/10" value={r.kategori} onChange={e=>update(i,'kategori', e.target.value)} placeholder="Kategori"/></td>
                <td className="p-3"><input className="w-full px-2 py-1 bg-transparent border rounded-md border-black/10 dark:border-white/10" value={r.keterangan} onChange={e=>update(i,'keterangan', e.target.value)} placeholder="Keterangan"/></td>
                <td className="p-3 w-28"><input type="number" className="w-full px-2 py-1 bg-transparent border rounded-md border-black/10 dark:border-white/10" value={r.jumlah} onChange={e=>update(i,'jumlah', e.target.value)} placeholder="0"/></td>
                <td className="p-3 w-28"><input className="w-full px-2 py-1 bg-transparent border rounded-md border-black/10 dark:border-white/10" value={r.satuan} onChange={e=>update(i,'satuan', e.target.value)} placeholder="Unit"/></td>
                <td className="p-3 w-40"><input type="number" className="w-full px-2 py-1 bg-transparent border rounded-md border-black/10 dark:border-white/10" value={r.harga} onChange={e=>update(i,'harga', e.target.value)} placeholder="0"/></td>
                <td className="p-3 font-medium">{currency(totals[i])}</td>
                <td className="p-3">
                  <button onClick={()=>removeRow(i)} className="text-red-600 hover:text-red-700"><Trash2 size={18}/></button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-black/5 dark:bg-white/5">
              <td className="p-3" colSpan={6}><span className="font-medium">Grand Total</span></td>
              <td className="p-3 font-semibold">{currency(grandTotal)}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-black/10 dark:border-white/10 p-4 bg-white dark:bg-slate-900">
          <h4 className="font-semibold mb-2">Persentase per Kategori</h4>
          <div className="space-y-2">
            {Object.entries(categoryTotals).map(([k, v]) => (
              <div key={k} className="flex items-center gap-3">
                <div className="w-40 text-sm opacity-80">{k}</div>
                <div className="flex-1 h-2 rounded bg-black/10 dark:bg-white/10 overflow-hidden">
                  <div className="h-2" style={{width: `${grandTotal? (v/grandTotal*100).toFixed(2):0}%`, background: BRAND.primary}}></div>
                </div>
                <div className="w-20 text-right text-sm">{grandTotal? (v/grandTotal*100).toFixed(2):0}%</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-black/10 dark:border-white/10 p-4 bg-white dark:bg-slate-900">
          <h4 className="font-semibold mb-2">Aksi</h4>
          <div className="flex flex-wrap gap-2">
            <a href="/preview" onClick={(e)=>{e.preventDefault(); goPreview()}} className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-white" style={{background: BRAND.primary}}><Eye size={18}/> Preview</a>
            <ExportExcelButton rows={rows} meta={meta}/>
            <ExportWordButton rows={rows} meta={meta}/>
          </div>
        </div>
      </div>
    </div>
  )
}

import { saveAs } from 'file-saver'
import ExcelJS from 'exceljs'
async function generateExcel({ rows, meta }){
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('RAB')

  sheet.columns = [
    { header: 'No', key: 'no', width: 6 },
    { header: 'Kategori', key: 'kategori', width: 20 },
    { header: 'Keterangan', key: 'keterangan', width: 32 },
    { header: 'Jumlah', key: 'jumlah', width: 12 },
    { header: 'Satuan', key: 'satuan', width: 12 },
    { header: 'Harga Satuan', key: 'harga', width: 16 },
    { header: 'Total', key: 'total', width: 16 },
  ]

  // Header title
  sheet.mergeCells('A1:G1')
  sheet.getCell('A1').value = 'LAPORAN RENCANA ANGGARAN BIAYA'
  sheet.getCell('A1').alignment = { horizontal: 'center' }
  sheet.getCell('A1').font = { bold: true, size: 14 }

  sheet.getCell('A2').value = `Nama Laporan: ${meta.nama}`
  sheet.getCell('A3').value = `Tanggal: ${meta.tanggal}`

  // Table header at row 5
  const startRow = 5
  sheet.getRow(startRow).values = sheet.columns.map(c=>c.header)
  sheet.getRow(startRow).font = { bold: true }

  // Fill rows with formulas for Total
  const firstDataRow = startRow + 1
  rows.forEach((r, idx) => {
    const excelRow = sheet.getRow(firstDataRow + idx)
    excelRow.getCell(1).value = r.no || idx + 1
    excelRow.getCell(2).value = r.kategori
    excelRow.getCell(3).value = r.keterangan
    excelRow.getCell(4).value = r.jumlah || 0
    excelRow.getCell(5).value = r.satuan
    excelRow.getCell(6).value = r.harga || 0
    // Total = Jumlah * Harga (D * F)
    const rowIndex = firstDataRow + idx
    excelRow.getCell(7).value = { formula: `D${rowIndex}*F${rowIndex}` }
  })

  const endDataRow = firstDataRow + rows.length - 1

  // Grand Total
  const totalRow = sheet.getRow(endDataRow + 1)
  totalRow.getCell(6).value = 'Grand Total'
  totalRow.getCell(7).value = { formula: `SUM(G${firstDataRow}:G${endDataRow})` }
  totalRow.font = { bold: true }

  // Explanation sheet
  const info = workbook.addWorksheet('Penjelasan Rumus')
  const notes = [
    ['SUM', 'Menjumlahkan data.', 'Contoh =SUM(G'+firstDataRow+':G'+endDataRow+')'],
    ['AVERAGE', 'Menghitung rata-rata.', 'Contoh =AVERAGE(G'+firstDataRow+':G'+endDataRow+')'],
    ['PERCENTAGE', 'Menghitung persen.', 'Contoh =G'+firstDataRow+'/$G$'+(endDataRow+1)],
    ['TOTAL', 'Menghitung total biaya per item.', 'Contoh =D5*F5']
  ]
  info.columns = [
    { header: 'Rumus', key: 'r', width: 16 },
    { header: 'Deskripsi', key: 'd', width: 40 },
    { header: 'Contoh', key: 'c', width: 40 },
  ]
  notes.forEach(n=> info.addRow({ r: n[0], d: n[1], c: n[2] }))

  const blob = await workbook.xlsx.writeBuffer()
  saveAs(new Blob([blob], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `${meta.nama || 'RAB'}.xlsx`)
}

function ExportExcelButton({ rows, meta }){
  return (
    <button onClick={()=>generateExcel({rows, meta})} className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-black/10 dark:border-white/10">
      <FileSpreadsheet size={18}/> Export Excel
    </button>
  )
}

import { Document, Packer, Paragraph, HeadingLevel, TextRun, Table, TableRow, TableCell, AlignmentType, WidthType } from 'docx'
async function generateWord({ rows, meta }){
  const tableRows = [
    new TableRow({
      children: ['No','Kategori','Keterangan','Jumlah','Satuan','Harga Satuan','Total'].map(t => new TableCell({ children: [new Paragraph({ text: t })] }))
    }),
    ...rows.map((r, idx) => new TableRow({
      children: [
        String(r.no || idx + 1), r.kategori || '', r.keterangan || '', String(r.jumlah || 0), r.satuan || '', currency(r.harga||0), currency((r.jumlah||0)*(r.harga||0))
      ].map(t => new TableCell({ children: [new Paragraph({ text: String(t) })] }))
    }))
  ]

  const grandTotal = rows.reduce((a,b)=> a + (Number(b.jumlah||0)*Number(b.harga||0)), 0)

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({ text: 'LAPORAN RENCANA ANGGARAN BIAYA', heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER }),
          new Paragraph({ text: `Nama Laporan: ${meta.nama}` }),
          new Paragraph({ text: `Tanggal: ${meta.tanggal}` }),
          new Paragraph({ text: '' }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: tableRows
          }),
          new Paragraph({ text: '' }),
          new Paragraph({ children: [ new TextRun({ text: `Total Keseluruhan: ${currency(grandTotal)}`, bold: true }) ] }),
          new Paragraph({ text: 'Catatan: Dokumen ini dihasilkan otomatis oleh sistem.' })
        ]
      }
    ]
  })

  const blob = await Packer.toBlob(doc)
  saveAs(blob, `${meta.nama || 'RAB'}.docx`)
}

function ExportWordButton({ rows, meta }){
  return (
    <button onClick={()=>generateWord({rows, meta})} className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-black/10 dark:border-white/10">
      <FileText size={18}/> Export Word
    </button>
  )
}

function Preview(){
  const data = JSON.parse(sessionStorage.getItem('rab_current')||'null')
  if(!data){
    return <div className="p-6 rounded-xl border border-black/10 dark:border-white/10">Tidak ada data untuk preview. Silakan buat laporan terlebih dahulu.</div>
  }
  const { meta, rows } = data
  const grandTotal = rows.reduce((a,b)=> a + (Number(b.jumlah||0)*Number(b.harga||0)), 0)
  return (
    <div className="mx-auto max-w-3xl bg-white text-black shadow p-8 rounded-xl">
      <div className="text-center mb-4">
        <div className="font-bold text-lg">LAPORAN RENCANA ANGGARAN BIAYA</div>
      </div>
      <div className="text-sm space-y-1 mb-4">
        <div>Nama Laporan: {meta.nama}</div>
        <div>Tanggal: {meta.tanggal}</div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border border-black/20">
          <thead>
            <tr className="bg-black/5">
              {['No','Kategori','Keterangan','Jumlah','Satuan','Harga Satuan','Total'].map(h => <th key={h} className="p-2 border border-black/20 text-left">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => (
              <tr key={idx}>
                <td className="p-2 border border-black/20">{r.no || idx+1}</td>
                <td className="p-2 border border-black/20">{r.kategori}</td>
                <td className="p-2 border border-black/20">{r.keterangan}</td>
                <td className="p-2 border border-black/20">{r.jumlah}</td>
                <td className="p-2 border border-black/20">{r.satuan}</td>
                <td className="p-2 border border-black/20">{currency(r.harga)}</td>
                <td className="p-2 border border-black/20">{currency(Number(r.jumlah||0)*Number(r.harga||0))}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={6} className="p-2 border border-black/20 text-right font-semibold">Total Keseluruhan</td>
              <td className="p-2 border border-black/20 font-bold">{currency(grandTotal)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      <div className="flex gap-2 mt-4">
        <ExportExcelButton rows={rows} meta={meta}/>
        <ExportWordButton rows={rows} meta={meta}/>
      </div>
      <div className="mt-6 text-xs opacity-70">Catatan: Dokumen ini dihasilkan otomatis oleh sistem.</div>
    </div>
  )
}

function Riwayat(){
  const navigate = useNavigate()
  const [history, setHistory] = useLocalState('rab_history', [])
  function open(item){
    sessionStorage.setItem('rab_current', JSON.stringify(item))
    navigate('/preview')
  }
  return (
    <div className="grid gap-3">
      {history.length===0 && <div className="p-6 rounded-xl border border-black/10 dark:border-white/10">Belum ada riwayat.</div>}
      {history.map(h => (
        <div key={h.id} className="p-4 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-slate-900 flex items-center justify-between">
          <div>
            <div className="font-semibold">{h.meta.nama}</div>
            <div className="text-xs opacity-70">{h.meta.tanggal} • {h.rows.length} baris</div>
          </div>
          <div className="flex gap-2">
            <button onClick={()=>open(h)} className="px-3 py-2 rounded-md border border-black/10 dark:border-white/10">Preview</button>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function App(){
  return (
    <BrowserRouter>
      <Layout title="Dashboard">
        <RoutesView/>
      </Layout>
    </BrowserRouter>
  )
}

function RoutesView(){
  const path = typeof window !== 'undefined' ? window.location.pathname : '/'
  if(path === '/riwayat') return <Riwayat/>
  if(path === '/rab') return <RABForm/>
  if(path === '/preview') return <Preview/>
  return <Home/>
}
