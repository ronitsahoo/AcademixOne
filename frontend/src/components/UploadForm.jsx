import { useState } from 'react';
import PropTypes from 'prop-types';
import apiService from '../services/api'; // Assume this handles API calls with auth

function UploadForm({ onUpload, acceptedTypes = ".pdf,.doc,.docx,.ppt,.pptx,.txt", maxSize = 10, category = 'assignment' }) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = async (files) => {
    setUploading(true);
    const fileArray = Array.from(files);
    const formData = new FormData();
    
    for (const file of fileArray) {
      // Validate file size
      if (file.size > maxSize * 1024 * 1024) {
        alert(`File ${file.name} is too large. Maximum size is ${maxSize}MB.`);
        continue;
      }
      formData.append('files', file);
    }

    try {
      const response = await apiService.post(`/upload/${category}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      const newFiles = response.data.files.map((file, index) => ({
        id: Date.now() + index,
        name: file.originalName,
        size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
        type: file.mimetype,
        uploadDate: new Date().toISOString(),
        url: file.path, // Backend returns /uploads/... path
      }));
      
      setUploadedFiles(prev => [...prev, ...newFiles]);
      
      if (onUpload) {
        onUpload(newFiles);
      }
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed: ' + (error.response?.data?.message || error.message));
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (fileId) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 transition-colors duration-200 ${
          dragActive
            ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          multiple
          accept={acceptedTypes}
          onChange={handleChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={uploading}
        />
        
        <div className="text-center">
          <div className="text-4xl mb-4">📁</div>
          <div className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {uploading ? 'Uploading...' : 'Drop files here or click to browse'}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Supported formats: {acceptedTypes.replace(/\./g, '').toUpperCase()}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Maximum file size: {maxSize}MB
          </div>
        </div>
        
        {uploading && (
          <div className="absolute inset-0 bg-white dark:bg-gray-800 bg-opacity-75 flex items-center justify-center rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="text-gray-900 dark:text-white">Uploading...</span>
            </div>
          </div>
        )}
      </div>

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white">Uploaded Files:</h4>
          {uploadedFiles.map((file) => (
            <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="text-2xl">
                  {file.type.includes('pdf') ? '📄' :
                   file.type.includes('image') ? '🖼️' :
                   file.type.includes('video') ? '🎥' : '📎'}
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">{file.name}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">{file.size}</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <a
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  View
                </a>
                <button
                  onClick={() => removeFile(file.id)}
                  className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

UploadForm.propTypes = {
  onUpload: PropTypes.func,
  acceptedTypes: PropTypes.string,
  maxSize: PropTypes.number,
  category: PropTypes.oneOf(['assignment', 'resource', 'avatar']),
};

export default UploadForm;