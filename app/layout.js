import './globals.css';
import AppLayout from '@/components/AppLayout';
import { Toaster } from 'react-hot-toast';

export const metadata = {
  title: 'Epic Agency | Ads Management System',
  description: 'Manage your digital marketing agency campaigns and clients.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900">
        <AppLayout>{children}</AppLayout>
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
