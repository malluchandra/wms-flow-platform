import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'WMS Flow Builder',
  description: 'Build and manage warehouse workflow definitions',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900">
        <div className="flex h-screen">
          <nav className="w-56 bg-gray-900 text-gray-100 flex flex-col p-4">
            <h1 className="text-lg font-bold mb-6">WMS Builder</h1>
            <a href="/" className="py-2 px-3 rounded hover:bg-gray-800 mb-1">Flows</a>
            <a href="/flows/new" className="py-2 px-3 rounded hover:bg-gray-800 mb-1">+ New Flow</a>
          </nav>
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
