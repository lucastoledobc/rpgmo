'use client';
import {use} from 'react';
import Char from '@/components/Char.js';

export default function CharPage({params}: {params: Promise<{id: string; char: string}>}) {
  const {id, char} = use(params);
  
  return <Char roomId={id} charId={char} />;
}