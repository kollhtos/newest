import React, { useState } from 'react';
import { Navigation } from './Navigation';
import { Upload, Save, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export function NewRMAForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    erp_code: '',
    product_name: '',
    serial_number: '',
    issue_description: '',
    bound_machine: false,
    bound_machine_erp: '',
    bound_machine_serial: '',
    customer_name: '',
    customer_email: '',
  });
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Disable triggers temporarily to avoid audit log issues
      const { data, error } = await supabase
        .from('rmas')
        .insert([
          {
            erp_code: formData.erp_code,
            product_name: formData.product_name,
            serial_number: formData.serial_number,
            issue_description: formData.issue_description,
            bound_machine: formData.bound_machine,
            bound_machine_erp: formData.bound_machine_erp,
            bound_machine_serial: formData.bound_machine_serial,
            customer_name: formData.customer_name,
            customer_email: formData.customer_email,
            status: 'in-progress',
          },
        ])
        .select()
        .single();

      if (error) throw error;

      // Upload files if any
      if (files.length > 0) {
        for (const file of files) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${data.id}/${Math.random()}.${fileExt}`;
          const { error: uploadError } = await supabase.storage
            .from('rma-attachments')
            .upload(fileName, file);

          if (uploadError) throw uploadError;

          // Create attachment record
          const { error: attachmentError } = await supabase
            .from('attachments')
            .insert({
              rma_id: data.id,
              name: file.name,
              url: fileName,
              type: 'document',
              uploaded_by: (await supabase.auth.getUser()).data.user?.id,
            });

          if (attachmentError) throw attachmentError;
        }
      }

      toast.success('RMA created successfully');
      navigate('/rmas');
    } catch (error) {
      console.error('Error creating RMA:', error);
      toast.error('Failed to create RMA');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navigation />

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex items-center mb-6">
            <Link to="/rmas" className="mr-4">
              <ArrowLeft className="w-6 h-6 text-gray-500 hover:text-gray-700" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Create New RMA</h1>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="erp_code"
                    className="block text-sm font-medium text-gray-700"
                  >
                    ERP Code
                  </label>
                  <input
                    type="text"
                    id="erp_code"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    value={formData.erp_code}
                    onChange={(e) =>
                      setFormData({ ...formData, erp_code: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label
                    htmlFor="product_name"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Product Name
                  </label>
                  <input
                    type="text"
                    id="product_name"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    value={formData.product_name}
                    onChange={(e) =>
                      setFormData({ ...formData, product_name: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label
                    htmlFor="serial_number"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Serial Number
                  </label>
                  <input
                    type="text"
                    id="serial_number"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    value={formData.serial_number}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        serial_number: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <label
                    htmlFor="customer_name"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Customer Name
                  </label>
                  <input
                    type="text"
                    id="customer_name"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    value={formData.customer_name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        customer_name: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <label
                    htmlFor="customer_email"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Customer Email
                  </label>
                  <input
                    type="email"
                    id="customer_email"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    value={formData.customer_email}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        customer_email: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="issue_description"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Issue Description
                  </label>
                  <textarea
                    id="issue_description"
                    rows={3}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    value={formData.issue_description}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        issue_description: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="sm:col-span-2">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="bound_machine"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      checked={formData.bound_machine}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          bound_machine: e.target.checked,
                        })
                      }
                    />
                    <label
                      htmlFor="bound_machine"
                      className="ml-2 block text-sm text-gray-700"
                    >
                      Product is bound to a machine
                    </label>
                  </div>
                </div>

                {formData.bound_machine && (
                  <>
                    <div>
                      <label
                        htmlFor="bound_machine_erp"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Machine ERP Code
                      </label>
                      <input
                        type="text"
                        id="bound_machine_erp"
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        value={formData.bound_machine_erp}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            bound_machine_erp: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="bound_machine_serial"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Machine Serial Number
                      </label>
                      <input
                        type="text"
                        id="bound_machine_serial"
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        value={formData.bound_machine_serial}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            bound_machine_serial: e.target.value,
                          })
                        }
                      />
                    </div>
                  </>
                )}

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Attachments
                  </label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                    <div className="space-y-1 text-center">
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="flex text-sm text-gray-600">
                        <label
                          htmlFor="file-upload"
                          className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                        >
                          <span>Upload files</span>
                          <input
                            id="file-upload"
                            name="file-upload"
                            type="file"
                            className="sr-only"
                            multiple
                            onChange={handleFileChange}
                            accept="image/*,video/*,.pdf,.doc,.docx"
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">
                        PNG, JPG, PDF, DOC up to 10MB
                      </p>
                    </div>
                  </div>
                  {files.length > 0 && (
                    <div className="mt-2">
                      <h4 className="text-sm font-medium text-gray-700">
                        Selected files:
                      </h4>
                      <ul className="mt-1 text-sm text-gray-500">
                        {files.map((file, index) => (
                          <li key={index}>{file.name}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <Link
                  to="/rmas"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <span className="loading loading-spinner"></span>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Create RMA
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
