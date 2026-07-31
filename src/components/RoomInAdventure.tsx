// arquivo: componente da aventura (chat da aventura)
// local: src\components\RoomAdventure.tsx

'use client';
import {useState, useEffect, useRef} from 'react';
import type {CharacterWithDetails, RoomDetails} from '@/types/room';
import Master from './Master';
import Dice from './Dice';
import NPC from './NPC';

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
  const [playerName, setPlayerName] = useState('');
  const [selectedCharId, setSelectedCharId] = useState('');
  const [action, setAction] = useState('');
  const [log, setLog] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(0);
  const endRef = useRef<HTMLDivElement>(null);
  const [masterModal, setMasterModal] = useState(false);
  const [npcModal, setNPCModal] = useState<{npcName: string;} | null>(null);
  const [combatModal, setCombatModal] = useState<{dice: string} | null>(null);
  const [diceModal, setDiceModal] = useState<{dice: string} | null>(null);

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
        setLoading(data.loading);
        if (data.state) {
          if (data.state.id && data.state.category == 'CONVERSA') {
            setNPCModal({
              npcName: data.state.object || 'NPC'
            });
          }
          if (data.state.dice && typeof(data.state.dice)=='string') {
            setDiceModal({
              dice: data.state.dice || 'Nd20'
            });
          }
          
          else {
            setDiceModal(null);
            setNPCModal(null);
          }
        }
      }
      catch (err) {
        console.error("Erro ao buscar aventura:", err);
      }
    };

    fetchLog();
    const interval = setInterval(fetchLog, 3000);
    return () => clearInterval(interval);
  }, [roomId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({behavior: 'smooth'});
  }, [log]);

  const handleSend = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!action.trim() || loading || !selectedCharId) return;

    const playerAction = action.trim();
    setAction('');
    setLoading(1);

    try {
      const res = await fetch(`/api/room/${roomId}/adventure`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({action: playerAction, playerName, char: selectedChar, mode: 'ic'}),
      });
      const data = await res.json();
      if (data.state.category === 'CONVERSA') {
        setNPCModal({
          npcName: data.state.object || 'NPC'
        });
      }
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
        <button type="button" className="settings" onClick={() => setMasterModal(true)}></button>
      </header>

      <div className='adventure'>
        <div className="adventureLog">
          {log.length === 0 ? (
            <p>O Mestre está aguardando você iniciar a jornada...</p>
          ) : (
            log.map((entry) => (
            <div className='messageRow' key={entry.id}>
              <p key={entry.id}>
                <span className="charTag">{entry.charName}</span>: {entry.text}
              </p>
            </div>
            ))
          )}
          {loading == 1 && <p style={{color: '#888'}}>Enviando mensagem...</p>}
          {loading == 2 && <p style={{color: '#888'}}>O Mestre está pensando...</p>}
          {loading == 3 && <p style={{color: '#888'}}>O Mestre está digitando...</p>}
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
            placeholder={loading ? "Aguardando o Mestre..." : "Digite sua ação..."}
            rows={1}
            autoComplete="off"
            disabled={loading>0}
          />
          <button type="submit" className="enter" disabled={loading>0}></button>
        </form>        

        {masterModal && (
          <Master roomId={roomId} master={master} onClose={() => setMasterModal(false)} />
        )}

        {diceModal && (
          <Dice roomId={roomId} diceNotation={diceModal.dice} onClose={() => setNPCModal(null)}/>
        )}

        {npcModal && (
          <NPC roomId={roomId} npcName={npcModal.npcName} playerName={playerName} characters={characters} onClose={() => setNPCModal(null)}/>
        )}
      </div>
    </aside>
  );
}