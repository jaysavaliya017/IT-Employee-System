import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';
import { Settings as SettingsIcon, Bell, Shield } from 'lucide-react';

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('general');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-64 space-y-1">
              <button onClick={() => setActiveTab('general')} className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${activeTab === 'general' ? 'bg-primary-50 text-primary-600' : 'hover:bg-gray-50'}`}>
                <div className="flex items-center gap-3">
                  <SettingsIcon className="w-5 h-5" />
                  General
                </div>
              </button>
              <button onClick={() => setActiveTab('notifications')} className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${activeTab === 'notifications' ? 'bg-primary-50 text-primary-600' : 'hover:bg-gray-50'}`}>
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5" />
                  Notifications
                </div>
              </button>
              <button onClick={() => setActiveTab('security')} className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${activeTab === 'security' ? 'bg-primary-50 text-primary-600' : 'hover:bg-gray-50'}`}>
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5" />
                  Security
                </div>
              </button>
            </div>
            <div className="flex-1 bg-gray-50 rounded-lg p-6">
              {activeTab === 'general' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold">General Settings</h3>
                  <p className="text-gray-500">Configure general system settings here.</p>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-white rounded-lg">
                      <div>
                        <p className="font-medium">Company Name</p>
                        <p className="text-sm text-gray-500">ProAttend IT Solutions</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-white rounded-lg">
                      <div>
                        <p className="font-medium">Time Zone</p>
                        <p className="text-sm text-gray-500">UTC +05:30 (IST)</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold">Notification Settings</h3>
                  <p className="text-gray-500">Manage how you receive notifications.</p>
                </div>
              )}
              {activeTab === 'security' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold">Security Settings</h3>
                  <p className="text-gray-500">Manage your account security.</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
