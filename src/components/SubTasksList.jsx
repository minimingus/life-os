import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, ChevronDown, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SubTasksList({ parentTask, allTasks }) {
  const [showSubTasks, setShowSubTasks] = useState(true);
  const [newSubTask, setNewSubTask] = useState("");
  const queryClient = useQueryClient();

  const subTasks = allTasks.filter(t => t.parent_task_id === parentTask.id);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Task.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setNewSubTask("");
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Task.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Task.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] })
  });

  const handleAddSubTask = (e) => {
    e.preventDefault();
    if (!newSubTask.trim()) return;

    createMutation.mutate({
      title: newSubTask,
      parent_task_id: parentTask.id,
      status: "pending",
      priority: parentTask.priority || 4,
      project: parentTask.project,
      assigned_to_id: parentTask.assigned_to_id,
      assigned_to_name: parentTask.assigned_to_name,
      _idempotency_key: `subtask_${parentTask.id}_${Date.now()}`
    });
  };

  const toggleSubTask = (subTask) => {
    updateMutation.mutate({
      id: subTask.id,
      data: {
        ...subTask,
        status: subTask.status === "completed" ? "pending" : "completed",
        completed_at: subTask.status === "completed" ? null : new Date().toISOString()
      }
    });
  };

  const completedCount = subTasks.filter(t => t.status === "completed").length;
  const totalCount = subTasks.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="border-t border-slate-200 dark:border-slate-700 mt-3 pt-3">
      <button
        onClick={() => setShowSubTasks(!showSubTasks)}
        className="flex items-center gap-2 w-full text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 mb-2 select-none"
      >
        {showSubTasks ? (
          <ChevronDown className="w-4 h-4" />
        ) : (
          <ChevronLeft className="w-4 h-4" />
        )}
        <span className="font-medium">
          תתי-משימות ({completedCount}/{totalCount})
        </span>
        {totalCount > 0 && (
          <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden ml-auto max-w-[100px]">
            <div
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </button>

      {showSubTasks && (
        <div className="space-y-2 pr-4">
          <form onSubmit={handleAddSubTask} className="flex gap-2">
            <Input
              value={newSubTask}
              onChange={(e) => setNewSubTask(e.target.value)}
              placeholder="הוסף תת-משימה..."
              className="flex-1 h-8 text-sm"
            />
            <Button type="submit" size="sm" variant="ghost" className="h-8 w-8 p-0">
              <Plus className="w-4 h-4" />
            </Button>
          </form>

          {subTasks.length > 0 && (
            <div className="space-y-1">
              {subTasks.map(subTask => (
                <div
                  key={subTask.id}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 group"
                >
                  <Checkbox
                    checked={subTask.status === "completed"}
                    onCheckedChange={() => toggleSubTask(subTask)}
                    className="flex-shrink-0"
                  />
                  <span
                    className={cn(
                      "flex-1 text-sm",
                      subTask.status === "completed"
                        ? "line-through text-slate-400 dark:text-slate-500"
                        : "text-slate-700 dark:text-slate-300"
                    )}
                  >
                    {subTask.title}
                  </span>
                  <button
                    onClick={() => deleteMutation.mutate(subTask.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded select-none"
                  >
                    <Trash2 className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}