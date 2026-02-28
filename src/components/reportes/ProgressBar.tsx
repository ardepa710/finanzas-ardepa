/**
 * ProgressBar - Horizontal progress bar with percentage
 */

import React from 'react'

interface ProgressBarProps {
  percentage: number
  label?: string
  color?: 'blue' | 'green' | 'red' | 'yellow'
  className?: string
}

const COLOR_CLASSES = {
  blue: 'bg-blue-600',
  green: 'bg-green-600',
  red: 'bg-red-600',
  yellow: 'bg-yellow-600',
}

export default function ProgressBar({
  percentage,
  label,
  color = 'blue',
  className = '',
}: ProgressBarProps) {
  const clampedPercentage = Math.min(100, Math.max(0, percentage))

  return (
    <div className={className}>
      {label && (
        <div className="flex justify-between mb-1 text-sm">
          <span className="text-slate-300">{label}</span>
          <span className="text-slate-400">{clampedPercentage.toFixed(1)}%</span>
        </div>
      )}
      <div className="w-full bg-slate-700 rounded-full h-2.5">
        <div
          className={`${COLOR_CLASSES[color]} h-2.5 rounded-full transition-all duration-300`}
          style={{ width: `${clampedPercentage}%` }}
        />
      </div>
    </div>
  )
}
