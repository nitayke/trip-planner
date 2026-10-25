import { TripTask } from '../types/trip';

// Tasks that are not done yet and that this task is waiting for
export function getBlockingTasks(task: TripTask, tasks: TripTask[]): TripTask[] {
  return task.dependsOn
    .map((id) => tasks.find((t) => t.id === id))
    .filter((t): t is TripTask => Boolean(t) && !t!.isDone);
}

// Tasks that (directly) wait for this one
export function getDependentTasks(task: TripTask, tasks: TripTask[]): TripTask[] {
  return tasks.filter((t) => t.dependsOn.includes(task.id));
}

// Every task that is waiting, directly or through others, on `taskId`
export function getAllDownstream(taskId: string, tasks: TripTask[]): TripTask[] {
  const result: TripTask[] = [];
  const seen = new Set<string>();
  const stack = [taskId];
  while (stack.length > 0) {
    const current = stack.pop()!;
    for (const t of tasks) {
      if (t.dependsOn.includes(current) && !seen.has(t.id)) {
        seen.add(t.id);
        result.push(t);
        stack.push(t.id);
      }
    }
  }
  return result;
}
