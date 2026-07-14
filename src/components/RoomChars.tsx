// arquivo: componente de personagens da sala
// local: src\components\RoomChars.tsx

'use client';
import {useState, useEffect} from 'react';
import type {CharacterWithDetails} from '@/types/room';
import Char from './Char';

interface RoomCharsProps {
  roomId: string;
  adveId: number;
  characters: CharacterWithDetails[];
}

export default function RoomChars({roomId, adveId, characters}: RoomCharsProps) {
  const [selectedToAdd, setSelectedToAdd] = useState('');
  const [trackedIds, setTrackedIds] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCharId, setEditingCharId] = useState<string | null>(null);

  // carrega quais personagens o jogador estava acompanhando nessa sala
  useEffect(() => {
    const saved = localStorage.getItem(`trackedChars_${roomId}`);
    if (saved) setTrackedIds(JSON.parse(saved));
  }, [roomId]);

  // salva sempre que a lista de acompanhados mudar
  useEffect(() => {
    localStorage.setItem(`trackedChars_${roomId}`, JSON.stringify(trackedIds));
  }, [trackedIds, roomId]);

  const availableToSelect = characters.filter((c) => !trackedIds.includes(c.id));
  const trackedCharacters = characters.filter((c) => trackedIds.includes(c.id));

  const handleTrack = () => {
    if (!selectedToAdd) return;
    setTrackedIds((prev) => [...prev, selectedToAdd]);
    setSelectedToAdd('');
  };

  const handleUntrack = (charId: string) => {
    setTrackedIds((prev) => prev.filter((id) => id !== charId));
  };

  const handleEdit = (charId: string) => {
    setEditingCharId(charId);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditingCharId(null);
    setIsModalOpen(true);
  };

  return (
    <aside className="roomBox">
      <header className='header'>
        <h3 className='title3'>PERSONAGENS</h3>
      </header>

      {availableToSelect.length > 0 && (
        <div className="formGroup">
          <label className="label">Acompanhar personagem</label>
          <select className="input" value={selectedToAdd} onChange={(e) => setSelectedToAdd(e.target.value)}>
            <option value="">-- Selecione --</option>
            {availableToSelect.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <button type="button" className="button" onClick={handleTrack} disabled={!selectedToAdd}>
            ACOMPANHAR
          </button>
        </div>
      )}

      <div className="chars">
        {trackedCharacters.length === 0 ? (
          <p>Nenhum personagem sendo acompanhado ainda.</p>
        ) : (
          trackedCharacters.map((char) => (
            <div key={char.id} className="charCard">
              <p><strong>{char.name}</strong> {char.class && `(${char.class})`}</p>
              {char.race && <p>{char.race}{char.age ? `, ${char.age} anos` : ''}</p>}

              <div className="stats">
                {char.status.map((s) => (
                  <span key={s.id}>
                    {s.name}: {s.value}{s.max !== null ? `/${s.max}` : ''} <br />
                  </span>
                ))}
              </div>

              {char.items.length > 0 && (
                <div className="items">
                  <strong>Inventário:</strong>
                  {char.items.map((i) => (
                    <span key={i.id}>
                      {i.name} ({i.slot === 'equip' ? 'equipado' : 'mochila'}) x{i.quantity} <br />
                    </span>
                  ))}
                </div>
              )}

              <div className="buttonContainer">
                <button type="button" className="button" onClick={() => handleEdit(char.id)}>Editar</button>
                <button type="button" className="button" onClick={() => handleUntrack(char.id)}>Remover da vista</button>
              </div>
            </div>
          ))
        )}
      </div>

      <button type="button" className="button" onClick={handleCreate}>CRIAR PERSONAGEM</button>

      {isModalOpen && (
        <Char
          roomId={roomId}
          adveId={adveId}
          charId={editingCharId}
          existingChar={characters.find((c) => c.id === editingCharId) ?? null}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </aside>
  );
}