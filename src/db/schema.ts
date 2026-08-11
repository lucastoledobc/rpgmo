// arquivo: estrutura das tabelas de dados (schema)
// local: src\db\schema.ts

import {sqliteTable, text, integer, real, index} from 'drizzle-orm/sqlite-core';

// ---------- campaigns ----------

export const campaigns = sqliteTable('campaigns', {
  room: text('room').notNull().primaryKey(),
  title: text('title').notNull(),
  passHash: text('pass_hash').notNull(),
  worldId: integer('world_id').notNull().references(() => worlds.id),
  state: text('state'),
  context: text('context'),
  timeline: text('timeline'),
  createdAt: integer('created_at', {mode: 'timestamp'}).notNull(),
  lastActivityAt: integer('last_activity_at', {mode: 'timestamp'}).notNull(),
});

// ---------- worlds ----------

export const worlds = sqliteTable('worlds', {
  id: integer('id').primaryKey({autoIncrement: true}),
  title: text('title').notNull(),
  version: text('version').notNull().default('1.00'),
  theme: text('theme'),
  rules: text('rules').notNull(),
  places: text('places'),
  history: text('history'),
  npcs: text('npcs'),
  monsters: text('monsters'),
  items: text('items'),
  groups: text('groups'),
  plots: text('plots'),
});

// ---------- masters ----------

export const masters = sqliteTable('masters', {
  id: integer('id').primaryKey({autoIncrement: true}),
  room: text('room').notNull().references(() => campaigns.room),
  system: text('system'),               // "ollama/gemini"
  model: text('model'),                 // "qwen2-5:7b/gemini-flash-3.6"
  modelImg: text('model_img'),          // "gemma4/gemini-flash"
  apiKey: text('api_key'),
  url: text('url'),
  contextSize: integer('context_size'), // tamanho do contexto
  numPredict: integer('num_predict'),   // tamanho da resposta
  temperature: real('temperature'),     // criatividade
  repeatPenalty: real('repeat_penalty'),// repetir palavras
  personality: text('personality'),     // personalidade padrão
}, (table) => [
  index('masters_room_index').on(table.room),
]);

// ---------- characters ----------

export const characters = sqliteTable('characters', {
  id: text('id').primaryKey().notNull(), //"id = nome_12caracteres" 
  room: text('room').notNull().references(() => campaigns.room),
  name: text('name'),
  age: integer('age'),
  race: text('race'),
  class: text('class'),
  appearance: text('appearance'),
  history: text('history'),
}, (table) => [
  index('characters_room_index').on(table.room),
]);

// ---------- character_status ----------

export const characterStatus = sqliteTable('character_status', {
  id: integer('id').primaryKey({autoIncrement: true}),
  charId: text('char_id').notNull().references(() => characters.id),
  type: text('type').notNull(),         // 'attribute' | 'resource'
  name: text('name').notNull(),
  value: integer('value').notNull(),
  max: integer('max'),
});

// ---------- character_items ----------

export const characterItems = sqliteTable('character_items', {
  id: integer('id').primaryKey({autoIncrement: true}),
  charId: text('char_id').notNull().references(() => characters.id),
  name: text('name').notNull(),
  slot: text('slot').notNull(), // 'equip' | 'backpack'
  quantity: integer('quantity').notNull().default(1),
  wight: integer('weight'),
});

// ---------- campaign_log ----------

export const campaignLogs = sqliteTable('campaign_logs', {
  id: integer('id').primaryKey({autoIncrement: true}),
  room: text('room').notNull().references(() => campaigns.room),
  sender: text('sender').notNull(),
  charId: text('char_id'),
  charName: text('char_name'),
  type: text('type').notNull(),
  text: text('text').notNull(),
  sentAt: integer('sent_at', {mode: 'timestamp'}).notNull(),
}, (table) => [
  index('campaign_logs_room_index').on(table.room),
]);

// ---------- chat_messages ----------

export const chatMessages = sqliteTable('chat_messages', {
  id: integer('id').primaryKey({autoIncrement: true}),
  room: text('room').notNull().references(() => campaigns.room),
  sender: text('sender').notNull(),
  text: text('text').notNull(),
  sentAt: integer('sent_at', {mode: 'timestamp'}).notNull(),
}, (table) => [
  index('chat_messages_room_index').on(table.room),
]);