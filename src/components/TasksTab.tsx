'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { TripTask, TaskGroup } from '../types/trip';
import { getAllDownstream, getBlockingTasks, getDependentTasks } from '../lib/tasks';
import { ListChecks, Plus, Trash2, Pencil, CheckCircle2, Circle, Lock, Link2, CalendarClock, Flame, User, CalendarDays } from 'lucide-react';

interface TasksTabProps {
  tasks: TripTask[];
  tripStart: string;
  onAddTask: (task: Omit<TripTask, 'id' | 'tripId'>) => void;
  onUpdateTask: (id: string, changes: Partial<Omit<TripTask, 'id' | 'tripId'>>) => void;
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

const DAY_MS = 1000 * 60 * 60 * 24;
const daysBetween = (from: string, to: string) =>
  Math.round((new Date(`${to}T00:00:00Z`).getTime() - new Date(`${from}T00:00:00Z`).getTime()) / DAY_MS);

// The date that decides when a task comes up: its deadline, else the date it is tied to
const effectiveDate = (t: TripTask) => t.dueDate ?? t.linkedDate;

// How many tasks must be done before this one (so tasks without a date follow the order they can be done in)
function dependencyDepth(task: TripTask, tasks: TripTask[], seen: string[] = []): number {
  if (seen.includes(task.id)) return 0;
  const parents = task.dependsOn.map((id) => tasks.find((t) => t.id === id)).filter((t): t is TripTask => Boolean(t));
  return parents.length === 0 ? 0 : 1 + Math.max(...parents.map((p) => dependencyDepth(p, tasks, [...seen, task.id])));
}

export function TasksTab({ tasks, tripStart, onAddTask, onUpdateTask, onToggleTask, onDeleteTask }: TasksTabProps) {
  const [filter, setFilter] = useState<Filter>('all');
  const [personFilter, setPersonFilter] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Computed on the client only (Next.js disallows `new Date()` during prerender).
  const [today, setToday] = useState<string | null>(null);
  useEffect(() => {
    const d = new Date();
    setToday(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
  }, []);

  const [title, setTitle] = useState('');
  const [group, setGroup] = useState<TaskGroup>('הכנות לטיסה');
  const [assignedTo, setAssignedTo] = useState<TripTask['assignedTo']>('שנינו');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [dependsOn, setDependsOn] = useState<string[]>([]);
  const [phase, setPhase] = useState<'before' | 'during'>('before');
  const [urgent, setUrgent] = useState(false);
  const [person, setPerson] = useState('');
  const [linkedDate, setLinkedDate] = useState('');

  const people = useMemo(
    () => Array.from(new Set(tasks.map((t) => t.person).filter((p): p is string => Boolean(p)))),
    [tasks]
  );

  const doneCount = tasks.filter((t) => t.isDone).length;
  const totalCount = tasks.length;
  const progressPercent = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  const isBlocked = (t: TripTask) => !t.isDone && getBlockingTasks(t, tasks).length > 0;

  const visibleTasks = tasks.filter((t) => {
    if (personFilter && t.person !== personFilter) return false;
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
    const fields = {
      title: title.trim(),
      group,
      assignedTo,
      dueDate: dueDate || undefined,
      notes: notes.trim() || undefined,
      dependsOn,
      phase,
      urgent,
      person: person.trim() || undefined,
      linkedDate: linkedDate || undefined,
    };
    if (editingId) onUpdateTask(editingId, fields);
    else onAddTask({ ...fields, isDone: false });
    closeForm();
  };

  const closeForm = () => {
    setTitle('');
    setGroup('הכנות לטיסה');
    setAssignedTo('שנינו');
    setDueDate('');
    setNotes('');
    setDependsOn([]);
    setPhase('before');
    setUrgent(false);
    setPerson('');
    setLinkedDate('');
    setEditingId(null);
    setShowAddForm(false);
  };

  const startEdit = (task: TripTask) => {
    setEditingId(task.id);
    setTitle(task.title);
    setGroup(task.group);
    setAssignedTo(task.assignedTo);
    setDueDate(task.dueDate ?? '');
    setNotes(task.notes ?? '');
    setDependsOn(task.dependsOn);
    setPhase(task.phase ?? 'before');
    setUrgent(Boolean(task.urgent));
    setPerson(task.person ?? '');
    setLinkedDate(task.linkedDate ?? '');
    setShowAddForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  // Sections in the order things come up: right now, then no fixed date, then by date before the trip,
  // then during the trip. Finished tasks go last.
  const sections = useMemo(() => {
    const open = visibleTasks.filter((t) => !t.isDone);
    const byDate = (a: TripTask, b: TripTask) => effectiveDate(a)!.localeCompare(effectiveDate(b)!);
    const isDuring = (t: TripTask) => {
      const d = effectiveDate(t);
      return d ? d >= tripStart : t.phase === 'during';
    };

    const now = open.filter((t) => t.urgent || (today && effectiveDate(t) && effectiveDate(t)! < today));
    const rest = open.filter((t) => !now.includes(t));
    const nowSorted = [...now].sort(
      (a, b) =>
        Number(Boolean(b.urgent)) - Number(Boolean(a.urgent)) ||
        (effectiveDate(a) ?? '9').localeCompare(effectiveDate(b) ?? '9')
    );
    const beforeUndated = rest
      .filter((t) => !isDuring(t) && !effectiveDate(t))
      .sort((a, b) => dependencyDepth(a, tasks) - dependencyDepth(b, tasks));
    const beforeDated = rest.filter((t) => !isDuring(t) && effectiveDate(t)).sort(byDate);
    const duringAll = rest.filter(isDuring);
    // "during" tasks without a date keep the seed order, which follows the route
    const during = [...duringAll.filter((t) => effectiveDate(t)).sort(byDate), ...duringAll.filter((t) => !effectiveDate(t))];

    return {
      now: nowSorted,
      beforeUndated,
      beforeDated,
      during,
      done: visibleTasks.filter((t) => t.isDone),
    };
  }, [visibleTasks, tasks, today, tripStart]);

  const relativeLabel = (date: string): { text: string; overdue: boolean } | null => {
    if (!today) return null;
    const diff = daysBetween(today, date);
    if (diff < 0) return { text: `באיחור של ${-diff} ימים`, overdue: true };
    if (diff === 0) return { text: 'היום', overdue: false };
    if (diff === 1) return { text: 'מחר', overdue: false };
    return { text: `בעוד ${diff} ימים`, overdue: false };
  };

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
                  {!task.isDone && relativeLabel(task.dueDate) && (
                    <span className={relativeLabel(task.dueDate)!.overdue ? 'text-rose-700 font-bold' : 'text-amber-700'}>
                      · {relativeLabel(task.dueDate)!.text}
                    </span>
                  )}
                </span>
              )}
              {task.person && (
                <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md bg-violet-50 text-violet-800 font-medium">
                  <User className="w-3 h-3" />
                  {task.person}
                </span>
              )}
              {task.linkedDate && (
                <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md bg-violet-50 text-violet-800 font-medium">
                  <CalendarDays className="w-3 h-3" />
                  {formatDate(task.linkedDate)}
                  {!task.isDone && !task.dueDate && relativeLabel(task.linkedDate) && (
                    <span className="text-violet-600">· {relativeLabel(task.linkedDate)!.text}</span>
                  )}
                </span>
              )}
              <span className="text-[10px] text-stone-400">{task.group}</span>
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

        <div className="flex items-center shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              startEdit(task);
            }}
            title="ערוך משימה"
            className="p-1 text-stone-300 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteTask(task.id);
            }}
            title="מחק משימה"
            className="p-1 text-stone-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
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
          onClick={() => (showAddForm ? closeForm() : setShowAddForm(true))}
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

      {people.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-stone-600">
          <User className="w-4 h-4 text-violet-600" />
          <label htmlFor="person-filter" className="font-medium">
            משימות לפי אדם:
          </label>
          <select
            id="person-filter"
            value={personFilter}
            onChange={(e) => setPersonFilter(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded-xl border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="">כולם</option>
            {people.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
      )}

      {showAddForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white p-4 rounded-2xl border border-teal-200 shadow-sm space-y-3 animate-in fade-in"
        >
          <h3 className="text-sm font-bold text-stone-800 flex items-center gap-1.5">
            <Plus className="w-4 h-4 text-teal-600" />
            <span>{editingId ? 'עריכת משימה' : 'הוספת משימה'}</span>
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

            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">קשורה לאדם</label>
              <input
                type="text"
                list="task-people"
                placeholder="למשל: אבא של נועה"
                value={person}
                onChange={(e) => setPerson(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <datalist id="task-people">
                {people.map((p) => (
                  <option key={p} value={p} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">קשורה לתאריך (למשל הפגישה איתו)</label>
              <input
                type="date"
                value={linkedDate}
                onChange={(e) => setLinkedDate(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="sm:col-span-2">
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
                {tasks.filter((t) => t.id !== editingId).map((t) => {
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
              onClick={closeForm}
              className="px-3 py-1 text-xs text-stone-600 hover:bg-stone-100 rounded-xl"
            >
              ביטול
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-xs"
            >
              {editingId ? 'שמור שינויים' : 'הוסף משימה'}
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

        {(
          [
            { key: 'now', title: '🔥 לסגור עכשיו', tone: 'rose', items: sections.now },
            { key: 'beforeUndated', title: 'לפני הטיסה - בלי תאריך קבוע (לפי סדר הביצוע)', tone: 'stone', items: sections.beforeUndated },
            { key: 'beforeDated', title: 'לפני הטיסה - לפי תאריך', tone: 'amber', items: sections.beforeDated },
            { key: 'during', title: '✈️ במהלך הטיול (לפי תאריך, ואז לפי סדר המסלול)', tone: 'sky', items: sections.during },
            { key: 'done', title: '✅ בוצעו', tone: 'emerald', items: sections.done },
          ] as const
        ).map((section) => {
          if (section.items.length === 0) return null;
          const tone = {
            rose: 'bg-rose-50 text-rose-900 border-rose-200',
            stone: 'bg-stone-50 text-stone-700 border-stone-100',
            amber: 'bg-amber-50 text-amber-900 border-amber-200',
            sky: 'bg-sky-50 text-sky-900 border-sky-200',
            emerald: 'bg-emerald-50 text-emerald-900 border-emerald-200',
          }[section.tone];
          return (
            <div key={section.key} className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs overflow-hidden">
              <div className={`px-4 py-2.5 border-b font-bold text-xs flex items-center justify-between ${tone}`}>
                <span>{section.title}</span>
                <span className="font-normal opacity-70">{section.items.length}</span>
              </div>
              <div className="divide-y divide-stone-100">{section.items.map(renderRow)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
