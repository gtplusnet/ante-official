import React, { useState, useRef } from 'react';
import { 
  FiCamera, 
  FiUpload, 
  FiX, 
  FiFile,
  FiImage,
  FiCheck
} from 'react-icons/fi';

interface FileUploadZoneProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  maxFiles?: number;
  maxSizePerFile?: number; // in MB
  acceptedFormats?: string[];
}

export const FileUploadZone: React.FC<FileUploadZoneProps> = ({
  files,
  onFilesChange,
  maxFiles = 3,
  maxSizePerFile = 5,
  acceptedFormats = ['image/jpeg', 'image/png', 'application/pdf'],
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);

  const validateFile = (file: File): string | null => {
    // Check file type
    if (!acceptedFormats.includes(file.type)) {
      return 'Invalid file type. Please upload JPG, PNG, or PDF files.';
    }

    // Check file size
    const maxSizeInBytes = maxSizePerFile * 1024 * 1024;
    if (file.size > maxSizeInBytes) {
      return `File size must be less than ${maxSizePerFile}MB.`;
    }

    return null;
  };

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const newFiles = Array.from(selectedFiles);
    const totalFiles = files.length + newFiles.length;

    if (totalFiles > maxFiles) {
      setError(`You can only upload up to ${maxFiles} files.`);
      return;
    }

    // Validate each file
    for (const file of newFiles) {
      const error = validateFile(file);
      if (error) {
        setError(error);
        return;
      }
    }

    setError('');
    onFilesChange([...files, ...newFiles]);
  };

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    onFilesChange(newFiles);
    setError('');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div>
      {/* Upload Zone */}
      {files.length < maxFiles && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200
            ${isDragging 
              ? 'border-primary-500 bg-primary-50' 
              : 'border-gray-300 bg-gray-50 hover:border-gray-400'
            }
          `}
        >
          <div className="space-y-4">
            <div className="flex justify-center gap-4">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="flex flex-col items-center gap-2 p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                <FiCamera className="w-8 h-8 text-primary-500" />
                <span className="text-sm font-medium text-gray-700">Take Photo</span>
              </button>
              
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center gap-2 p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                <FiUpload className="w-8 h-8 text-primary-500" />
                <span className="text-sm font-medium text-gray-700">Choose File</span>
              </button>
            </div>

            <p className="text-sm text-gray-500">
              or drag and drop your files here
            </p>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={acceptedFormats.join(',')}
              onChange={(e) => handleFileSelect(e.target.files)}
              className="hidden"
            />
            
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => handleFileSelect(e.target.files)}
              className="hidden"
            />
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-sm font-medium text-gray-700">
            Uploaded Files ({files.length}/{maxFiles})
          </p>
          
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg"
            >
              <div className="flex-shrink-0">
                {file.type.startsWith('image/') ? (
                  <FiImage className="w-5 h-5 text-blue-500" />
                ) : (
                  <FiFile className="w-5 h-5 text-gray-500" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {file.name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(file.size)}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <FiCheck className="w-4 h-4 text-green-500" />
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Requirements */}
      <div className="mt-4 text-xs text-gray-500 space-y-1">
        <p>• Maximum {maxFiles} files allowed</p>
        <p>• Maximum {maxSizePerFile}MB per file</p>
        <p>• Accepted formats: JPG, PNG, PDF</p>
      </div>
    </div>
  );
};