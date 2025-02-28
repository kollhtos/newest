import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Navigation } from './Navigation';
import { ArrowLeft, Settings, Clock, CheckCircle, AlertTriangle, Download, Edit } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import type { RMA } from '../types';

export function RMADetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [rma, setRma] = useState<RMA | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRMA();
  }, [id]);

  const loadRMA = async () => {
    try {
      const { data, error } = await supabase
        .from('rmas')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setRma(data);
    } catch (error) {
      console.error('Error loading RMA:', error);
      toast.error('Failed to load RMA details');
      navigate('/rmas');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-6 h-6 text-orange-500" />;
      case 'in-progress': return <AlertTriangle className="w-6 h-6 text-blue-500" />;
      case 'completed': return <CheckCircle className="w-6 h-6 text-green-500" />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-orange-100 text-orange-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navigation />
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!rma) return null;

  return (
    <div className="min-h-screen bg-gray-100">
      <Navigation />
      
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Link to="/rmas" className="mr-4">
                <ArrowLeft className="w-6 h-6 text-gray-500 hover:text-gray-700" />
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">RMA Details: {rma.rma_number}</h1>
            </div>
            <div className="flex space-x-4">
              <Link
                to={`/rmas/${id}/edit`}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit RMA
              </Link>
            </div>
          </div>

          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
              <div className="flex items-center">
                {getStatusIcon(rma.status)}
                <div className="ml-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    {rma.productName}
                  </h3>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">
                    Serial Number: {rma.serialNumber}
                  </p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(rma.status)}`}>
                {rma.status.charAt(0).toUpperCase() + rma.status.slice(1)}
              </span>
            </div>
            <div className="border-t border-gray-200">
              <dl>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Customer Name</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{rma.customerName}</dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Customer Email</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{rma.customerEmail}</dd>
                </div>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">ERP Code</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{rma.erpCode}</dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Issue Description</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{rma.issueDescription}</dd>
                </div>
                {rma.boundMachine && (
                  <>
                    <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">Bound Machine ERP</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{rma.boundMachineErp}</dd>
                    </div>
                    <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">Bound Machine Serial</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{rma.boundMachineSerial}</dd>
                    </div>
                  </>
                )}
                {rma.repairInfo && (
                  <>
                    <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">Technician</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{rma.repairInfo.technician}</dd>
                    </div>
                    <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">Estimated Cost</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        ${rma.repairInfo.estimatedCost.toFixed(2)}
                      </dd>
                    </div>
                    <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">External RMA Number</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{rma.repairInfo.externalRmaNumber}</dd>
                    </div>
                  </>
                )}
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Attachments</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    <ul className="border border-gray-200 rounded-md divide-y divide-gray-200">
                      {rma.attachments.map((attachment) => (
                        <li key={attachment.id} className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                          <div className="w-0 flex-1 flex items-center">
                            <span className="ml-2 flex-1 w-0 truncate">{attachment.name}</span>
                          </div>
                          <div className="ml-4 flex-shrink-0">
                            <button
                              onClick={() => {/* Handle download */}}
                              className="font-medium text-blue-600 hover:text-blue-500"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          </div>
                        </li>
                      ))}
                      {rma.attachments.length === 0 && (
                        <li className="pl-3 pr-4 py-3 text-sm text-gray-500">No attachments</li>
                      )}
                    </ul>
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}