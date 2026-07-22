// arquivo: estrutura das tabelas de dados (schema)
// local: src\db\schema.ts

import {sqliteTable, text, integer, real, index, unique} from 'drizzle-orm/sqlite-core';

// ---------- rooms ----------

export const rooms = sqliteTable('rooms', {
  id: text('id').primaryKey(),    // código de 12 caracteres
  passHash: text('pass_hash').notNull(),
  createdAt: integer('created_at', {mode: 'timestamp'}).notNull(),
  lastActivityAt: integer('last_activity_at', {mode: 'timestamp'}).notNull(),
});

// ---------- adventures ----------

export const adventures = sqliteTable('adventures', {
  id: integer('id').primaryKey({autoIncrement: true}),
  roomId: text('room_id').notNull().references(() => rooms.id),
  title: text('title').notNull(),
  worldId: integer('world_id').notNull().references(() => worlds.id),
  currentYear: integer('current_year'),
  timeline: text('timeline'),       // acontecimentos importantes que devem ser anotados
  createdAt: integer('created_at', {mode: 'timestamp'}), // início da aventura
}, (table) => [
  index('adventures_room_idx').on(table.roomId),
]);

// ---------- worlds ----------

export const worlds = sqliteTable('worlds', {
  id: integer('id').primaryKey({autoIncrement: true}),
  title: text('title').notNull(),
  version: text('version').notNull(),
  theme: text('theme'),
  rules: text('rules').notNull(),
  places: text('places'),
  history: text('history'),
  chars: text('chars'),
  monsters: text('monsters'),
  items: text('items'),
  groups: text('groups'),
  plots: text('plots'),
});

// ---------- masters ----------

export const masters = sqliteTable('masters', {
  id: integer('id').primaryKey({autoIncrement: true}),
  roomId: text('room_id').notNull().references(() => rooms.id),
  system: text('system').notNull(),     // "ollama/gemini/gpt"
  model: text('model').notNull(),       // "gemma4/gemini-flash/gpt-4o"
  apiKey: text('api_key'),
  contextSize: integer('context_size'), // tamanho do contexto
  temperature: real('temperature'),     // criatividade
  repeatPenalty: real('repeat_penalty'),// repetir palavras
  numPredict: integer('num_predict'),   // tamanho da resposta
  personality: text('personality'),     // personalidade padrão
}, (table) => [
  index('masters_room_idx').on(table.roomId),
]);

// ---------- characters ----------

export const characters = sqliteTable('characters', {
  id: text('id').primaryKey(),    //"id = nome_12caracteres" 
  adveId: integer('adve_id').notNull().references(() => adventures.id),
  name: text('name'),
  age: integer('age'),
  race: text('race'),
  class: text('class'),
  appearance: text('appearance'),
  history: text('history'),
}, (table) => [
  index('characters_adve_idx').on(table.adveId),
]);

// ---------- character_status ----------

export const characterStatus = sqliteTable('character_status', {
  id: integer('id').primaryKey({autoIncrement: true}),
  charId: text('char_id').notNull().references(() => characters.id),
  name: text('name').notNull(), // ex: "Força", "HP", "Sanidade"
  value: integer('value').notNull(),
  max: integer('max'), // nullable — só resources tem
  type: text('type').notNull(), // 'attribute' | 'resource'
});

// ---------- character_items ----------

export const characterItems = sqliteTable('character_items', {
  id: integer('id').primaryKey({autoIncrement: true}),
  charId: text('char_id').notNull().references(() => characters.id),
  name: text('name').notNull(),
  slot: text('slot').notNull(), // 'equip' | 'backpack'
  quantity: integer('quantity').notNull().default(1),
});

// ---------- adventure_log ----------

export const adventureLogs = sqliteTable('adventure_logs', {
  id: integer('id').primaryKey({autoIncrement: true}),
  adveId: integer('adve_id').notNull().references(() => adventures.id),
  sender: text('sender').notNull(),
  charId: text('char_id').references(() => characters.id),
  charName: text('char_name'),
  type: text('type').notNull().default('ic'), // 'ic' | 'oc'
  text: text('text').notNull(),
  sentAt: integer('sent_at', {mode: 'timestamp'}).notNull(),
}, (table) => [
  index('adventure_logs_adve_idx').on(table.adveId),
]);

// ---------- chat_messages ----------

export const chatMessages = sqliteTable('chat_messages', {
  id: integer('id').primaryKey({autoIncrement: true}),
  adveId: integer('adve_id').notNull().references(() => adventures.id),
  sender: text('sender').notNull(),
  text: text('text').notNull(),
  sentAt: integer('sent_at', {mode: 'timestamp'}).notNull(),
}, (table) => [
  index('chat_messages_adve_idx').on(table.adveId),
]);