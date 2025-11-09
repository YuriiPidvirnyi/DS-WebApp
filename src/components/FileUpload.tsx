import React, { useState, useCallback, useRef } from 'react'
import { Upload, X, FileIcon, Image as ImageIcon } from 'lucide-react'

interface FileUploadProps {
  accept?: string
  maxSize?: number // in bytes
  maxFiles?: number
  multiple?: boolean
  onFilesChange: (files: File[]) => void
  value?: File[]
  className?: string
}

/**
 * File upload component with drag-and-drop, preview, and validation
 */
export const FileUpload: React.FC<FileUploadProps> = ({
  accept = 'image/*',
  maxSize = 5 * 1024 * 1024, // 5MB
  maxFiles = 5,
  multiple = false,
  onFilesChange,
  value = [],
  className = '',
}) => {
  const [isDragging, setIsDragging] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = (file: File): string | null => {
    if (maxSize && file.size > maxSize) {
      return `${file.name} is too large. Maximum size is ${(maxSize / 1024 / 1024).toFixed(1)}MB`
    }

    if (accept && accept !== '*') {
      const acceptedTypes = accept.split(',').map(t => t.trim())
      const fileType = file.type
      const fileExtension = `.${file.name.split('.').pop()?.toLowerCase()}`

      const isValid = acceptedTypes.some(type => {
        if (type.includes('*')) {
          const baseType = type.split('/')[0]
          return fileType.startsWith(baseType)
        }
        return type === fileType || type === fileExtension
      })

      if (!isValid) {
        return `${file.name} has an invalid file type`
      }
    }

    return null
  }

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return

      const newErrors: string[] = []
      const validFiles: File[] = []

      Array.from(files).forEach(file => {
        const error = validateFile(file)
        if (error) {
          newErrors.push(error)
        } else {
          validFiles.push(file)
        }
      })

      const totalFiles = [...value, ...validFiles]
      if (totalFiles.length > maxFiles) {
        newErrors.push(`Maximum ${maxFiles} files allowed`)
        validFiles.splice(maxFiles - value.length)
      }

      setErrors(newErrors)

      if (validFiles.length > 0) {
        onFilesChange([...value, ...validFiles])
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [value, maxFiles, onFilesChange]
  )

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)
      handleFiles(e.dataTransfer.files)
    },
    [handleFiles]
  )

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFiles(e.target.files)
    },
    [handleFiles]
  )

  const handleRemoveFile = useCallback(
    (index: number) => {
      const newFiles = value.filter((_, i) => i !== index)
      onFilesChange(newFiles)
    },
    [value, onFilesChange]
  )

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const getFilePreview = (file: File) => {
    if (file.type.startsWith('image/')) {
      return URL.createObjectURL(file)
    }
    return null
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragging ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-gray-400'}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileInput}
          className="hidden"
        />

        <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />

        <p className="text-lg font-medium text-gray-700 mb-2">
          {isDragging ? 'Drop files here' : 'Click to upload or drag and drop'}
        </p>

        <p className="text-sm text-gray-500">
          {accept === 'image/*' && 'Images only'}
          {maxSize && ` • Max ${(maxSize / 1024 / 1024).toFixed(0)}MB`}
          {multiple && ` • Up to ${maxFiles} files`}
        </p>
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="space-y-1">
          {errors.map((error, index) => (
            <p key={index} className="text-sm text-red-600">
              {error}
            </p>
          ))}
        </div>
      )}

      {/* File List */}
      {value.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">
            Uploaded Files ({value.length}/{maxFiles})
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {value.map((file, index) => {
              const preview = getFilePreview(file)
              const isImage = file.type.startsWith('image/')

              return (
                <div
                  key={`${file.name}-${index}`}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  {/* Preview/Icon */}
                  <div className="flex-shrink-0">
                    {preview ? (
                      <img
                        src={preview}
                        alt={file.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                    ) : (
                      <div className="w-12 h-12 flex items-center justify-center bg-gray-200 rounded">
                        {isImage ? (
                          <ImageIcon className="w-6 h-6 text-gray-500" />
                        ) : (
                          <FileIcon className="w-6 h-6 text-gray-500" />
                        )}
                      </div>
                    )}
                  </div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(index)}
                    className="flex-shrink-0 p-1 text-gray-400 hover:text-red-600 transition-colors"
                    aria-label="Remove file"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
