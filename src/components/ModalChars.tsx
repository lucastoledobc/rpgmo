// arquivo: modal de criação/edição de personagem
// local: src\components\ModalChars.tsx

'use client';
import {useState} from 'react';
import {useRouter} from 'next/navigation';
import type {Campaign, Character, CharStatus, CharItems} from '@/types/campaign';

interface ModalCharsProps {
  campaign: Campaign;
  existingChar: Character | null;
  onClose: () => void;
}

type StatusRow = Omit<CharStatus, 'id'>;
type ItemRow = Omit<CharItems, 'id'>;

export default function ModalChars({campaign, existingChar, onClose}: ModalCharsProps) {
  const router = useRouter();
  const isEditing = existingChar !== null;

  const [name, setName] = useState(existingChar?.name ?? '');
  const [age, setAge] = useState(existingChar?.age?.toString() ?? '');
  const [race, setRace] = useState(existingChar?.race ?? '');
  const [role, setRole] = useState(existingChar?.role ?? '');
  const [appearance, setAppearance] = useState(existingChar?.appearance ?? '');
  const [history, setHistory] = useState(existingChar?.history ?? '');
  const [status, setStatus] = useState<StatusRow[]>(
    existingChar?.status?.map(({id, ...rest}) => rest) ?? []
  );
  const [items, setItems] = useState<ItemRow[]>(
    existingChar?.items?.map(({id, ...rest}) => rest) ?? []
  );
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

  const addStatus = () => setStatus((prev) => [...prev, {type: 'attribute', name: '', value: 0, max: null}]);
  const removeStatus = (index: number) => setStatus((prev) => prev.filter((_, i) => i !== index));

  const updateItem = (index: number, field: keyof ItemRow, value: string) => {
    setItems((prev) => prev.map((it, i) => {
      if (i !== index) return it;
      if (field === 'quantity') return {...it, quantity: Number(value) || 1};
      if (field === 'weight') return {...it, weight: value === '' ? null : Number(value)};
      return {...it, [field]: value};
    }));
  };

  const addItem = () => setItems((prev) => [...prev, {name: '', slot: 'backpack', quantity: 1, weight: null}]);
  const removeItem = (index: number) => setItems((prev) => prev.filter((_, i) => i !== index));

  const handleSave = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const payload = {
      id: existingChar?.id,
      name: name.trim() || null,
      age: age ? Number(age) : null,
      race: race || null,
      role: role || null,
      appearance: appearance || null,
      history: history || null,
      status,
      items,
    };

    try {
      const response = await fetch(`/api/room/${campaign.room}/char`, {
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
        <h2 className='title3'>{isEditing ? `EDITAR: ${name || 'Personagem'}` : 'CRIAR PERSONAGEM'}</h2>

        <form onSubmit={handleSave}>
          <div className="formGroup">
            <label className="label">Nome</label>
            <input type="text" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome do personagem"/>
          </div>

          <div className="formGroup">
            <label className="label">Idade</label>
            <input type="number" className="input" value={age} onChange={(e) => setAge(e.target.value)} placeholder="Idade (anos)"/>
          </div>

          <div className="formGroup">
            <label className="label">Raça</label>
            <input type="text" className="input" value={race} onChange={(e) => setRace(e.target.value)} placeholder="Homano, Orc, ..."/>
          </div>

          <div className="formGroup">
            <label className="label">Classe/Profissão</label>
            <input type="text" className="input" value={role} onChange={(e) => setRole(e.target.value)} placeholder="Guerreiro, Mago, ..."/>
          </div>

          <div className="formGroup">
            <label className="label">Aparência</label>
            <input type="text" className="input" value={appearance} onChange={(e) => setAppearance(e.target.value)} placeholder="1,80 m de altura, uma barba longa..."/>
          </div>

          <div className="formGroup">
            <label className="label">História</label>
            <textarea className="input" rows={3} value={history} onChange={(e) => setHistory(e.target.value)} placeholder="Criado na floresta por cães..."/>
          </div>

          <hr />

          <div className="formGroup">
            <label className="label">Status</label>
            {status.map((s, i) => (
              <div key={i} className="inputBox">
                <select className="input" value={s.type} onChange={(e) => updateStatus(i, 'type', e.target.value)}>
                  <option value="attribute">Atributo</option>
                  <option value="resource">Recurso</option>
                </select>
                <input type="text" className="input" placeholder="Nome (ex: Força)" value={s.name} onChange={(e) => updateStatus(i, 'name', e.target.value)}/>
                <input type="number" className="input" placeholder="Valor" value={s.value} onChange={(e) => updateStatus(i, 'value', e.target.value)}/>
                {s.type==='resource' && (
                <input type="number" className="input" placeholder="Máx" value={s.max ?? ''} onChange={(e) => updateStatus(i, 'max', e.target.value)}/>
                )}
                <button type="button" className="button" onClick={() => removeStatus(i)}>Remover</button>
              </div>
            ))}
            <button type="button" className="button" onClick={addStatus}>+ Adicionar Status</button>
          </div>

          <hr />

          <div className="formGroup">
            <label className="label">Itens</label>
            {items.map((it, i) => (
              <div key={i} className="inputBox">
                <input type="text" className="input" placeholder="Nome do item" value={it.name} onChange={(e) => updateItem(i, 'name', e.target.value)} />
                <select className="input" value={it.slot} onChange={(e) => updateItem(i, 'slot', e.target.value)}>
                  <option value="equip">Equipado</option>
                  <option value="backpack">Mochila</option>
                </select>
                <input type="number" className="input" placeholder="Qtd" value={it.quantity} onChange={(e) => updateItem(i, 'quantity', e.target.value)} />
                <input type="number" className="input" placeholder="Peso" value={it.weight ?? ''} onChange={(e) => updateItem(i, 'weight', e.target.value)} />
                <button type="button" className="button" onClick={() => removeItem(i)}>Remover</button>
              </div>
            ))}
            <button type="button" className="button" onClick={addItem}>+ Adicionar Item</button>
          </div>

          {error && <p className="alertBox alertBox--error">{error}</p>}

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