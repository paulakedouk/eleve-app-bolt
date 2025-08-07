import ProtectedRoute from '@web/components/ProtectedRoute';
import { signOut } from '@web/lib/auth';
import Image from 'next/image';

export default function AdminDashboard() {
  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <ProtectedRoute requiredRole={['admin', 'business']}>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b-2 border-black">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-4">
                <Image 
                  src="/eleve-logo.svg" 
                  alt="Eleve" 
                  width={40} 
                  height={40}
                  className="h-10 w-auto"
                />
                <h1 className="text-xl font-black text-gray-900">Admin Dashboard</h1>
              </div>
              <button
                onClick={handleSignOut}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
              >
                Sign Out
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-2xl p-8 border-4 border-purple-600 shadow-[8px_8px_0px_0px_rgba(147,51,234,0.3)] text-center">
            <h2 className="text-3xl font-black text-gray-900 mb-4">Welcome Admin! 🏢</h2>
            <p className="text-lg text-gray-600 mb-6">
              Your admin dashboard is coming soon. You'll be able to manage your skate school, 
              coaches, students, and analytics here.
            </p>
            <div className="text-6xl mb-4">⚙️</div>
            <p className="text-sm text-gray-500">
              This dashboard will include school management, user administration, analytics, and more!
            </p>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
} 