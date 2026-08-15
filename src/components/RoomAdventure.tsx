// arquivo: componente da aventura (chat da aventura)
// local: src\components\RoomAdventure.tsx

'use client';
import {useState, useEffect, useRef} from 'react';
import type {Campaign, Character, Log} from '@/types/campaign';

interface RoomAdventureProps {
  campaign: Campaign;
  disabled?: boolean;
}

export default function RoomAdventure({campaign, disabled}: RoomAdventureProps) {
  const [playerName, setPlayerName] = useState('');
  const [log, setLog] = useState<Log[]>([]);
  const endRef = useRef<HTMLDivElement>(null);
  const [selectedChar, setSelectedChar] = useState<Character | null>(null);
  const [action, setAction] = useState('');
  const [loading, setLoading] = useState(0);

  useEffect(() => {
    setPlayerName(localStorage.getItem('playerName') || 'Jogador');
  }, []);

  useEffect(() => {
    if (disabled) return;

    const fetchLog = async () => {
      try {
        const res = await fetch(`/api/room/${campaign.room}/adventure?type=ic`);
        const data = await res.json();
        if (data.log) setLog(data.log);
        setLoading(data.loading ?? 0);
      }
      catch (error) {
        console.error("Erro ao buscar aventura:", error);
      }
    };

    fetchLog();
    const interval = setInterval(fetchLog, 3000);
    return () => clearInterval(interval);
  }, [campaign.room, disabled]);

  useEffect(() => {
    endRef.current?.scrollIntoView({behavior: 'smooth'});
  }, [log]);

  const handleSend = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!action.trim() || loading > 0 || !selectedChar) return;

    const playerAction = action.trim();
    setAction('');
    setLoading(1);

    try {
      await fetch(`/api/room/${campaign.room}/adventure`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({action: playerAction, playerName, char: selectedChar, mode: 'ic'}),
      });
    }
    catch (err) {
      console.error("Erro ao falar com o Mestre:", err);
    }
    finally {
      setLoading(0);
    }
  };

  return (
    <aside className="roomBox">
      <header className="header">
        <h3 className='title3'>AVENTURA</h3>
      </header>

      <div className='adventure'>
        <div className="adventureLog">
          {disabled ? (
            <p>Configure o Mestre e o Mundo desta sala antes de começar.</p>
          ) : (log?.length ?? 0) === 0 ? (
            <p>O Mestre está aguardando você iniciar a jornada...</p>
          ) : (
            log?.map((entry, i) => (
              <div className='messageRow' key={i}>
                <p><span className="charTag">{entry.charName}</span>: {entry.text}</p>
              </div>
            ))
          )}
          {loading === 1 && <p style={{color: '#888'}}>Enviando mensagem...</p>}
          {loading === 2 && <p style={{color: '#888'}}>O Mestre está pensando...</p>}
          {loading === 3 && <p style={{color: '#888'}}>O Mestre está digitando...</p>}
          <div ref={endRef} />
        </div>

        <form onSubmit={handleSend} className="messageBox">
          <div className='charSelectorWrapper'>
            <select
              className="hiddenSelect"
              value={selectedChar?.id ?? ''}
              onChange={(e) => setSelectedChar(campaign.chars?.find((c) => c.id === Number(e.target.value)) || null)}
              disabled={disabled}
            >
              <option value="">-- Sem personagem --</option>
              {campaign.chars?.map((c) => (
                <option key={c.id} value={c.id}>{c.name} ({c.id})</option>
              ))}
            </select>
            <span className="charLabel">@{selectedChar ? selectedChar.name : ''}</span>
          </div>

          <textarea
            className="message"
            value={action}
            onChange={(e) => setAction(e.target.value)}
            placeholder={disabled ? "Sala não configurada..." : loading > 0 ? "Aguardando o Mestre..." : "Digite sua ação..."}
            rows={1}
            autoComplete="off"
            disabled={disabled || loading > 0}
          />
          <button type="submit" className="enter" disabled={disabled || loading > 0}></button>
        </form>
      </div>
    </aside>
  );
}