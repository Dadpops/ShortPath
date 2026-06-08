import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import type { Note } from "../shared/types";

interface NotesData {
  notes: Note[];
}

function notesPath(userDataPath: string): string {
  return path.join(userDataPath, "notes.json");
}

function defaultData(): NotesData {
  return { notes: [] };
}

export function openNotes(userDataPath: string): NotesData {
  const p = notesPath(userDataPath);
  if (!fs.existsSync(p)) return defaultData();
  try {
    return JSON.parse(fs.readFileSync(p, "utf-8")) as NotesData;
  } catch {
    return defaultData();
  }
}

export function saveNotes(userDataPath: string, data: NotesData): void {
  fs.writeFileSync(notesPath(userDataPath), JSON.stringify(data, null, 2), "utf-8");
}

export function createNote(
  data: NotesData,
  fields: { title?: string; body: string }
): { data: NotesData; note: Note } {
  const now = new Date().toISOString();
  const note: Note = {
    id: randomUUID(),
    title: fields.title || undefined,
    body: fields.body,
    createdAt: now,
    updatedAt: now,
  };
  return { data: { notes: [note, ...data.notes] }, note };
}

export function updateNote(
  data: NotesData,
  id: string,
  updates: { title?: string; body: string }
): { data: NotesData; note: Note } {
  const idx = data.notes.findIndex((n) => n.id === id);
  if (idx === -1) throw new Error(`Note ${id} not found`);
  const note: Note = {
    ...data.notes[idx],
    title: updates.title || undefined,
    body: updates.body,
    updatedAt: new Date().toISOString(),
  };
  const notes = data.notes.map((n, i) => (i === idx ? note : n));
  return { data: { notes }, note };
}

export function deleteNote(data: NotesData, id: string): NotesData {
  return { notes: data.notes.filter((n) => n.id !== id) };
}
