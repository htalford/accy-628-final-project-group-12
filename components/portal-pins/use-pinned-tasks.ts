"use client";

import { useCallback, useEffect, useState } from "react";
import {
  PINS_CHANGED_EVENT,
  readPinnedTasks,
  writePinnedTasks,
  type PinScope,
  type PinnedTask,
} from "@/lib/portal-pins";

export function usePinnedTasks(scope: PinScope) {
  const [tasks, setTasks] = useState<PinnedTask[]>([]);
  const [ready, setReady] = useState(false);

  const reload = useCallback(() => {
    setTasks(readPinnedTasks(scope));
  }, [scope]);

  useEffect(() => {
    reload();
    setReady(true);

    function onChange(e: Event) {
      const detail = (e as CustomEvent<{ scope?: PinScope }>).detail;
      if (detail?.scope && detail.scope !== scope) return;
      reload();
    }

    function onStorage(e: StorageEvent) {
      if (e.key && !e.key.includes("pinned-tasks")) return;
      reload();
    }

    window.addEventListener(PINS_CHANGED_EVENT, onChange);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(PINS_CHANGED_EVENT, onChange);
      window.removeEventListener("storage", onStorage);
    };
  }, [reload, scope]);

  const isPinned = useCallback(
    (id: string) => tasks.some((t) => t.id === id),
    [tasks],
  );

  const pin = useCallback(
    (task: PinnedTask) => {
      const next = [task, ...tasks.filter((t) => t.id !== task.id)].slice(
        0,
        12,
      );
      writePinnedTasks(scope, next);
      setTasks(next);
    },
    [scope, tasks],
  );

  const unpin = useCallback(
    (id: string) => {
      const next = tasks.filter((t) => t.id !== id);
      writePinnedTasks(scope, next);
      setTasks(next);
    },
    [scope, tasks],
  );

  const toggle = useCallback(
    (task: PinnedTask) => {
      if (isPinned(task.id)) unpin(task.id);
      else pin(task);
    },
    [isPinned, pin, unpin],
  );

  return { tasks, ready, isPinned, pin, unpin, toggle };
}
