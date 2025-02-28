import React, { useState, useEffect } from 'react';
import { Navigation } from './Navigation';
import { ClipboardList, FileText, PlusCircle, Clock, CheckCircle, AlertTriangle, PenTool as Tool } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface RMAStats {
  total: number;
  active: number;
  completed: number;
  inProgress: number;
}

interface RecentActivity {
  id: string;
  rma_number: string;
  description: string;
  timestamp: string;
  type: 'rma' | 'manual';
  status?: string;
}

export function Dashboard() {
  const [stats, setStats] = useState<RMAStats>({
    total: 0,
    active: 0,
    completed: 0,
    inProgress: 0
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);

  useEffect(() => {
    loadStats();
    loadRecentActivity();
  }, []);

  const loadStats = async () => {
    try {
      const { data: rmas, error } = await supabase
        .from('rmas')
        .select('status');

      if (error) throw error;

      const stats = rmas.reduce((acc, rma) => ({
        total: acc.total + 1,
        active: acc.active + (rma.status === 'pending' ? 1 : 0),
        completed: acc.completed + (rma.status === 'completed' ? 1 : 0),
        inProgress: acc.inProgress + (rma.status === 'in-progress' ? 1 : 0)
      }), { total: 0, active: 0, completed: 0, inProgress: 0 });

      setStats(stats);
    } catch (error) {
      console.error('Error loading stats:', error);
      toast.error('Failed to load RMA statistics');
    }
  };

  const loadRecentActivity = async () => {
    try {
      const { data: rmas, error: rmaError } = await supabase
        .from('rmas')
        .select('*')
        .order('date_created', { ascending: false })
        .limit(5);

      if (rmaError) throw rmaError;

      const activity = (rmas || []).map(rma => ({
        id: rma.id,
        rma_number: rma.rma_number,
        description: `${rma.product_name} - ${rma.issue_description}`,
        timestamp: rma.date_created,
        type: 'rma' as const,
        status: rma.status
      }));

      setRecentActivity(activity);
    } catch (error) {
      console.error('Error loading recent activity:', error);
      toast.error('Failed to load recent activity');
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'pending': return 'border-orange-500';
      case 'in-progress': return 'border-blue-500';
      case 'completed': return 'border-green-500';
      default: return 'border-gray-500';
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-5 h-5 text-orange-500" />;
      case 'in-progress': return <AlertTriangle className="w-5 h-5 text-blue-500" />;
      case 'completed': return <CheckCircle className="w-5 h-5 text-green-500" />;
      default: return null;
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
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total RMAs</p>
                  <p className="text-2xl font-semibold mt-1">{stats.total}</p>
                </div>
                <ClipboardList className="w-8 h-8 text-gray-400" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active RMAs</p>
                  <p className="text-2xl font-semibold mt-1">{stats.active}</p>
                </div>
                <Clock className="w-8 h-8 text-orange-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">In Progress</p>
                  <p className="text-2xl font-semibold mt-1">{stats.inProgress}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-blue-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="text-2xl font-semibold mt-1">{stats.completed}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h2>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className={`border-l-4 pl-4 ${getStatusColor(activity.status)}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {getStatusIcon(activity.status)}
                      <div className="ml-2">
                        {activity.type === 'rma' ? (
                          <Link
                            to={`/rmas/${activity.id}`}
                            className="text-sm font-medium text-gray-900 hover:text-blue-600 flex items-center"
                          >
                            {activity.rma_number}
                            <Tool className="w-4 h-4 ml-2 text-gray-400" />
                          </Link>
                        ) : (
                          <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                        )}
                        <p className="text-sm text-gray-600">{activity.description}</p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(activity.timestamp), 'MMM d, yyyy h:mm a')}
                        </p>
                      </div>
                    </div>
                    {activity.type === 'rma' && (
                      <div className="flex space-x-2">
                        <Link
                          to={`/rmas/${activity.id}`}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          View Details
                        </Link>
                        <Link
                          to={`/rmas/${activity.id}/edit`}
                          className="text-sm text-gray-600 hover:text-gray-800"
                        >
                          Edit
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}