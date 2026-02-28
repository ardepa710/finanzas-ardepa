/**
 * DateRangePicker - Reusable date range selector
 */

import React from 'react'

interface DateRangePickerProps {
  inicio: string
  fin: string
  onInicioChange: (date: string) => void
  onFinChange: (date: string) => void
  className?: string
}

export default function DateRangePicker({
  inicio,
  fin,
  onInicioChange,
  onFinChange,
  className = '',
}: DateRangePickerProps) {
  return (
    <div className={`flex gap-4 items-end ${className}`}>
      <div className="flex-1">
        <label className="block text-sm font-medium text-slate-300 mb-1">
          Fecha inicio
        </label>
        <input
          type="date"
          value={inicio}
          onChange={(e) => onInicioChange(e.target.value)}
          className="input"
        />
      </div>
      <div className="flex-1">
        <label className="block text-sm font-medium text-slate-300 mb-1">
          Fecha fin
        </label>
        <input
          type="date"
          value={fin}
          onChange={(e) => onFinChange(e.target.value)}
          className="input"
        />
      </div>
    </div>
  )
}
