import { useQuery } from '@tanstack/react-query';
import { Camera, Plug, ListTodo, ShoppingCart, AlertCircle, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import { statsApi } from '../services/api';

interface StatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
  link: string;
}

function StatCard({ title, value, subtitle, icon, color, link }: StatCardProps) {
  return (
    <Link
      to={link}
      className="bg-slate-800 rounded-xl p-6 hover:bg-slate-700 transition-colors"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-400 text-sm">{title}</p>
          <p className="text-3xl font-bold text-white mt-1">{value}</p>
          {subtitle && <p className="text-slate-500 text-sm mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>{icon}</div>
      </div>
    </Link>
  );
}

export default function Dashboard() {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['stats'],
    queryFn: statsApi.get,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  return (
    <div className="p-6">
      <PageHeader
        title="Dashboard"
        subtitle="Welcome to your Jarvis home automation system"
      />

      {isLoading && (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      )}

      {error && (
        <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <span className="text-red-200">
            Failed to load stats. Is the backend running?
          </span>
        </div>
      )}

      {stats && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              title="Cameras"
              value={stats.cameras.total}
              subtitle={`${stats.cameras.streaming} streaming`}
              icon={<Camera className="w-6 h-6 text-white" />}
              color="bg-blue-600"
              link="/cameras"
            />
            <StatCard
              title="Devices"
              value={stats.devices.total}
              subtitle="Connected"
              icon={<Plug className="w-6 h-6 text-white" />}
              color="bg-green-600"
              link="/devices"
            />
            <StatCard
              title="Tasks"
              value={stats.tasks.pending}
              subtitle={`${stats.tasks.completed} completed`}
              icon={<ListTodo className="w-6 h-6 text-white" />}
              color="bg-orange-600"
              link="/tasks"
            />
            <StatCard
              title="Shopping"
              value={stats.shopping.pending}
              subtitle="Items to buy"
              icon={<ShoppingCart className="w-6 h-6 text-white" />}
              color="bg-purple-600"
              link="/shopping"
            />
          </div>

          {/* Quick Actions */}
          <div className="bg-slate-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link
                to="/cameras"
                className="bg-slate-700 hover:bg-slate-600 rounded-lg p-4 text-center transition-colors"
              >
                <Camera className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                <span className="text-sm text-slate-200">View Cameras</span>
              </Link>
              <Link
                to="/cameras?action=discover"
                className="bg-slate-700 hover:bg-slate-600 rounded-lg p-4 text-center transition-colors"
              >
                <Camera className="w-8 h-8 text-green-400 mx-auto mb-2" />
                <span className="text-sm text-slate-200">Find Cameras</span>
              </Link>
              <Link
                to="/tasks?action=new"
                className="bg-slate-700 hover:bg-slate-600 rounded-lg p-4 text-center transition-colors"
              >
                <ListTodo className="w-8 h-8 text-orange-400 mx-auto mb-2" />
                <span className="text-sm text-slate-200">Add Task</span>
              </Link>
              <Link
                to="/shopping?action=new"
                className="bg-slate-700 hover:bg-slate-600 rounded-lg p-4 text-center transition-colors"
              >
                <ShoppingCart className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                <span className="text-sm text-slate-200">Add Item</span>
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
