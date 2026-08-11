// arquivo: modal de conversa contínua com um NPC
// local: src\components\NPC.tsx

'use client';
import {useState, useRef, useEffect} from 'react';
import type {Character} from '@/types/campaign';

interface ChatNPCProps {
  roomId: string;
  npcName: string;
  playerName: string;
  characters: Character[];
  onClose: () => void;
}

interface LocalMessage {
  from: 'player' | 'npc';
  text: string;
}

export default function NPC({roomId, npcName, playerName, characters, onClose}: ChatNPCProps) {
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [input, setInput] = useState('');
  const [selectedCharId, setSelectedCharId] = useState('');
  const [loading, setLoading] = useState(0);
  const endRef = useRef<HTMLDivElement>(null);

  const selectedChar = characters.find((c) => c.id === selectedCharId) ?? null;

  useEffect(() => {
    endRef.current?.scrollIntoView({behavior: 'smooth'});
  }, [messages]);

  const handleSend = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const message = input.trim();
    setInput('');
    setMessages((prev) => [...prev, {from: 'player', text: message}]);
    setLoading(1);

    try {
      const res = await fetch(`/api/room/${roomId}/adventure/npc`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({action: message, playerName, char: selectedChar, mode: 'npc'}),
      });
      const data = await res.json();

      if (!res.ok) {
        setMessages((prev) => [...prev, {from: 'npc', text: `[Erro: ${data.error}]`}]);
        return;
      }
      setMessages((prev) => [...prev, {from: 'npc', text: data.text}]);
    }
    catch {
      setMessages((prev) => [...prev, {from: 'npc', text: '[Erro ao conversar]'}]);
    }
    finally {
      setLoading(0);
    }
  };

  const handleClose = async () => {
    try {
      await fetch(`/api/room/${roomId}/adventure/npc`, {method: 'DELETE'});
    }
    finally {
      onClose();
    }
  };

  return (
    <div className="modalBox">
      <div className="editBox">
        <h2 className='title3'>Conversando com {npcName}</h2>

        <div className="adventureLog" style={{maxHeight: '300px', overflowY: 'auto'}}>
          {messages.map((m, i) => (
            <p key={i}><strong>{m.from === 'player' ? 'Você' : npcName}:</strong> {m.text}</p>
          ))}
          {loading && <p style={{color: '#888'}}>{npcName} está pensando...</p>}
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

          <input
            type="text"
            className="input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Digite sua fala..."
            disabled={loading>0}
          />
          <button type="submit" className="button" disabled={loading>0}>Enviar</button>
        </form>

        <div className="buttonContainer">
          <button type="button" className="button" onClick={handleClose}>Encerrar conversa</button>
        </div>
      </div>
    </div>
  );
}