// arquivo: chat de bastidor com o mestre (perguntas fora do personagem)
// local: src\components\RoomOutAdventure.tsx

'use client';
import {useState, useEffect, useRef} from 'react';
import type {CharacterWithDetails} from '@/types/room';

interface OOCEntry {
  id: number;
  sender: string;
  charName: string | null;
  text: string;
  sentAt: string;
}

interface RoomOutAdventureProps {
  roomId: string;
  characters: CharacterWithDetails[];
}

export default function RoomOutAdventure({roomId, characters}: RoomOutAdventureProps) {
  const [log, setLog] = useState<OOCEntry[]>([]);
  const [question, setQuestion] = useState('');
  const [selectedCharId, setSelectedCharId] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [loadingIA, setLoadingIA] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const selectedChar = characters.find((c) => c.id === selectedCharId) ?? null;

  useEffect(() => {
    setPlayerName(localStorage.getItem('playerName') || 'Jogador');
  }, []);

  useEffect(() => {
    const fetchLog = async () => {
      try {
        const res = await fetch(`/api/room/${roomId}/adventure?type=oc`);
        const data = await res.json();
        if (data.log) setLog(data.log);
      }
      catch (err) {
        console.error("Erro ao buscar chat de bastidor:", err);
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
    if (!question.trim() || loadingIA) return;

    const playerQuestion = question.trim();
    setQuestion('');
    setLoadingIA(true);

    try {
      await fetch(`/api/room/${roomId}/adventure`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({action: playerQuestion, playerName, char: selectedChar, mode: 'oc'}),
      });
    }
    catch (err) {
      console.error("Erro ao perguntar ao Mestre:", err);
    }
    finally {
      setLoadingIA(false);
    }
  };

  return (
    <aside className="roomBox">
      <header className="header">
        <h3 className='title3'>FORA DE CENA</h3>
      </header>

      <div className='adventure'>
        <div className="adventureLog">
          {log.length === 0 ? (
            <p>Pergunte algo de bastidor ao Mestre, sem afetar a narrativa.</p>
          ) : (
            log.map((entry) => (
              <p key={entry.id}>
                <strong>{entry.charName ?? entry.sender}:</strong> {entry.text}
              </p>
            ))
          )}
          {loadingIA && <p style={{color: '#888'}}>O Mestre está verificando...</p>}
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
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={loadingIA ? "Aguardando..." : "Pergunte algo fora da cena..."}
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