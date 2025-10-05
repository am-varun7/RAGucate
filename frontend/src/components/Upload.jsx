import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const Upload = () => {
  const [file, setFile] = useState(null);
  const [link, setLink] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);

  const fetchUploadedFiles = async () => {
    setIsLoadingFiles(true);
    try {
      const response = await axios.get('http://localhost:5000/files');
      setUploadedFiles(response.data.files || []);
    } catch (error) {
      console.error('Error fetching files:', error);
      toast.error('Failed to fetch uploaded files');
    } finally {
      setIsLoadingFiles(false);
    }
  };

  useEffect(() => {
    fetchUploadedFiles();
  }, []);

  const handleUpload = async () => {
    if (!file && !link.trim()) {
      toast.error('Please select a file or enter a link');
      return;
    }
    setIsUploading(true);
    const formData = new FormData();
    if (file) formData.append('file', file);
    if (link) formData.append('link', link);

    try {
      await axios.post('http://localhost:5000/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setFile(null);
      setLink('');
      fetchUploadedFiles();
      toast.success('Upload successful!');
    } catch (error) {
      console.error('Error uploading:', error);
      toast.error('Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (filename) => {
    if (!window.confirm(`Are you sure you want to delete ${filename}?`)) return;
    try {
      await axios.delete(`http://localhost:5000/delete/${filename}`);
      toast.success(`${filename} deleted successfully`);
      fetchUploadedFiles();
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error('Failed to delete file');
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-8">
      <div className="card">
        <h1 className="text-3xl mb-6 flex items-center gap-2">
          <i className="fas fa-upload"></i> Upload Study Materials
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Upload PDF/Notes</label>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files[0])}
              className="input-field"
              accept=".pdf,.txt"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Web Link</label>
            <input
              type="text"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://example.com"
              className="input-field"
            />
          </div>
        </div>
        <button
          onClick={handleUpload}
          disabled={isUploading}
          className="btn-primary"
        >
          {isUploading ? (
            <>
              <i className="fas fa-spinner fa-spin"></i> Uploading...
            </>
          ) : (
            <>
              <i className="fas fa-cloud-upload-alt"></i> Upload and Ingest
            </>
          )}
        </button>
      </div>

      <div className="card mt-6">
        <h2 className="text-2xl mb-4 flex items-center gap-2">
          <i className="fas fa-folder-open"></i> Uploaded Files
        </h2>

        {isLoadingFiles ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/3"></div>
              </div>
            ))}
          </div>
        ) : uploadedFiles.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">No files uploaded yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {uploadedFiles.map((f, i) => (
              <div key={i} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors flex flex-col justify-between">
                <div>
                  <p className="font-semibold text-blue-600 dark:text-blue-400">{f.title}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Date: {f.date}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Subject: {f.subject}</p>
                </div>
                <button
                  onClick={() => handleDelete(f.title)}
                  className="mt-2 btn-secondary text-sm w-full"
                >
                  <i className="fas fa-trash"></i> Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Upload;
