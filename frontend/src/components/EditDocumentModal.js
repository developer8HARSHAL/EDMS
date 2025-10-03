// frontend/src/components/documents/EditDocumentModal.jsx
import React, { useState, useEffect, useRef } from 'react';
import Modal from '../components/ui/Modal'; 
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import Badge from './ui/Badge'
import { XMarkIcon } from '@heroicons/react/24/outline';
import Editor from '@monaco-editor/react';
import { useDocuments } from '../hooks/useDocuments';

// Editable file types with Monaco Editor support
const EDITABLE_FILE_TYPES = {
  'text/plain': 'plaintext',
  'text/markdown': 'markdown',
  'application/json': 'json',
  'text/javascript': 'javascript',
  'application/javascript': 'javascript',
  'text/html': 'html',
  'text/css': 'css',
  'text/xml': 'xml',
  'application/xml': 'xml',
  'text/yaml': 'yaml',
  'application/x-yaml': 'yaml',
  'text/x-python': 'python',
  'application/x-python': 'python',
  'text/x-java': 'java',
  'text/x-c': 'c',
  'text/x-cpp': 'cpp',
  'text/x-csharp': 'csharp',
  'text/x-php': 'php',
  'text/x-ruby': 'ruby',
  'text/x-go': 'go',
  'text/x-rust': 'rust',
  'text/x-sql': 'sql',
  'text/x-shell': 'shell',
  'application/x-sh': 'shell',
  'text/csv': 'plaintext'
};

const getMonacoLanguage = (mimeType, filename) => {
  // First check MIME type
  if (EDITABLE_FILE_TYPES[mimeType]) {
    return EDITABLE_FILE_TYPES[mimeType];
  }
  
  // Fallback: check file extension
  if (filename) {
    const ext = filename.split('.').pop().toLowerCase();
    const extMap = {
      'txt': 'plaintext',
      'md': 'markdown',
      'json': 'json',
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'html': 'html',
      'htm': 'html',
      'css': 'css',
      'scss': 'scss',
      'less': 'less',
      'xml': 'xml',
      'yaml': 'yaml',
      'yml': 'yaml',
      'py': 'python',
      'java': 'java',
      'c': 'c',
      'cpp': 'cpp',
      'h': 'c',
      'hpp': 'cpp',
      'cs': 'csharp',
      'php': 'php',
      'rb': 'ruby',
      'go': 'go',
      'rs': 'rust',
      'sql': 'sql',
      'sh': 'shell',
      'bash': 'shell',
      'csv': 'plaintext'
    };
    return extMap[ext] || null;
  }
  
  return null;
};

const isEditableFile = (mimeType, filename) => {
  const language = getMonacoLanguage(mimeType, filename);
  return language !== null;
};

const EditDocumentModal = ({ isOpen, onClose, document, workspaceId, onSuccess }) => {
  const { updateDocument } = useDocuments(workspaceId);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    tags: []
  });
  const [fileContent, setFileContent] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingContent, setIsFetchingContent] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('metadata');
  
  const editorRef = useRef(null);
  
  // Determine if file is editable
  const canEditContent = document ? isEditableFile(document.type, document.originalName || document.name) : false;
  const monacoLanguage = document ? getMonacoLanguage(document.type, document.originalName || document.name) : 'plaintext';

  // Fetch document content for editable files
  useEffect(() => {
    if (document && canEditContent && activeTab === 'content') {
      fetchDocumentContent();
    }
  }, [document, canEditContent, activeTab]);

  // Initialize form data when document changes
  useEffect(() => {
    if (document) {
      setFormData({
        name: document.name || document.originalName || '',
        description: document.description || '',
        tags: document.tags || []
      });
      setError(null);
    }
  }, [document]);

  const fetchDocumentContent = async () => {
    if (!document) return;
    
    setIsFetchingContent(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/documents/${document._id}/preview`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch document content');
      }
      
      const text = await response.text();
      setFileContent(text);
    } catch (err) {
      console.error('Error fetching document content:', err);
      setError('Failed to load document content');
    } finally {
      setIsFetchingContent(false);
    }
  };

  const handleEditorMount = (editor) => {
    editorRef.current = editor;
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const updates = {
        name: formData.name,
        description: formData.description,
        tags: formData.tags
      };

      // If content was edited, include it
      if (canEditContent && activeTab === 'content' && fileContent !== null) {
        updates.content = fileContent;
        updates.updateContent = true;
      }

      const success = await updateDocument(document._id, updates, workspaceId);
      
      if (success) {
        onSuccess?.();
      } else {
        setError('Failed to update document');
      }
    } catch (err) {
      console.error('Error updating document:', err);
      setError(err.message || 'Failed to update document');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !document) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Document"
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            <button
              type="button"
              onClick={() => setActiveTab('metadata')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'metadata'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              Metadata
            </button>
            {canEditContent && (
              <button
                type="button"
                onClick={() => setActiveTab('content')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'content'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                }`}
              >
                Content
              </button>
            )}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'metadata' && (
          <div className="space-y-4">
            {/* Filename */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Filename
              </label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter filename"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
             <textarea
  value={fileContent}
  onChange={(e) => setFileContent(e.target.value)}
  className="w-full h-96 p-4 font-mono text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
/>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tags
              </label>
              <div className="flex gap-2 mb-2">
                <Input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  placeholder="Add tag"
                />
                <Button type="button" onClick={handleAddTag} variant="outline">
                  Add
                </Button>
              </div>
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 hover:text-red-600"
                      >
                        <XMarkIcon className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* File Type Info */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <strong>File Type:</strong> {document.type || 'Unknown'}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                <strong>Original Name:</strong> {document.originalName || document.name}
              </p>
              {!canEditContent && (
                <p className="text-sm text-amber-600 dark:text-amber-400 mt-2">
                  Content editing is not supported for this file type.
                </p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'content' && (
          <div className="space-y-4">
            {isFetchingContent ? (
              <div className="flex items-center justify-center h-96 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600 dark:text-gray-400">Loading content...</p>
                </div>
              </div>
            ) : canEditContent ? (
              <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                <Editor
                  height="500px"
                  language={monacoLanguage}
                  value={fileContent}
                  onChange={(value) => setFileContent(value || '')}
                  onMount={handleEditorMount}
                  theme="vs-dark"
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    lineNumbers: 'on',
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    wordWrap: 'on'
                  }}
                />
              </div>
            ) : (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-6 text-center">
                <p className="text-amber-800 dark:text-amber-200">
                  This file type cannot be edited inline. You can only update metadata.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default EditDocumentModal;