import React, { useState, useEffect } from 'react';
import { Navigation } from './Navigation';
import { supabase } from '../lib/supabase';
import { User, UserProfile } from '../types';
import { Loader, UserPlus, Save, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface UserWithProfile extends User {
  profile?: UserProfile;
}

export function Settings() {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<UserWithProfile[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserFullName, setNewUserFullName] = useState('');
  const [newUserRole, setNewUserRole] = useState('user');

  useEffect(() => {
    loadUsers();
    getCurrentUser();
  }, []);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
  };

  const loadUsers = async () => {
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('*');

      if (profilesError) throw profilesError;

      const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
      
      if (usersError) throw usersError;

      const usersWithProfiles = users.map(user => ({
        ...user,
        profile: profiles?.find(profile => profile.id === user.id)
      }));

      setUsers(usersWithProfiles);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error: signUpError } = await supabase.auth.admin.createUser({
        email: newUserEmail,
        password: newUserPassword,
        email_confirm: true
      });

      if (signUpError) throw signUpError;

      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({
          full_name: newUserFullName,
          role: newUserRole
        })
        .eq('id', data.user.id);

      if (profileError) throw profileError;

      toast.success('User created successfully');
      loadUsers();
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserFullName('');
      setNewUserRole('user');
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error('Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async (userId: string, updates: Partial<UserProfile>) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', userId);

      if (error) throw error;

      toast.success('User updated successfully');
      loadUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      const { error } = await supabase.auth.admin.deleteUser(userId);

      if (error) throw error;

      toast.success('User deleted successfully');
      loadUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <Navigation />
      
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-gray-800 shadow rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-6">User Management</h2>
            
            {/* Create New User Form */}
            <div className="mb-8 border-b border-gray-700 pb-6">
              <h3 className="text-lg font-medium text-white mb-4">Create New User</h3>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="newUserEmail" className="block text-sm font-medium text-gray-300">
                      Email
                    </label>
                    <input
                      type="email"
                      id="newUserEmail"
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-700 text-white"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="newUserPassword" className="block text-sm font-medium text-gray-300">
                      Password
                    </label>
                    <input
                      type="password"
                      id="newUserPassword"
                      value={newUserPassword}
                      onChange={(e) => setNewUserPassword(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-700 text-white"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="newUserFullName" className="block text-sm font-medium text-gray-300">
                      Full Name
                    </label>
                    <input
                      type="text"
                      id="newUserFullName"
                      value={newUserFullName}
                      onChange={(e) => setNewUserFullName(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-700 text-white"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="newUserRole" className="block text-sm font-medium text-gray-300">
                      Role
                    </label>
                    <select
                      id="newUserRole"
                      value={newUserRole}
                      onChange={(e) => setNewUserRole(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-700 text-white"
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader className="w-5 h-5 animate-spin mr-2" />
                    ) : (
                      <UserPlus className="w-5 h-5 mr-2" />
                    )}
                    Create User
                  </button>
                </div>
              </form>
            </div>

            {/* User List */}
            <div>
              <h3 className="text-lg font-medium text-white mb-4">Manage Users</h3>
              <div className="space-y-4">
                {users.map(user => (
                  <div
                    key={user.id}
                    className="bg-gray-700 rounded-lg p-4 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-white font-medium">{user.profile?.full_name || user.email}</p>
                      <p className="text-gray-400 text-sm">{user.email}</p>
                      <p className="text-gray-400 text-sm">Role: {user.profile?.role || 'user'}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleUpdateUser(user.id, {
                          role: user.profile?.role === 'admin' ? 'user' : 'admin'
                        })}
                        className="inline-flex items-center px-3 py-1 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                      >
                        <Save className="w-4 h-4 mr-1" />
                        Toggle Role
                      </button>
                      {user.id !== currentUser?.id && (
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="inline-flex items-center px-3 py-1 border border-transparent rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}