import { TransactionForm } from '@/components/TransactionForm';
import { TransactionList } from '@/components/TransactionList';
import { SettingsMenu } from '@/components/SettingsMenu';
import { Send } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-md mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <Send className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-800">RemitTracker</h1>
          </div>
          <SettingsMenu />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 py-6">
        <TransactionForm />
        <TransactionList />
      </main>

      <footer className="text-center text-gray-400 text-xs py-8">
        &copy; {new Date().getFullYear()} RemitTracker
      </footer>
    </div>
  );
}
