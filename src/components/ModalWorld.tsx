// arquivo: modal de configuração do mundo da sala
// local: src\components\ModalWorld.tsx

'use client';
import {useState} from 'react';
import {useRouter} from 'next/navigation';
import type {Campaign} from '@/types/campaign';
import type {World} from '@/types/world';

interface ModalWorldProps {
  campaign: Campaign;
  onClose: () => void;
}

export default function ModalWorld({campaign, onClose}: ModalWorldProps) {
  const router = useRouter();
  const [templateId, setTemplateId] = useState(''); // '' = customizado (upload)
  const [uploadedWorld, setUploadedWorld] = useState<World | null>(null);
  const [fileName, setFileName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTemplateId(e.target.value);
    setUploadedWorld(null);
    setFileName('');
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const resultText = event.target?.result as string;
        const json = JSON.parse(resultText);

        if (!json.title || !json.rules) {
          setError('Livro inválido: precisa de "title" e "rules" no mínimo.');
          return;
        }

        setUploadedWorld(json);
        setFileName(file.name);
        setError('');
      }
      catch (err) {
        setError('Erro ao ler o livro — verifique se é um JSON válido.');
      }
    };
    reader.readAsText(file);
  };

  const handleSave = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!templateId && !uploadedWorld) {
      setError('Escolha um mundo pronto ou carregue um livro.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const response = await fetch(`/api/room/${campaign.room}/world`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(
          templateId ? {templateId: Number(templateId)} : {world: uploadedWorld}
        ),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Erro ao salvar o mundo.');
        return;
      }

      router.refresh();
      onClose();
    }
    catch (err) {
      setError('Erro ao salvar o mundo.');
    }
    finally {
      setSaving(false);
    }
  };

  return (
    <div className="modalBox">
      <div className="editBox">
        <h2 className='title3'>CONFIGURAR MUNDO</h2>

        <form onSubmit={handleSave}>
          <div className="formGroup">
            <label className="label">Sistema</label>
            <select className="input" value={templateId} onChange={handleTemplateChange}>
              <option value="1">Fantasia Medieval</option>
              <option value="2">Cyberpunk</option>
              <option value="3">Terror</option>
              <option value="">Personalizado (carregar livro)</option>
            </select>
          </div>

          {!templateId && (
            <div className="formGroup">
              <label className="label">Livro (.json)</label>
              <input type="file" accept=".json" onChange={handleFile} />
              {fileName && <p style={{fontSize: '0.8em', opacity: 0.7}}>Carregado: {fileName}</p>}
            </div>
          )}

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