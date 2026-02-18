import { TransactionForm } from '@/components/TransactionForm';
import { TransactionList } from '@/components/TransactionList';
import { SettingsMenu } from '@/components/SettingsMenu';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Send } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col transition-colors duration-300">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-md sticky top-0 z-10 border-b border-border shadow-sm">
        <div className="max-w-xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-xl ring-1 ring-primary/20">
              <Send className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">RemitTracker</h1>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <SettingsMenu />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-xl mx-auto px-4 py-8 space-y-8">
        <section>
          <TransactionForm />
        </section>

        <section>
          <TransactionList />
        </section>
      </main>

      <footer className="text-center text-muted-foreground text-[10px] py-4 border-t border-border mt-auto">
        <p>Made with &lt;3 by Mumukshu D.C</p>
      </footer>
    </div>
  );
}
