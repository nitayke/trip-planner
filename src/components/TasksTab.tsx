'use client';

import React, { useState } from 'react';
import { TripTask, TaskGroup } from '../types/trip';
import { getAllDownstream, getBlockingTasks, getDependentTasks } from '../lib/tasks';
import { ListChecks, Plus, Trash2, CheckCircle2, Circle, Lock, Link2, CalendarClock, Flame } from 'lucide-react';

interface TasksTabProps {
  tasks: TripTask[];
  onAddTask: (task: Omit<TripTask, 'id' | 'tripId'>) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
}

type Filter = 'all' | 'available' | 'blocked' | 'done';

const GROUPS: TaskGroup[] = ['בריאות ומסמכים', 'הכנות לטיסה', 'הזמנות בוייטנאם', 'הזמנות בפיליפינים'];

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'הכל' },
  { id: 'available', label: 'זמינות לביצוע' },
  { id: 'blocked', label: 'חסומות' },
  { id: 'done', label: 'הושלמו' },
];

const formatDate = (iso: string) => {
  try {
    return new Intl.DateTimeFormat('he-IL', { day: 'numeric', month: 'short', year: 'numeric' }).format(
      new Date(`${iso}T00:00:00`)
    );
  } catch {
    return iso;
  }
};

export function TasksTab({ tasks, onAddTask, onToggleTask, onDeleteTask }: TasksTabProps) {
  const [filter, setFilter] = useState<Filter>('all');
  const [showAddForm, setShowAddForm] = useState(false);

  const [title, setTitle] = useState('');
  const [group, setGroup] = useState<TaskGroup>('הכנות לטיסה');
  const [assignedTo, setAssignedTo] = useState<TripTask['assignedTo']>('שנינו');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [dependsOn, setDependsOn] = useState<string[]>([]);
  const [phase, setPhase] = useState<'before' | 'during'>('before');
  const [urgent, setUrgent] = useState(false);

  const doneCount = tasks.filter((t) => t.isDone).length;
  const totalCount = tasks.length;
  const progressPercent = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  const isBlocked = (t: TripTask) => !t.isDone && getBlockingTasks(t, tasks).length > 0;

  const visibleTasks = tasks.filter((t) => {
    if (filter === 'done') return t.isDone;
    if (filter === 'blocked') return isBlocked(t);
    if (filter === 'available') return !t.isDone && !isBlocked(t);
    return true;
  });

  const counts: Record<Filter, number> = {
    all: tasks.length,
    available: tasks.filter((t) => !t.isDone && !isBlocked(t)).length,
    blocked: tasks.filter(isBlocked).length,
    done: doneCount,
  };

  const toggleDependency = (id: string) =>
    setDependsOn((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAddTask({
      title: title.trim(),
      group,
      assignedTo,
      dueDate: dueDate || undefined,
      notes: notes.trim() || undefined,
      isDone: false,
      dependsOn,
      phase,
      urgent,
    });
    setTitle('');
    setDueDate('');
    setNotes('');
    setDependsOn([]);
    setPhase('before');
    setUrgent(false);
    setShowAddForm(false);
  };

  const handleToggle = (task: TripTask) => {
    if (isBlocked(task)) return;
    if (task.isDone) {
      // Re-opening a task would leave tasks that were built on it marked as done
      const downstreamDone = getAllDownstream(task.id, tasks).filter((t) => t.isDone);
      if (downstreamDone.length > 0) {
        const names = downstreamDone.map((t) => `"${t.title}"`).join(', ');
        if (!window.confirm(`המשימות הבאות כבר סומנו כבוצעו והן תלויות במשימה הזו: ${names}. לפתוח אותה מחדש בכל זאת?`)) {
          return;
        }
      }
    }
    onToggleTask(task.id);
  };

  // "during" tasks keep the order of the seed list, which follows the route chronologically
  const allDuringTasks = tasks.filter((t) => t.phase === 'during');
  const duringTasks = visibleTasks.filter((t) => t.phase === 'during');

  const renderRow = (task: TripTask) => {
    const blockers = getBlockingTasks(task, tasks);
    const blocked = !task.isDone && blockers.length > 0;
    const unlocks = getDependentTasks(task, tasks);

    return (
      <div
        key={task.id}
        onClick={() => handleToggle(task)}
        aria-disabled={blocked}
        className={`px-4 py-3 flex items-start justify-between gap-3 transition-colors ${
          blocked ? 'bg-stone-50/60 cursor-not-allowed' : 'hover:bg-stone-50/70 cursor-pointer'
        }`}
      >
        <div className="flex items-start gap-3 min-w-0">
          {task.isDone ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-100 shrink-0 mt-0.5" />
          ) : blocked ? (
            <Lock className="w-5 h-5 text-stone-300 shrink-0 mt-0.5" />
          ) : (
            <Circle className="w-5 h-5 text-stone-300 shrink-0 mt-0.5" />
          )}

          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-sm font-medium ${
                  task.isDone ? 'line-through text-stone-400' : blocked ? 'text-stone-400' : 'text-stone-800'
                }`}
              >
                {task.title}
              </span>
              {task.urgent && !task.isDone && (
                <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md bg-rose-50 text-rose-700 font-bold">
                  <Flame className="w-3 h-3" />
                  לסגור בהקדם
                </span>
              )}
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-stone-100 text-stone-500 font-medium">
                {task.assignedTo}
              </span>
              {task.dueDate && (
                <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-800 font-medium">
                  <CalendarClock className="w-3 h-3" />
                  {formatDate(task.dueDate)}
                </span>
              )}
            </div>

            {task.notes && <p className="text-xs text-stone-500">{task.notes}</p>}

            {blocked && (
              <p className="flex items-center gap-1 text-[11px] text-amber-700 flex-wrap">
                <Link2 className="w-3 h-3 shrink-0" />
                <span>ממתינה ל:</span>
                {blockers.map((b) => (
                  <span key={b.id} className="px-1.5 py-0.5 rounded-md bg-amber-50 font-medium">
                    {b.title}
                  </span>
                ))}
              </p>
            )}

            {!task.isDone && !blocked && unlocks.length > 0 && (
              <p className="flex items-center gap-1 text-[11px] text-teal-700 flex-wrap">
                <Link2 className="w-3 h-3 shrink-0" />
                <span>פותחת:</span>
                {unlocks.map((u) => (
                  <span key={u.id} className="px-1.5 py-0.5 rounded-md bg-teal-50 font-medium">
                    {u.title}
                  </span>
                ))}
              </p>
            )}
          </div>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onDeleteTask(task.id);
          }}
          title="מחק משימה"
          className="p-1 text-stone-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors shrink-0"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-stone-800 flex items-center gap-2">
            <ListChecks className="w-5 h-5 text-teal-600" />
            <span>
              משימות לפני הטיול ({doneCount}/{totalCount})
            </span>
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            משימה שתלויה באחרת נפתחת רק אחרי שהמשימה שלפניה הושלמה
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>{showAddForm ? 'ביטול' : 'הוספת משימה'}</span>
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-stone-200/90 shadow-2xs">
        <div className="flex items-center justify-between text-xs font-bold text-stone-700 mb-2">
          <span>התקדמות: {progressPercent}%</span>
          <span className="text-stone-500 font-normal">
            הושלמו {doneCount} מתוך {totalCount} משימות
          </span>
        </div>
        <div className="w-full h-3 bg-stone-100 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              progressPercent === 100 ? 'bg-emerald-500' : progressPercent > 50 ? 'bg-teal-600' : 'bg-amber-500'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
              filter === f.id
                ? 'bg-teal-600 text-white shadow-2xs'
                : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
            }`}
          >
            <span>
              {f.label} ({counts[f.id]})
            </span>
          </button>
        ))}
      </div>

      {showAddForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white p-4 rounded-2xl border border-teal-200 shadow-sm space-y-3 animate-in fade-in"
        >
          <h3 className="text-sm font-bold text-stone-800 flex items-center gap-1.5">
            <Plus className="w-4 h-4 text-teal-600" />
            <span>הוספת משימה</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-stone-600 mb-1">שם המשימה *</label>
              <input
                type="text"
                required
                placeholder="למשל: להזמין מלון בסאפה"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">קבוצה</label>
              <select
                value={group}
                onChange={(e) => setGroup(e.target.value as TaskGroup)}
                className="w-full text-sm px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
              >
                {GROUPS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">באחריות מי?</label>
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value as TripTask['assignedTo'])}
                className="w-full text-sm px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
              >
                <option value="שנינו">שנינו</option>
                <option value="הוא">הוא</option>
                <option value="היא">היא</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">תאריך יעד</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">מתי לסגור?</label>
              <select
                value={phase}
                onChange={(e) => setPhase(e.target.value as 'before' | 'during')}
                className="w-full text-sm px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
              >
                <option value="before">לפני הטיול</option>
                <option value="during">במהלך הטיול</option>
              </select>
            </div>

            <label className="flex items-center gap-2 text-xs font-medium text-stone-600 sm:col-span-2 md:col-span-4 cursor-pointer">
              <input type="checkbox" checked={urgent} onChange={(e) => setUrgent(e.target.checked)} />
              <span>לסגור בהקדם</span>
            </label>

            <div className="sm:col-span-2 md:col-span-3">
              <label className="block text-xs font-medium text-stone-600 mb-1">הערות</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {tasks.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1.5">
                תלויה במשימות (אפשר לבחור כמה)
              </label>
              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                {tasks.map((t) => {
                  const selected = dependsOn.includes(t.id);
                  return (
                    <button
                      type="button"
                      key={t.id}
                      onClick={() => toggleDependency(t.id)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors ${
                        selected
                          ? 'bg-teal-600 text-white border-teal-600'
                          : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
                      }`}
                    >
                      {t.title}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1 text-xs text-stone-600 hover:bg-stone-100 rounded-xl"
            >
              ביטול
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-xs"
            >
              הוסף משימה
            </button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {visibleTasks.length === 0 && (
          <div className="bg-white rounded-2xl p-8 border border-stone-200 text-center text-sm text-stone-500">
            אין משימות בתצוגה הזו
          </div>
        )}

        {GROUPS.map((g) => {
          const groupTasks = visibleTasks
            .filter((t) => t.group === g && (t.phase ?? 'before') === 'before')
            .sort((x, y) => Number(Boolean(y.urgent)) - Number(Boolean(x.urgent)));
          if (groupTasks.length === 0) return null;
          const groupAll = tasks.filter((t) => t.group === g && (t.phase ?? 'before') === 'before');
          const groupDone = groupAll.filter((t) => t.isDone).length;

          return (
            <div key={g} className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs overflow-hidden">
              <div className="px-4 py-2.5 bg-stone-50 border-b border-stone-100 font-bold text-xs text-stone-700 flex items-center justify-between">
                <span>{g}</span>
                <span className="text-stone-400 font-normal">
                  {groupDone}/{groupAll.length} הושלמו
                </span>
              </div>
              <div className="divide-y divide-stone-100">{groupTasks.map(renderRow)}</div>
            </div>
          );
        })}

        {duringTasks.length > 0 && (
          <div className="bg-white rounded-2xl border border-sky-200/90 shadow-2xs overflow-hidden">
            <div className="px-4 py-2.5 bg-sky-50 border-b border-sky-100 font-bold text-xs text-sky-900 flex items-center justify-between">
              <span>לסגור במהלך הטיול (לפי סדר המסלול)</span>
              <span className="text-sky-700/70 font-normal">
                {allDuringTasks.filter((t) => t.isDone).length}/{allDuringTasks.length} הושלמו
              </span>
            </div>
            <div className="divide-y divide-stone-100">{duringTasks.map(renderRow)}</div>
          </div>
        )}
      </div>
    </div>
  );
}
