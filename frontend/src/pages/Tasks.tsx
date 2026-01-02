import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Loader2, AlertCircle, ListTodo, X, Check, Trash2, Calendar } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { taskApi } from '../services/api';
import type { Task, TaskCreate } from '../types';

const priorityColors: Record<string, string> = {
  low: 'bg-slate-500',
  medium: 'bg-blue-500',
  high: 'bg-orange-500',
  urgent: 'bg-red-500',
};

const categoryIcons: Record<string, string> = {
  todo: 'General',
  refill: 'Refill',
  maintenance: 'Maintenance',
  other: 'Other',
};

export default function Tasks() {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [filter, setFilter] = useState<{ category?: string; completed?: boolean }>({});

  const { data: tasks, isLoading, error } = useQuery({
    queryKey: ['tasks', filter],
    queryFn: () => taskApi.getAll(filter),
  });

  const addTaskMutation = useMutation({
    mutationFn: taskApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setShowAddModal(false);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: taskApi.toggle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: taskApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const pendingTasks = tasks?.filter((t) => !t.completed) || [];
  const completedTasks = tasks?.filter((t) => t.completed) || [];

  return (
    <div className="p-6">
      <PageHeader
        title="Tasks"
        subtitle={`${pendingTasks.length} pending tasks`}
        action={
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Task</span>
          </button>
        }
      />

      {/* Category Filter */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <button
          onClick={() => setFilter({})}
          className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
            !filter.category
              ? 'bg-blue-600 text-white'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          All
        </button>
        {Object.entries(categoryIcons).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter({ category: key })}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
              filter.category === key
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <span className="text-red-200">Failed to load tasks.</span>
        </div>
      )}

      {/* Empty State */}
      {tasks && tasks.length === 0 && (
        <div className="bg-slate-800 rounded-xl p-12 text-center">
          <ListTodo className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No tasks yet</h3>
          <p className="text-slate-400 mb-6">
            Add tasks to keep track of things to do around the house.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Task</span>
          </button>
        </div>
      )}

      {/* Pending Tasks */}
      {pendingTasks.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">Pending</h2>
          <div className="space-y-2">
            {pendingTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onToggle={() => toggleMutation.mutate(task.id)}
                onDelete={() => deleteMutation.mutate(task.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Completed Tasks */}
      {completedTasks.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-slate-400 mb-4">Completed</h2>
          <div className="space-y-2 opacity-60">
            {completedTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onToggle={() => toggleMutation.mutate(task.id)}
                onDelete={() => deleteMutation.mutate(task.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      {showAddModal && (
        <AddTaskModal
          onClose={() => setShowAddModal(false)}
          onAdd={(task) => addTaskMutation.mutate(task)}
          isLoading={addTaskMutation.isPending}
        />
      )}
    </div>
  );
}

// Task Card Component
interface TaskCardProps {
  task: Task;
  onToggle: () => void;
  onDelete: () => void;
}

function TaskCard({ task, onToggle, onDelete }: TaskCardProps) {
  return (
    <div className="bg-slate-800 rounded-lg p-4 flex items-center gap-4">
      <button
        onClick={onToggle}
        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
          task.completed
            ? 'bg-green-500 border-green-500'
            : 'border-slate-500 hover:border-blue-500'
        }`}
      >
        {task.completed && <Check className="w-4 h-4 text-white" />}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={`text-white ${task.completed ? 'line-through text-slate-400' : ''}`}
          >
            {task.title}
          </span>
          <span
            className={`px-2 py-0.5 rounded text-xs text-white ${
              priorityColors[task.priority]
            }`}
          >
            {task.priority}
          </span>
          <span className="px-2 py-0.5 rounded text-xs bg-slate-700 text-slate-300">
            {categoryIcons[task.category] || task.category}
          </span>
        </div>
        {task.description && (
          <p className="text-slate-400 text-sm mt-1 truncate">{task.description}</p>
        )}
        {task.due_date && (
          <div className="flex items-center gap-1 text-slate-500 text-sm mt-1">
            <Calendar className="w-3 h-3" />
            <span>{new Date(task.due_date).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      <button
        onClick={onDelete}
        className="p-2 text-slate-400 hover:text-red-400 transition-colors"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

// Add Task Modal
interface AddTaskModalProps {
  onClose: () => void;
  onAdd: (task: TaskCreate) => void;
  isLoading: boolean;
}

function AddTaskModal({ onClose, onAdd, isLoading }: AddTaskModalProps) {
  const [formData, setFormData] = useState<TaskCreate>({
    title: '',
    description: '',
    category: 'todo',
    priority: 'medium',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Add Task</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
              placeholder="Buy groceries"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white resize-none"
              rows={3}
              placeholder="Optional details..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
              >
                {Object.entries(categoryIcons).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">Due Date (optional)</label>
            <input
              type="date"
              value={formData.due_date || ''}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
            />
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
