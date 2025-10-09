//component/features/host/components/StepIndicator.tsx
import React from 'react'
import { Check } from 'lucide-react'

interface StepProps {
  isActive: boolean
  isCompleted: boolean
  stepNumber: number
  title: string
}

const StepIndicator: React.FC<StepProps> = ({ isActive, isCompleted, stepNumber, title }) => (
  <div className={`flex items-center ${
    isCompleted ? 'text-pink-600' : 
    isActive ? 'text-purple-600' : 
    'text-gray-400'
  }`}>
    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
      isCompleted ? 'bg-gradient-to-r from-pink-100 to-pink-200 border-2 border-pink-600 text-pink-600' :
      isActive ? 'bg-gradient-to-r from-purple-100 to-pink-100 border-2 border-purple-600 text-purple-600' : 
      'bg-gray-100 border-2 border-gray-300 text-gray-400'
    }`}>
      {isCompleted ? <Check className="w-5 h-5" /> : stepNumber}
    </div>
    <span className="ml-3 font-medium text-sm whitespace-nowrap">{title}</span>
  </div>
)

export default StepIndicator