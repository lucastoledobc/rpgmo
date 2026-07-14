// arquivo: modal de edição do mestre da sala
// local: src\components\Master.tsx

'use client';
import {useState} from 'react';
import {useRouter} from 'next/navigation';
import type {RoomDetails} from '@/types/room';

interface MasterProps {
  roomId: string;
  master: RoomDetails['master'];
  onClose: () => void;
}

export default function Master({roomId, master, onClose}: MasterProps) {
  const router = useRouter();

  const [model, setModel] = useState(master.model);
  const [personality, setPersonality] = useState(master.personality ?? '');
  const [contextSize, setContextSize] = useState(master.contextSize?.toString() ?? '4096');
  const [temperature, setTemperature] = useState(master.temperature?.toString() ?? '0.85');
  const [repeatPenalty, setRepeatPenalty] = useState(master.repeatPenalty?.toString() ?? '1.3');
  const [numPredict, setNumPredict] = useState(master.numPredict?.toString() ?? '400');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!model.trim()) {
      setError('O modelo é obrigatório.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const response = await fetch(`/api/room/${roomId}/master`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          model: model.trim(),
          personality: personality || null,
          contextSize: contextSize ? Number(contextSize) : null,
          temperature: temperature ? Number(temperature) : null,
          repeatPenalty: repeatPenalty ? Number(repeatPenalty) : null,
          numPredict: numPredict ? Number(numPredict) : null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Erro ao salvar o mestre.');
        return;
      }

      router.refresh();
      onClose();
    }
    catch (err) {
      setError('Erro ao salvar o mestre.');
    }
    finally {
      setSaving(false);
    }
  };

  return (
    <div className="modalBox">
      <div className="editBox">
        <h2 className='title3'>EDITAR MESTRE</h2>

        <form onSubmit={handleSave}>
          <div className="formGroup">
            <label className="label">Sistema</label>
            <input type="text" className="input" value={master.system} disabled />
          </div>

          <div className="formGroup">
            <label className="label">Modelo</label>
            <input
              type="text"
              className="input"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="qwen2.5:3b"
              required
            />
          </div>

          <div className="formGroup">
            <label className="label">Personalidade</label>
            <textarea
              className="input"
              rows={3}
              value={personality}
              onChange={(e) => setPersonality(e.target.value)}
              placeholder="Mestre clássico de RPG, descritivo e justo."
            />
          </div>

          <hr />

          <div className="formGroup">
            <label className="label">Tamanho do contexto (num_ctx)</label>
            <input type="number" className="input" value={contextSize} onChange={(e) => setContextSize(e.target.value)} />
          </div>

          <div className="formGroup">
            <label className="label">Criatividade (temperature)</label>
            <input type="number" step="0.05" min="0" max="2" className="input" value={temperature} onChange={(e) => setTemperature(e.target.value)} />
          </div>

          <div className="formGroup">
            <label className="label">Penalidade de repetição</label>
            <input type="number" step="0.05" min="0" className="input" value={repeatPenalty} onChange={(e) => setRepeatPenalty(e.target.value)} />
          </div>

          <div className="formGroup">
            <label className="label">Tamanho máximo da resposta (tokens)</label>
            <input type="number" className="input" value={numPredict} onChange={(e) => setNumPredict(e.target.value)} />
          </div>

          {error && <p className="alertBox">{error}</p>}

          <div className="buttonContainer">
            <button type="button" className="button" onClick={onClose}>Cancelar</button>
            <button type="submit" className="button" disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}