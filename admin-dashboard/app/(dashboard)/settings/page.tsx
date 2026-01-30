'use client'

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
          Settings
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">System configuration</p>
      </div>

      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-200/50 dark:border-gray-700/50">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">System Information</h2>
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Database</p>
            <p className="text-gray-900 dark:text-white">Supabase (Shared with main app)</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Authentication</p>
            <p className="text-gray-900 dark:text-white">JWT with httpOnly cookies</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Payment Gateway</p>
            <p className="text-gray-900 dark:text-white">Paystack (Live Mode)</p>
          </div>
        </div>
      </div>

      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-200/50 dark:border-gray-700/50">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Admin Access</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Only users with <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">role = 'admin'</code> or <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">role = 'super_admin'</code> can access this dashboard.
        </p>
      </div>
    </div>
  )
}
