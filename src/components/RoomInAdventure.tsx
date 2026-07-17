// arquivo: componente da aventura (chat da aventura)
// local: src\components\RoomAdventure.tsx

'use client';
import {useState, useEffect, useRef} from 'react';
import type {CharacterWithDetails, RoomDetails} from '@/types/room';
import Master from './Master';

interface RoomInAdventureProps {
  roomId: string;
  characters: CharacterWithDetails[];
  master: RoomDetails['master'];
}

interface LogEntry {
  id: number;
  sender: string;
  charId: string | null;
  charName: string | null;
  text: string;
  sentAt: string;
}

export default function RoomInAdventure({roomId, characters, master}: RoomInAdventureProps) {
  const [log, setLog] = useState<LogEntry[]>([]);
  const [action, setAction] = useState('');
  const [selectedCharId, setSelectedCharId] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [loadingIA, setLoadingIA] = useState(false);
  const [isMasterModalOpen, setIsMasterModalOpen] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const selectedChar = characters.find((c) => c.id === selectedCharId) ?? null;

  useEffect(() => {
    setPlayerName(localStorage.getItem('playerName') || 'Jogador');
  }, []);

  useEffect(() => {
    const fetchLog = async () => {
      try {
        const res = await fetch(`/api/room/${roomId}/adventure?type=ic`);
        const data = await res.json();
        if (data.log) setLog(data.log);
      }
      catch (err) {
        console.error("Erro ao buscar aventura:", err);
      }
    };

    fetchLog();
    const interval = setInterval(fetchLog, 10000);
    return () => clearInterval(interval);
  }, [roomId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({behavior: 'smooth'});
  }, [log]);

  const handleSend = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!action.trim() || loadingIA) return;

    const playerAction = action.trim();
    setAction('');
    setLoadingIA(true);

    try {
      await fetch(`/api/room/${roomId}/adventure`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({action: playerAction, playerName, char: selectedChar, mode: 'ic'}),
      });
    }
    catch (err) {
      console.error("Erro ao falar com o Mestre:", err);
    }
    finally {
      setLoadingIA(false);
    }
  };

  return (
    <aside className="roomBox">
      <header className="header">
        <h3 className='title3'>AVENTURA</h3>
        <button type="button" className="settings" onClick={() => setIsMasterModalOpen(true)}></button>

        {isMasterModalOpen && (
          <Master roomId={roomId} master={master} onClose={() => setIsMasterModalOpen(false)} />
        )}
      </header>

      <div className='adventure'>
        <div className="adventureLog">
          {log.length === 0 ? (
            <p>O Mestre está aguardando você iniciar a jornada...</p>
          ) : (
            log.map((entry) => (
            <div className='messageRow'>
              <p key={entry.id}>
                <span className="charTag">{entry.charName}</span>: {entry.text}
              </p>
            </div>
            ))
          )}
          {loadingIA && <p style={{color: '#888'}}>O Mestre está digitando...</p>}
          <div ref={endRef} />
        </div>

        <form onSubmit={handleSend} className="messageBox">
          <div className='charSelectorWrapper'>
            <select className="hiddenSelect" value={selectedCharId} onChange={(e) => setSelectedCharId(e.target.value)}>
              <option value="">-- Sem personagem --</option>
              {characters.map((c) => (
                <option key={c.id} value={c.id}>{c.name} ({c.id})</option>
              ))}
            </select>
            <span className="charLabel">
              @{selectedChar ? selectedChar.name : ''}
            </span>
          </div>

          <textarea
            className="message"
            value={action}
            onChange={(e) => setAction(e.target.value)}
            placeholder={loadingIA ? "Aguardando o Mestre..." : "Digite sua ação..."}
            rows={1}
            autoComplete="off"
            disabled={loadingIA}
          />
          <button type="submit" className="enter" disabled={loadingIA}></button>
        </form>
      </div>
    </aside>
  );
}