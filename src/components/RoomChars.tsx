// arquivo: acompanhamento de personagens da sala
// local: src\components\RoomChars.tsx

'use client';
import {useState, useEffect} from 'react';
import type {Campaign, Character} from '@/types/campaign';
import ModalChars from '@/components/ModalChars';

interface RoomCharsProps {
  campaign: Campaign;
}

export default function RoomChars({campaign}: RoomCharsProps) {
  const [selectedToAdd, setSelectedToAdd] = useState('');
  const [trackedIds, setTrackedIds] = useState<number[]>([]);
  const [editingChar, setEditingChar] = useState<Character | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const chars = campaign.chars ?? [];

  useEffect(() => {
    const saved = localStorage.getItem(`trackedChars_${campaign.room}`);
    if (saved) setTrackedIds(JSON.parse(saved));
  }, [campaign.room]);

  useEffect(() => {
    localStorage.setItem(`trackedChars_${campaign.room}`, JSON.stringify(trackedIds));
  }, [trackedIds, campaign.room]);

  const availableToSelect = chars.filter((c) => !trackedIds.includes(c.id));
  const trackedChars = chars.filter((c) => trackedIds.includes(c.id));

  const handleTrack = () => {
    if (!selectedToAdd) return;
    setTrackedIds((prev) => [...prev, Number(selectedToAdd)]);
    setSelectedToAdd('');
  };

  const handleUntrack = (id: number) => {
    setTrackedIds((prev) => prev.filter((trackedId) => trackedId !== id));
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
              <option key={c.id} value={c.id}>{c.name ?? `Personagem #${c.id}`}</option>
            ))}
          </select>
          <button type="button" className="button" onClick={handleTrack} disabled={!selectedToAdd}>
            ACOMPANHAR
          </button>
        </div>
      )}

      <div className="chars">
        {trackedChars.length === 0 ? (
          <p>Nenhum personagem sendo acompanhado ainda.</p>
        ) : (
          trackedChars.map((char) => (
            <div key={char.id} className="charCard">
              <p><strong>{char.name ?? `Personagem #${char.id}`}</strong> {char.role && `(${char.role})`}</p>
              {char.race && <p>{char.race}{char.age ? `, ${char.age} anos` : ''}</p>}

              <div className="stats">
                {char.status?.map((s) => (
                  <span key={s.id}>
                    {s.name}: {s.value}{s.max !== null ? `/${s.max}` : ''} <br />
                  </span>
                ))}
              </div>

              {char.items && char.items.length > 0 && (
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
                <button type="button" className="button" onClick={() => setEditingChar(char)}>Editar</button>
                <button type="button" className="button" onClick={() => handleUntrack(char.id)}>Remover da vista</button>
              </div>
            </div>
          ))
        )}
      </div>

      <button type="button" className="button" onClick={() => setIsCreating(true)}>CRIAR PERSONAGEM</button>

      {(isCreating || editingChar) && (
        <ModalChars
          campaign={campaign}
          existingChar={editingChar}
          onClose={() => {
            setIsCreating(false);
            setEditingChar(null);
          }}
        />
      )}
    </aside>
  );
}