// arquivo: modal de combate
// local: src\components\ModalCombat.tsx

'use client';
import {useState, useRef, useEffect} from 'react';
import type {Campaign, Character} from '@/types/campaign';

interface ModalCombatProps {
  campaign: Campaign;
  playerName: string;
  onClose: () => void;
}

interface LocalMessage {
  from: 'player' | 'npc';
  text: string;
}

export default function ModalCombat({campaign, playerName, onClose}: ModalCombatProps) {
  const characters = campaign.chars ?? [];
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [input, setInput] = useState('');
  const [selectedCharId, setSelectedCharId] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const selectedChar = characters.find((c) => c.id === Number(selectedCharId)) ?? null;

  useEffect(() => {
    endRef.current?.scrollIntoView({behavior: 'smooth'});
  }, [messages]);

  const handleSend = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const message = input.trim();
    setInput('');
    setMessages((prev) => [...prev, {from: 'player', text: message}]);
    setLoading(true);

    try {
      const res = await fetch(`/api/room/${campaign.room}/adventure/combat`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({action: message, playerName, char: selectedChar, type: 'combat'}),
      });
      const data = await res.json();

      if (!res.ok) {
        setMessages((prev) => [...prev, {from: 'npc', text: `[Erro: ${data.error}]`}]);
        return;
      }
      setMessages((prev) => [...prev, {from: 'npc', text: data.text}]);
    }
    catch {
      setMessages((prev) => [...prev, {from: 'npc', text: '[Erro no combate]'}]);
    }
    finally {
      setLoading(false);
    }
  };

  const handleClose = async () => {
    try {
      await fetch(`/api/room/${campaign.room}/adventure/combat`, {method: 'DELETE'});
    }
    finally {
      onClose();
    }
  };

  return (
    <div className="modalBox">
      <div className="editBox">
        <h2 className='title3'>Hora do combate</h2>

        <div className="adventureLog" style={{maxHeight: '300px', overflowY: 'auto'}}>
          {messages.map((m, i) => (
            <p key={i}><strong>{m.from === 'player' ? 'Você' : 'Mestre'}:</strong> {m.text}</p>
          ))}
          {loading && <p style={{color: '#888'}}>Calculando o combate...</p>}
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
            <span className="charLabel">@{selectedChar ? selectedChar.name : ''}</span>
          </div>

          <input
            type="text"
            className="input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Descreva sua ação de combate..."
            disabled={loading}
          />
          <button type="submit" className="button" disabled={loading}>Enviar</button>
        </form>

        <div className="buttonContainer">
          <button type="button" className="button" onClick={handleClose}>Encerrar combate</button>
        </div>
      </div>
    </div>
  );
}