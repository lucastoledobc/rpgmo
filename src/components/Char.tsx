// arquivo: modal de criação/edição de personagem
// local: src\components\Char.tsx

'use client';
import {useState} from 'react';
import {useRouter} from 'next/navigation';
import type {CharacterWithDetails} from '@/types/room';

interface StatusRow {
  name: string;
  value: number;
  max: number | null;
  type: 'attribute' | 'resource';
}

interface ItemRow {
  name: string;
  slot: 'equip' | 'backpack';
  quantity: number;
}

interface CharProps {
  roomId: string;
  adveId: number;
  charId: string | null;
  existingChar: CharacterWithDetails | null;
  onClose: () => void;
}

const DEFAULT_STATUS: StatusRow[] = [
  {name: 'Força', value: 10, max: null, type: 'attribute'},
  {name: 'Destreza', value: 10, max: null, type: 'attribute'},
  {name: 'Inteligência', value: 10, max: null, type: 'attribute'},
];

export default function Char({roomId, adveId, charId, existingChar, onClose}: CharProps) {
  const router = useRouter();
  const isEditing = charId !== null;

  const [name, setName] = useState(existingChar?.name ?? '');
  const [age, setAge] = useState(existingChar?.age?.toString() ?? '');
  const [race, setRace] = useState(existingChar?.race ?? '');
  const [charClass, setCharClass] = useState(existingChar?.class ?? '');
  const [history, setHistory] = useState(existingChar?.history ?? '');
  const [status, setStatus] = useState<StatusRow[]>(existingChar?.status ?? DEFAULT_STATUS);
  const [items, setItems] = useState<ItemRow[]>(existingChar?.items ?? []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const updateStatus = (index: number, field: keyof StatusRow, value: string) => {
    setStatus((prev) => prev.map((s, i) => {
      if (i !== index) return s;
      if (field === 'value' || field === 'max') {
        return {...s, [field]: value === '' ? null : Number(value)};
      }
      return {...s, [field]: value};
    }));
  };

  const addStatus = () => setStatus((prev) => [...prev, {name: '', value: 0, max: null, type: 'attribute'}]);
  const removeStatus = (index: number) => setStatus((prev) => prev.filter((_, i) => i !== index));

  const updateItem = (index: number, field: keyof ItemRow, value: string) => {
    setItems((prev) => prev.map((it, i) => {
      if (i !== index) return it;
      if (field === 'quantity') return {...it, quantity: Number(value) || 1};
      return {...it, [field]: value};
    }));
  };

  const addItem = () => setItems((prev) => [...prev, {name: '', slot: 'backpack', quantity: 1}]);
  const removeItem = (index: number) => setItems((prev) => prev.filter((_, i) => i !== index));

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!isEditing && !name.trim()) {
      setError('O nome do personagem é obrigatório.');
      return;
    }

    setSaving(true);
    setError('');

    const payload = {
      charId,
      adveId,
      name: name || null,
      age: age ? Number(age) : null,
      race: race || null,
      class: charClass || null,
      history: history || null,
      status,
      items,
    };

    try {
      const response = await fetch(`/api/room/${roomId}/char`, {
        method: isEditing ? 'PUT' : 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Erro ao salvar personagem.');
        return;
      }

      router.refresh();
      onClose();
    }
    catch (err) {
      setError('Erro ao salvar personagem.');
    }
    finally {
      setSaving(false);
    }
  };

  return (
    <div className="modalBox">
      <div className="editBox">
        <h2 className='title3'>{isEditing ? `EDITAR: ${name}` : 'CRIAR PERSONAGEM'}</h2>

        <form onSubmit={handleSave}>
          <div className="formGroup">
            <label className="label">Nome</label>
            <input
              type="text"
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome do personagem"
            />
          </div>

          <div className="formGroup">
            <label className="label">Idade</label>
            <input type="number" className="input" value={age} onChange={(e) => setAge(e.target.value)} />
          </div>

          <div className="formGroup">
            <label className="label">Raça</label>
            <input type="text" className="input" value={race} onChange={(e) => setRace(e.target.value)} />
          </div>

          <div className="formGroup">
            <label className="label">Classe</label>
            <input type="text" className="input" value={charClass} onChange={(e) => setCharClass(e.target.value)} />
          </div>

          <div className="formGroup">
            <label className="label">História</label>
            <textarea className="input" rows={3} value={history} onChange={(e) => setHistory(e.target.value)} />
          </div>

          <hr />

          <div className="formGroup">
            <label className="label">Status</label>
            {status.map((s, i) => (
              <div key={i} className="dynamicRow">
                <input type="text" className="input" placeholder="Nome (ex: Força)" value={s.name} onChange={(e) => updateStatus(i, 'name', e.target.value)} />
                <input type="number" className="input" placeholder="Valor" value={s.value} onChange={(e) => updateStatus(i, 'value', e.target.value)} />
                <input type="number" className="input" placeholder="Máx (opcional)" value={s.max ?? ''} onChange={(e) => updateStatus(i, 'max', e.target.value)} />
                <select className="input" value={s.type} onChange={(e) => updateStatus(i, 'type', e.target.value)}>
                  <option value="attribute">Atributo</option>
                  <option value="resource">Recurso</option>
                </select>
                <button type="button" className="button" onClick={() => removeStatus(i)}>Remover</button>
              </div>
            ))}
            <button type="button" className="button" onClick={addStatus}>+ Adicionar Status</button>
          </div>

          <hr />

          <div className="formGroup">
            <label className="label">Itens</label>
            {items.map((it, i) => (
              <div key={i} className="dynamicRow">
                <input type="text" className="input" placeholder="Nome do item" value={it.name} onChange={(e) => updateItem(i, 'name', e.target.value)} />
                <select className="input" value={it.slot} onChange={(e) => updateItem(i, 'slot', e.target.value)}>
                  <option value="backpack">Mochila</option>
                  <option value="equip">Equipado</option>
                </select>
                <input type="number" className="input" placeholder="Qtd" value={it.quantity} onChange={(e) => updateItem(i, 'quantity', e.target.value)} />
                <button type="button" className="button" onClick={() => removeItem(i)}>Remover</button>
              </div>
            ))}
            <button type="button" className="button" onClick={addItem}>+ Adicionar Item</button>
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