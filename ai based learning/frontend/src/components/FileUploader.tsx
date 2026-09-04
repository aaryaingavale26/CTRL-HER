import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Loader2, FileCheck } from 'lucide-react';
import { uploadLearningDocument } from '../api/ai';
import { DocumentItem } from '../types';

interface FileUploaderProps {
  onUploadSuccess: (newDoc: DocumentItem) => void;
}

const ALLOWED_EXTENSIONS = ['.pdf', '.ppt', '.pptx', '.doc', '.docx'];
const MAX_SIZE_MB = 20;

export const FileUploader: React.FC<FileUploaderProps> = ({ onUploadSuccess }) => {
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): boolean => {
    setErrorMessage(null);
    setSuccessMessage(null);

    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setErrorMessage(`Invalid file format '${ext}'. Allowed formats: PDF, PPT, PPTX, DOC, DOCX.`);
      return false;
    }

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setErrorMessage(`File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds maximum ${MAX_SIZE_MB}MB limit.`);
      return false;
    }

    return true;
  };

  const handleFile = (file: File) => {
    if (validateFile(file)) {
      setSelectedFile(file);
    } else {
      setSelectedFile(null);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await uploadLearningDocument(selectedFile);
      if (response.success && response.data) {
        setSuccessMessage(
          `Document '${selectedFile.name}' processed cleanly and divided into ${response.data.chunks} contextual chunks.`
        );
        onUploadSuccess(response.data);
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'Failed to process document and generate chunks.';
      setErrorMessage(msg);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-gov-blue" />
            Upload Statistical Learning Material
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Ingest PDF, PowerPoint, or Word files into the cleaning & structure-aware chunking pipeline.
          </p>
        </div>
        <span className="text-[11px] font-medium bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md border border-slate-200">
          Max File Size: {MAX_SIZE_MB}MB
        </span>
      </div>

      {/* Drag & Drop Zone */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
          dragActive
            ? 'border-gov-blue bg-blue-50/50'
            : selectedFile
            ? 'border-emerald-300 bg-emerald-50/30'
            : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.ppt,.pptx,.doc,.docx"
          onChange={handleInputChange}
          className="hidden"
        />

        {selectedFile ? (
          <div className="flex flex-col items-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <FileCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">{selectedFile.name}</p>
              <p className="text-xs text-slate-500">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready for cleaning & chunking
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-gov-blue flex items-center justify-center">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700">
                Drag and drop your statistical document here, or <span className="text-gov-accent font-semibold underline">browse</span>
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Select PDF, PowerPoint, or Word files from your local storage
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Format Indicators */}
      <div className="flex flex-wrap items-center justify-between pt-1 gap-2 border-t border-slate-100">
        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-500 font-medium">Supported Formats:</span>
          <div className="flex items-center space-x-1.5">
            {['PDF', 'PPT', 'PPTX', 'DOC', 'DOCX'].map((fmt) => (
              <span key={fmt} className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-100 text-slate-600 border border-slate-200">
                {fmt}
              </span>
            ))}
          </div>
        </div>

        {selectedFile && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleUpload();
            }}
            disabled={isUploading}
            className="flex items-center space-x-2 px-4 py-2 bg-gov-blue hover:bg-blue-900 text-white rounded-lg font-medium text-xs shadow-sm transition-colors disabled:opacity-50"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-teal-300" />
                <span>Cleaning & Creating Chunks...</span>
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" />
                <span>Process & Create Chunks</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Error State */}
      {errorMessage && (
        <div className="flex items-start space-x-2 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Processing Error</p>
            <p className="mt-0.5">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Success State */}
      {successMessage && (
        <div className="flex items-start space-x-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Content Processed & Chunked</p>
            <p className="mt-0.5">{successMessage}</p>
          </div>
        </div>
      )}
    </div>
  );
};
