"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { GripVertical, Users } from "lucide-react";
import { switchDemoRole } from "@/app/actions/demo-switch-role";
import { DEMO_ACCOUNTS, ROLE_LABELS, USER_ROLES } from "@/lib/auth/roles";
import type { UserRole } from "@/lib/types/database";

const STORAGE_KEY = "tq-demo-role-switcher-pos";
const BOX_WIDTH = 256; // w-64
const MARGIN = 16;

type Pos = { x: number; y: number };

function defaultPos(): Pos {
  if (typeof window === "undefined") return { x: MARGIN, y: MARGIN };
  return {
    x: Math.max(MARGIN, window.innerWidth - BOX_WIDTH - MARGIN),
    y: Math.max(MARGIN, window.innerHeight - 220 - MARGIN),
  };
}

function clampPos(pos: Pos): Pos {
  if (typeof window === "undefined") return pos;
  const maxX = Math.max(MARGIN, window.innerWidth - BOX_WIDTH - MARGIN);
  const maxY = Math.max(MARGIN, window.innerHeight - 80);
  return {
    x: Math.min(Math.max(MARGIN, pos.x), maxX),
    y: Math.min(Math.max(MARGIN, pos.y), maxY),
  };
}

function readStoredPos(): Pos | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Pos;
    if (typeof parsed?.x !== "number" || typeof parsed?.y !== "number") {
      return null;
    }
    return clampPos(parsed);
  } catch {
    return null;
  }
}

export function RoleSwitcher({ currentRole }: { currentRole: UserRole }) {
  const [pending, startTransition] = useTransition();
  // SSR-stable left/top; client layout applied after mount to avoid hydration mismatch.
  const [pos, setPos] = useState<Pos>({ x: MARGIN, y: MARGIN });
  const [ready, setReady] = useState(false);
  const [dragging, setDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const posRef = useRef(pos);
  posRef.current = pos;

  useEffect(() => {
    setPos(readStoredPos() ?? defaultPos());
    setReady(true);
  }, []);

  useEffect(() => {
    function onResize() {
      setPos((p) => clampPos(p));
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (!dragging) return;

    function onMove(e: PointerEvent) {
      const next = clampPos({
        x: e.clientX - dragOffset.current.x,
        y: e.clientY - dragOffset.current.y,
      });
      setPos(next);
    }

    function onUp() {
      setDragging(false);
      try {
        window.localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(posRef.current),
        );
      } catch {
        /* ignore */
      }
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [dragging]);

  function onSwitch(role: UserRole) {
    if (role === currentRole) return;
    startTransition(async () => {
      await switchDemoRole(role);
    });
  }

  function startDrag(e: React.PointerEvent) {
    if (e.button !== 0) return;
    e.preventDefault();
    dragOffset.current = {
      x: e.clientX - pos.x,
      y: e.clientY - pos.y,
    };
    setDragging(true);
  }

  return (
    <div
      className="fixed z-50 w-64 rounded-xl border border-[var(--cf-border)] bg-white p-3 shadow-lg"
      style={{
        left: pos.x,
        top: pos.y,
        visibility: ready ? "visible" : "hidden",
      }}
    >
      <div
        className={`mb-2 flex cursor-grab items-center gap-2 text-xs font-semibold tracking-wide text-[var(--cf-muted)] uppercase select-none active:cursor-grabbing ${
          dragging ? "cursor-grabbing" : ""
        }`}
        onPointerDown={startDrag}
      >
        <GripVertical className="h-3.5 w-3.5 shrink-0" aria-hidden />
        <Users className="h-3.5 w-3.5 shrink-0" aria-hidden />
        <span className="flex-1">Demo role switcher</span>
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        {USER_ROLES.map((role) => {
          const active = role === currentRole;
          return (
            <button
              key={role}
              type="button"
              disabled={pending}
              onClick={() => onSwitch(role)}
              className={`rounded-md px-2 py-2 text-left text-xs transition disabled:opacity-60 ${
                active
                  ? "bg-[var(--cf-navy)] text-white"
                  : "bg-[var(--cf-surface)] text-[var(--cf-ink)] hover:bg-[var(--cf-accent)]/10"
              }`}
            >
              <span className="block font-semibold">{ROLE_LABELS[role]}</span>
              <span
                className={`block truncate ${active ? "text-white/70" : "text-[var(--cf-muted)]"}`}
              >
                {DEMO_ACCOUNTS[role].label}
              </span>
            </button>
          );
        })}
      </div>
      {pending ? (
        <p className="mt-2 text-[11px] text-[var(--cf-muted)]">Switching…</p>
      ) : null}
    </div>
  );
}
