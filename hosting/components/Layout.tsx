import React from 'react';
import { Link } from 'react-router-dom';
import { Menu, Bell, Settings, LogOut, User } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  userRole?: 'farmer' | 'lab' | 'manufacturer' | 'consumer';
  userName?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, userRole, userName }) => {
  const navigation = [
    { name: 'Dashboard', href: '/', icon: 'Home' },
    { name: 'Transactions', href: '/transactions', icon: 'FileText' },
    { name: 'Analytics', href: '/analytics', icon: 'BarChart3' },
    { name: 'Settings', href: '/settings', icon: 'Settings' },
  ];

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'farmer': return 'bg-green-100 text-green-800';
      case 'lab': return 'bg-blue-100 text-blue-800';
      case 'manufacturer': return 'bg-purple-100 text-purple-800';
      case 'consumer': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Brand */}
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-green-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">VC</span>
                </div>
              </div>
              <div className="ml-4">
                <h1 className="text-xl font-bold text-gray-900">VaidyaChain</h1>
                <p className="text-sm text-gray-500">Ayurvedic Supply Chain</p>
              </div>
            </div>

            {/* User Info */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">{userName}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(userRole || '')}`}>
                  {userRole?.toUpperCase()}
                </span>
              </div>
              
              <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                <Bell className="h-6 w-6" />
              </button>
              
              <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                <Settings className="h-6 w-6" />
              </button>
              
              <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                <LogOut className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-gray-50 border-r border-gray-200 min-h-screen">
          <nav className="mt-6">
            <div className="px-4 mb-4">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Navigation</h2>
            </div>
            <div className="space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <span className="mr-3 text-gray-400">
                    {/* Icon placeholder - would use actual icons */}
                  </span>
                  {item.name}
                </Link>
              ))}
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;

// Re-export Layout for use in other components
export { Layout };
