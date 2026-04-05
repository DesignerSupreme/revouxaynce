import React, { useState } from "react";
import {
  ClipboardList, Plus, GripVertical, Calendar, User, AlertTriangle, CheckCircle2
} from "lucide-react";
import type { Task, TaskStage, TaskPriority, Event, TeamMember } from "@/types";
import { uid } from "@/lib/helpers";
import { Modal } from "@/components/app/Modal";
import { FormInput, FormSelect, FormSelectLabeled, Btn } from "@/components/app/FormElements";
import { Badge } from "@/components/app/Badge";
import { Empty } from "@/components/app/Empty";
import { FadeInUp } from "@/components/app/FadeInUp";
import { daysUntil, shortDate } from "@/lib/helpers";

const STAGES: TaskStage[] = ["Planning", "Vendor Coordination", "Setup & Logistics", "Event Execution", "Post-Event"];
const PRIORITIES: TaskPriority[] = ["Low", "Medium", "High", "Urgent"];

interface TasksViewProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  events: Event[];
  team: TeamMember[];
  log: (text: string) => void;
  toast: (msg: string) => void;
}

export function TasksView({ tasks, setTasks, events, team, log, toast }: TasksViewProps) {
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [filterEvent, setFilterEvent] = useState("");
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const filteredTasks = filterEvent ? tasks.filter(t => t.eventId === filterEvent) : tasks;

  const save = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const obj = Object.fromEntries(fd.entries()) as Record<string, string>;
    if (editing) {
      setTasks(ts => ts.map(t => t.id === editing.id ? {
        ...t,
        title: obj.title || "",
        eventId: obj.eventId || "",
        assigneeId: obj.assigneeId || "",
        stage: (obj.stage as TaskStage) || "Planning",
        priority: (obj.priority as TaskPriority) || "Medium",
        dueDate: obj.dueDate || "",
      } : t));
      toast("Task updated"); log(`Updated task: ${obj.title}`);
    } else {
      setTasks(ts => [...ts, {
        id: uid(),
        title: obj.title || "",
        eventId: obj.eventId || "",
        assigneeId: obj.assigneeId || "",
        stage: (obj.stage as TaskStage) || "Planning",
        priority: (obj.priority as TaskPriority) || "Medium",
        dueDate: obj.dueDate || "",
        completed: false,
        createdAt: new Date().toISOString(),
      }]);
      toast("Task created"); log(`Created task: ${obj.title}`);
    }
    setModal(false); setEditing(null);
  };

  const moveToStage = (taskId: string, newStage: TaskStage) => {
    setTasks(ts => ts.map(t => t.id === taskId ? { ...t, stage: newStage } : t));
  };

  const toggleComplete = (taskId: string) => {
    setTasks(ts => ts.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t));
  };

  const deleteTask = (taskId: string) => {
    setTasks(ts => ts.filter(t => t.id !== taskId));
    toast("Task deleted");
  };

  const handleDragStart = (taskId: string) => setDraggedId(taskId);
  const handleDragEnd = () => setDraggedId(null);
  const handleDrop = (stage: TaskStage) => {
    if (draggedId) {
      moveToStage(draggedId, stage);
      setDraggedId(null);
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
        <h1 className="text-3xl">Tasks</h1>
        <div className="flex items-center gap-3">
          <select
            value={filterEvent}
            onChange={e => setFilterEvent(e.target.value)}
            className="border border-input bg-background px-3 py-2 text-sm font-sans focus:outline-none focus:border-foreground transition-colors"
          >
            <option value="">All Events</option>
            {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
          </select>
          <Btn onClick={() => { setEditing(null); setModal(true); }}>
            <Plus size={14} className="inline mr-1" /> New Task
          </Btn>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
        {STAGES.map(stage => {
          const stageTasks = filteredTasks.filter(t => t.stage === stage);
          return (
            <div
              key={stage}
              className="min-w-[260px] flex-1 border border-foreground"
              onDragOver={e => e.preventDefault()}
              onDrop={() => handleDrop(stage)}
            >
              <div className="border-b border-foreground px-3 py-2.5 bg-muted flex items-center justify-between">
                <span className="text-xs font-sans font-semibold uppercase tracking-wider">{stage}</span>
                <span className="text-xs font-sans text-muted-foreground">{stageTasks.length}</span>
              </div>
              <div className="p-2 space-y-2 min-h-[200px]">
                {stageTasks.length === 0 ? (
                  <div className="text-xs text-muted-foreground font-sans text-center py-8">
                    Drop tasks here
                  </div>
                ) : (
                  stageTasks.map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      events={events}
                      team={team}
                      onDragStart={() => handleDragStart(task.id)}
                      onDragEnd={handleDragEnd}
                      onToggle={() => toggleComplete(task.id)}
                      onEdit={() => { setEditing(task); setModal(true); }}
                      onDelete={() => deleteTask(task.id)}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Modal open={modal} onClose={() => { setModal(false); setEditing(null); }} title={editing ? "Edit Task" : "New Task"}>
        <form onSubmit={save}>
          <FormInput label="Title" name="title" defaultValue={editing?.title} required />
          <FormSelectLabeled label="Event" name="eventId" options={events.map(e => ({ value: e.id, label: e.name }))} defaultValue={editing?.eventId} />
          <FormSelectLabeled label="Assignee" name="assigneeId" options={team.map(m => ({ value: m.id, label: m.name }))} defaultValue={editing?.assigneeId} />
          <FormSelect label="Stage" name="stage" options={[...STAGES]} defaultValue={editing?.stage || "Planning"} />
          <FormSelect label="Priority" name="priority" options={[...PRIORITIES]} defaultValue={editing?.priority || "Medium"} />
          <FormInput label="Due Date" name="dueDate" type="date" defaultValue={editing?.dueDate} />
          <div className="flex gap-3 mt-4">
            <Btn type="submit">Save</Btn>
            <Btn variant="secondary" type="button" onClick={() => { setModal(false); setEditing(null); }}>Cancel</Btn>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// ─── Task Card ────────────────────────────────────────────────────
function TaskCard({ task, events, team, onDragStart, onDragEnd, onToggle, onEdit, onDelete }: {
  task: Task; events: Event[]; team: TeamMember[];
  onDragStart: () => void; onDragEnd: () => void;
  onToggle: () => void; onEdit: () => void; onDelete: () => void;
}) {
  const event = events.find(e => e.id === task.eventId);
  const assignee = team.find(m => m.id === task.assigneeId);
  const days = task.dueDate ? daysUntil(task.dueDate) : null;
  const isOverdue = days !== null && days < 0 && !task.completed;
  const isUrgent = task.priority === "Urgent" || task.priority === "High";

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={`border p-3 cursor-grab active:cursor-grabbing transition-all hover:bg-muted/30 ${
        isOverdue ? "border-foreground bg-muted/40" : "border-input"
      } ${task.completed ? "opacity-50" : ""}`}
    >
      <div className="flex items-start gap-2">
        <GripVertical size={14} className="text-muted-foreground mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`text-sm font-sans font-semibold ${task.completed ? "line-through" : ""}`}>
              {task.title}
            </span>
            {isOverdue && <AlertTriangle size={12} className="text-foreground" />}
            {isUrgent && !isOverdue && (
              <span className="text-[9px] font-sans uppercase tracking-wider bg-foreground text-background px-1.5 py-0.5">
                {task.priority}
              </span>
            )}
          </div>
          {event && (
            <div className="text-[10px] text-muted-foreground font-sans mt-1">{event.name}</div>
          )}
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            {assignee && (
              <span className="text-[10px] text-muted-foreground font-sans flex items-center gap-1">
                <User size={10} /> {assignee.name}
              </span>
            )}
            {task.dueDate && (
              <span className={`text-[10px] font-sans flex items-center gap-1 ${isOverdue ? "text-foreground font-semibold" : "text-muted-foreground"}`}>
                <Calendar size={10} /> {shortDate(task.dueDate)}
                {isOverdue && ` (${Math.abs(days!)}d overdue)`}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-1 mt-2">
        <button onClick={onToggle} className="p-1 hover:bg-muted transition-colors" title={task.completed ? "Reopen" : "Complete"}>
          <CheckCircle2 size={13} className={task.completed ? "text-foreground" : "text-muted-foreground"} />
        </button>
        <button onClick={onEdit} className="p-1 hover:bg-muted transition-colors text-xs font-sans text-muted-foreground">Edit</button>
        <button onClick={onDelete} className="p-1 hover:bg-muted transition-colors text-xs font-sans text-muted-foreground">Del</button>
      </div>
    </div>
  );
}
