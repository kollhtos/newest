import React, { useState, useEffect } from 'react';
import { Navigation } from './Navigation';
import { ClipboardList, FileText, PlusCircle, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom'; // Προσθήκη useNavigate
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface RMAStats {
  total: number;
  active: number;
  completed: number;
  inProgress: number;
  manuals: number;
}

export function Dashboard() {
  const [stats, setStats] = useState<RMAStats>({
    total: 0,
    active: 0,
    completed: 0,
    inProgress: 0,
    manuals: 0,
  });

  const navigate = useNavigate(); // Χρήση του useNavigate

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const { data: rmas, error: rmaError } = await supabase
        .from('rmas')
        .select('status');

      const { data: manuals, error: manualError } = await supabase
        .from('manuals')
        .select('*');

      if (rmaError || manualError) throw rmaError || manualError;

      const stats = rmas.reduce(
        (acc, rma) => ({
          total: acc.total + 1,
          active: acc.active + (rma.status === 'pending' ? 1 : 0),
          completed: acc.completed + (rma.status === 'completed' ? 1 : 0),
          inProgress: acc.inProgress + (rma.status === 'in-progress' ? 1 : 0),
          manuals: manuals.length,
        }),
        { total: 0, active: 0, completed: 0, inProgress: 0, manuals: 0 }
      );

      setStats(stats);
      console.log('Stats loaded:', stats);
    } catch (error) {
      console.error('Error loading stats:', error);
      toast.error('Failed to load RMA statistics');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navigation />

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Overview</h1>
            <Link
              to="/rmas/new"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              New RMA
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {/* Total RMAs */}
            <div
              className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:bg-gray-50"
              onClick={() => navigate('/rmas')} // Μετάβαση στη σελίδα RMAs
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total RMAs</p>
                  <p className="text-2xl font-semibold mt-1">{stats.total}</p>
                </div>
                <ClipboardList className="w-8 h-8 text-gray-400" />
              </div>
            </div>

            {/* In Progress */}
            <div
              className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:bg-gray-50"
              onClick={() => navigate('/rmas?status=in-progress')} // Μετάβαση στη σελίδα RMAs με φίλτρο In Progress
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">In Progress</p>
                  <p className="text-2xl font-semibold mt-1">{stats.inProgress}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-blue-500" />
              </div>
            </div>

            {/* Completed */}
            <div
              className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:bg-gray-50"
              onClick={() => navigate('/rmas?status=completed')} // Μετάβαση στη σελίδα RMAs με φίλτρο Completed
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="text-2xl font-semibold mt-1">{stats.completed}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </div>

            {/* Total Manuals */}
            <div
              className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:bg-gray-50"
              onClick={() => navigate('/manuals')} // Μετάβαση στη σελίδα manuals
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Manuals</p>
                  <p className="text-2xl font-semibold mt-1">{stats.manuals}</p>
                </div>
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}