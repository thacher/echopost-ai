'use client'

import { motion } from 'framer-motion'

interface Platform {
  id: string
  name: string
  icon: string
  color: string
}

interface PlatformSelectorProps {
  selectedPlatforms: string[]
  onPlatformsChange: (platforms: string[]) => void
  disabled?: boolean
}

const platforms: Platform[] = [
  {
    id: 'facebook',
    name: 'Facebook',
    icon: 'fb',
    color: 'bg-blue-600'
  },
  {
    id: 'instagram',
    name: 'Instagram',
    icon: 'ig',
    color: 'bg-gradient-to-r from-purple-500 to-pink-500'
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    icon: 'tt',
    color: 'bg-black'
  },
  {
    id: 'youtube',
    name: 'YouTube',
    icon: 'yt',
    color: 'bg-red-600'
  }
]

export default function PlatformSelector({ selectedPlatforms, onPlatformsChange, disabled = false }: PlatformSelectorProps) {
  const togglePlatform = (platformId: string) => {
    if (disabled) return
    
    const newSelection = selectedPlatforms.includes(platformId)
      ? selectedPlatforms.filter(id => id !== platformId)
      : [...selectedPlatforms, platformId]
    
    console.log('Platform selection changed:', { platformId, from: selectedPlatforms, to: newSelection })
    onPlatformsChange(newSelection)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-lg font-semibold ${disabled ? 'text-secondary-500' : ''}`}>
          Select Platforms {disabled && '(Generating...)'}
        </h3>
        <div className="flex items-center space-x-2 text-sm text-secondary-600">
          <span>{selectedPlatforms.length} selected</span>
          {selectedPlatforms.length > 0 && (
            <button
              onClick={() => !disabled && onPlatformsChange([])}
              disabled={disabled}
              className={`font-medium ${
                disabled 
                  ? 'text-secondary-400 cursor-not-allowed'
                  : 'text-primary-600 hover:text-primary-700'
              }`}
            >
              Clear All
            </button>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {platforms.map((platform) => {
          const isSelected = selectedPlatforms.includes(platform.id)
          
          return (
            <motion.div
              key={platform.id}
              whileHover={!disabled ? { scale: 1.02 } : {}}
              whileTap={!disabled ? { scale: 0.98 } : {}}
              onClick={() => togglePlatform(platform.id)}
              className={`relative p-4 rounded-xl border-2 transition-all duration-300 ${
                disabled 
                  ? 'cursor-not-allowed opacity-60 bg-secondary-50' 
                  : 'cursor-pointer'
              } ${
                !disabled && isSelected
                  ? 'border-primary-500 bg-primary-50 shadow-lg'
                  : !disabled 
                    ? 'border-secondary-200 bg-white hover:border-primary-300 hover:bg-primary-50/50'
                    : 'border-secondary-200'
              }`}
            >
              {/* Selection indicator */}
              <div className={`absolute top-3 right-3 w-6 h-6 rounded-full border-2 transition-all duration-300 ${
                isSelected 
                  ? 'bg-primary-600 border-primary-600' 
                  : 'border-secondary-300 bg-white'
              }`}>
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-full h-full flex items-center justify-center"
                  >
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </motion.div>
                )}
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 flex items-center justify-center">
                  {platform.icon === 'fb' && (
                    <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  )}
                  {platform.icon === 'ig' && (
                    <svg className="w-6 h-6 text-pink-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  )}
                  {platform.icon === 'tt' && (
                    <svg className="w-6 h-6 text-black" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                    </svg>
                  )}
                  {platform.icon === 'yt' && (
                    <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-secondary-900 mb-1">
                    {platform.name}
                  </h4>
                </div>
              </div>


            </motion.div>
          )
        })}
      </div>



      {selectedPlatforms.length === 0 && (
        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-700">
            Please select at least one platform to continue
          </p>
        </div>
      )}
    </div>
  )
}
