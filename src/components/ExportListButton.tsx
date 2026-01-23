'use client';

import { useState } from 'react';
import { exportList } from '@/app/actions';

export default function ExportListButton({ listId, listName }: { listId: number, listName: string }) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    
    const result = await exportList(listId);

    if (result.success && result.data) {
      // Создаем "виртуальный" файл и ссылку на него
      const jsonString = JSON.stringify(result.data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // Создаем ссылку, кликаем по ней и удаляем
      const link = document.createElement('a');
      link.href = url;
      link.download = `${listName.replace(/\s+/g, '_')}_backup.json`; // Имя файла: "Мой_список_backup.json"
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url); // Очищаем память
    } else {
      alert(result.message || 'Ошибка экспорта');
    }

    setIsExporting(false);
  };

  return (
    <button
      onClick={handleExport}
      disabled={isExporting}
      className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-all border border-transparent hover:border-white/10"
      title="Скачать список (JSON)"
    >
      {isExporting ? (
        <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
           <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
           <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
      )}
    </button>
  );
}
