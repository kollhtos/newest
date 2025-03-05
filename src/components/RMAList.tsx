import React, { useState, useEffect } from 'react';
import { Navigation } from './Navigation';
import { Link } from 'react-router-dom';
import { PlusCircle, Search, Clock, AlertTriangle, CheckCircle, Download, Edit, Filter } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import type { RMA } from '../types';

type FilterStatus = 'all' | 'in-progress' | 'completed';

export function RMAList() {
  const [rmas, setRmas] = useState<RMA[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null); // Track deleting state

  useEffect(() => {
    loadRMAs();
  }, []);

  const loadRMAs = async () => {
    try {
      const { data, error } = await supabase
        .from('rmas')
        .select('*')
        .order('date_created', { ascending: false });

      if (error) throw error;
      setRmas(data || []);
      console.log('RMAs loaded:', data); // Log loaded data
    } catch (error) {
      console.error('Error loading RMAs:', error);
      toast.error('Failed to load RMAs');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'in-progress':
        return <AlertTriangle className="w-5 h-5 text-blue-500" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      default:
        return <Clock className="w-5 h-5 text-orange-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-orange-100 text-orange-800';
    }
  };

  const handleMarkAsComplete = async (id: string) => {
    try {
      const rmaToUpdate = rmas.find((rma) => rma.id === id);
      if (!rmaToUpdate) {
        toast.error('RMA not found');
        return;
      }
  
      const newStatus = rmaToUpdate.status === 'completed' ? 'in-progress' : 'completed';
  
      const { error } = await supabase
        .from('rmas')
        .update({ status: newStatus })
        .eq('id', id);
  
      if (error) throw error;
  
      setRmas((prevRmas) =>
        prevRmas.map((rma) =>
          rma.id === id ? { ...rma, status: newStatus } : rma
        )
      );
  
      toast.success(`RMA status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating RMA:', error);
      toast.error('Failed to update RMA status');
    }
  };

  const filteredRMAs = rmas.filter((rma) => {
    const matchesSearch =
      rma.erp_code.toLowerCase().includes(searchTerm.toLowerCase()) || // ERP Code
      rma.product_name.toLowerCase().includes(searchTerm.toLowerCase()) || // Product Name
      rma.issue_description.toLowerCase().includes(searchTerm.toLowerCase()) || // Issue Description
      rma.serial_number.toLowerCase().includes(searchTerm.toLowerCase()); // Serial Number
  
    const matchesFilter = filterStatus === 'all' || rma.status === filterStatus;
  
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: rmas.length,
    inProgress: rmas.filter((rma) => rma.status === 'in-progress').length,
    completed: rmas.filter((rma) => rma.status === 'completed').length,
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navigation />

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">RMA List</h1>
            <Link
              to="/rmas/new"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              New RMA
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total RMAs</p>
                  <p className="text-2xl font-semibold">{stats.total}</p>
                </div>
                <Clock className="w-8 h-8 text-gray-400" />
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">In Progress</p>
                  <p className="text-2xl font-semibold">{stats.inProgress}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="text-2xl font-semibold">{stats.completed}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="flex space-x-4 mb-6">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Search RMAs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="relative">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
                className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="all">All Status</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <Filter className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>

          {/* RMA List */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            {loading ? (
              <div className="p-4">
                <div className="animate-pulse space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-20 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {filteredRMAs.map((rma) => (
                  <li key={rma.id} className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center min-w-0">
                        {getStatusIcon(rma.status)}
                        <div className="ml-4">
                        <Link
  to={`/rmas/${rma.id}/edit`}
  className="text-lg font-medium text-gray-900 hover:text-blue-600"
>
  {`ERP: ${rma.erp_code} Pr.Desc: ${rma.product_name}`}
</Link>


  <p className="text-sm text-gray-500">
    A/A: {rma.rma_number} {/* Εμφάνιση του aukson rma αριθμου */}
  </p>
  
  <p className="text-sm text-gray-500">
    Serial Number: {rma.serial_number} {/* Εμφάνιση του Serial Number */}
  </p>
  <p className="text-sm text-gray-500">
    Issue Description: {rma.issue_description} {/* Εμφάνιση του Issue Description */}
  </p>
  <div className="flex items-center mt-1">
    <Clock className="w-4 h-4 text-gray-400 mr-1" />
    <span className="text-xs text-gray-500">
      {format(new Date(rma.date_created), 'MMM d, yyyy')} {/* Εμφάνιση της ημερομηνίας */}
    </span>
  </div>
</div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(rma.status)}`}
                        >
                          {rma.status.charAt(0).toUpperCase() + rma.status.slice(1)}
                        </span>
                        <div className="flex space-x-2">
  <button
    onClick={() => handleMarkAsComplete(rma.id)}
    className={`${
      rma.status === 'completed' ? 'text-blue-600 hover:text-blue-800' : 'text-green-600 hover:text-green-800'
    }`}
  >
    {rma.status === 'completed' ? (
      <AlertTriangle className="w-5 h-5" /> // Icon for "in-progress"
    ) : (
      <CheckCircle className="w-5 h-5" /> // Icon for "completed"
    )}
  </button>
  <Link
    to={`/rmas/${rma.id}/edit`}
    className="text-gray-400 hover:text-gray-500"
  >
    <Edit className="w-5 h-5" />
  </Link>
  <span
    onClick={async () => await deleteRMA(rma.id)}
    className={`text-red-600 hover:text-red-800 cursor-pointer ${
      deletingId === rma.id ? 'opacity-50 cursor-not-allowed' : ''
    }`}
  >
    {deletingId === rma.id ? 'Deleting...' : 'Delete'}
  </span>
</div>
                      </div>
                    </div>
                  </li>
                ))}
                {filteredRMAs.length === 0 && (
                  <li className="px-6 py-4 text-center text-gray-500">
                    No RMAs found
                  </li>
                )}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}