import React, { useState, useEffect } from 'react';
import { Navigation } from './Navigation';
import { FileText, Upload, Download, Search, Clock, FolderPlus, Folder, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import type { Manual } from '../types';

export function ManualsList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [uploading, setUploading] = useState(false);
  const [manuals, setManuals] = useState<Manual[]>([]);
  const [currentFolder, setCurrentFolder] = useState('');
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [title, setTitle] = useState('');

  useEffect(() => {
    loadManuals();
  }, [currentFolder]);

  const loadManuals = async () => {
    try {
      const { data, error } = await supabase
        .from('manuals')
        .select('*')
        .eq('folder_path', currentFolder)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      setManuals(data || []);
    } catch (error) {
      console.error('Error loading manuals:', error);
      toast.error('Failed to load manuals');
    }
  };

  const deleteManual = async (manual) => {
    try {
      console.log('Attempting to delete manual:', manual.id);
      console.log('File path:', manual.file_path);
  
      // Διαγραφή από το storage
      const { error: storageError } = await supabase.storage
        .from('service-manuals')
        .remove([manual.file_path]);
  
      if (storageError) {
        console.error('Error deleting from storage:', storageError);
        throw storageError;
      }
  
      // Διαγραφή από τη βάση δεδομένων
      const { error: dbError } = await supabase
        .from('manuals')
        .delete()
        .eq('id', manual.id);
  
      if (dbError) {
        console.error('Error deleting from database:', dbError);
        throw dbError;
      }
  
      toast.success('Manual deleted successfully');
      console.log('Manual deleted:', manual.id);
      loadManuals(); // Ανανέωση της λίστας
    } catch (error) {
      console.error('Error deleting manual:', error);
      toast.error('Failed to delete manual');
    }
  };
  
  
  
  
  
  
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !title) {
      toast.error('Please provide both a file and a title');
      return;
    }

    setUploading(true);
    const file = e.target.files[0];

    try {
      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${currentFolder}/${Date.now()}-${file.name}`;
      const { error: uploadError, data } = await supabase.storage
        .from('service-manuals')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Create database record
      const { error: dbError } = await supabase
        .from('manuals')
        .insert({
          name: file.name,
          title: title,
          file_path: fileName,
          folder_path: currentFolder,
          file_type: fileExt || 'unknown',
          size: file.size,
          description: '',
          uploaded_by: (await supabase.auth.getUser()).data.user?.id
        });

      if (dbError) throw dbError;

      toast.success('Manual uploaded successfully');
      setTitle('');
      loadManuals();
    } catch (error) {
      console.error('Error uploading manual:', error);
      toast.error('Failed to upload manual');
    } finally {
      setUploading(false);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName) {
      toast.error('Please provide a folder name');
      return;
    }

    try {
      const newFolderPath = currentFolder 
        ? `${currentFolder}/${newFolderName}` 
        : newFolderName;

      // Create an empty file to represent the folder
      const { error } = await supabase.storage
        .from('service-manuals')
        .upload(`${newFolderPath}/.folder`, new Blob([]));

      if (error) throw error;

      toast.success('Folder created successfully');
      setShowNewFolderDialog(false);
      setNewFolderName('');
      loadManuals();
    } catch (error) {
      console.error('Error creating folder:', error);
      toast.error('Failed to create folder');
    }
  };

  const handleDownload = async (manual: Manual) => {
    try {
      const { data, error } = await supabase.storage
        .from('service-manuals')
        .download(manual.file_path);

      if (error) throw error;

      const url = window.URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = manual.name;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      link.remove();
    } catch (error) {
      console.error('Error downloading manual:', error);
      toast.error('Failed to download manual');
    }
  };

  const navigateToFolder = (folder: string) => {
    setCurrentFolder(folder);
  };

  const navigateUp = () => {
    const parts = currentFolder.split('/');
    parts.pop();
    setCurrentFolder(parts.join('/'));
  };

  const filteredManuals = manuals.filter(manual =>
    manual.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    manual.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    manual.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-100">
      <Navigation />
      
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">Manuals & Guides</h1>
              {currentFolder && (
                <button
                  onClick={navigateUp}
                  className="text-blue-600 hover:text-blue-800"
                >
                  ← Back
                </button>
              )}
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => setShowNewFolderDialog(true)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <FolderPlus className="w-4 h-4 mr-2" />
                New Folder
              </button>
              <label className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 cursor-pointer">
                <Upload className="w-4 h-4 mr-2" />
                Upload Manual
                <input
                  type="file"
                  className="hidden"
                  onChange={handleFileUpload}
                  accept=".pdf,.doc,.docx,.txt,.xlsx,.xls"
                  disabled={uploading || !title}
                />
              </label>
            </div>
          </div>

          {/* Title input for new uploads */}
          <div className="mb-6">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Title for new upload
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Enter title for the manual"
            />
          </div>

          <div className="mb-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Search manuals..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* New Folder Dialog */}
          {showNewFolderDialog && (
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
              <div className="bg-white rounded-lg p-6 max-w-sm w-full">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Folder</h3>
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Folder name"
                />
                <div className="mt-4 flex justify-end space-x-3">
                  <button
                    onClick={() => setShowNewFolderDialog(false)}
                    className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateFolder}
                    className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                  >
                    Create
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <ul className="divide-y divide-gray-200">
              
            {filteredManuals.map((manual) => (
  <li key={manual.id} className="px-6 py-4 hover:bg-gray-50">
    <div className="flex items-center justify-between">
      <div className="flex items-center">
        {manual.folder_path ? (
          <Folder className="w-6 h-6 text-gray-400" />
        ) : (
          <FileText className="w-6 h-6 text-gray-400" />
        )}
        <div className="ml-4">
          <h3 className="text-lg font-medium text-gray-900">{manual.title}</h3>
          <div className="flex items-center text-sm text-gray-500">
            <Clock className="w-4 h-4 mr-1" />
            <span>
              Uploaded {format(new Date(manual.uploaded_at), 'MMM d, yyyy')}
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-4">
        {!manual.folder_path && (
          <>
            <span className="text-sm text-gray-500">
              {(manual.size / 1024 / 1024).toFixed(1)} MB
            </span>
            <button
              onClick={() => handleDownload(manual)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </button>
          </>
        )}
        <button
          onClick={() => deleteManual(manual)}
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Delete
        </button>
      </div>
    </div>
  </li>
))}
              {filteredManuals.length === 0 && (
                <li className="px-6 py-4 text-center text-gray-500">
                  No manuals found
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}