// arquivo: modal de edição do mestre da sala
// local: src\components\ModalMaster.tsx

'use client';
import {useState} from 'react';
import {useRouter} from 'next/navigation';
import type {Campaign, Master} from '@/types/campaign';

interface MasterProps {
  campaign: Campaign;
  onClose: () => void;
}

export default function ModalMaster({campaign, onClose}: MasterProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<Master>({
    system: campaign.master?.system,
    model: campaign.master?.model,
    apiKey: '',
    url: campaign.master?.url,
    personality: campaign.master?.personality,
    contextSize: campaign.master?.contextSize ?? 4096,
    temperature: campaign.master?.temperature ?? 0.8,
    repeatPenalty: campaign.master?.repeatPenalty ?? 1.1,
    numPredict: campaign.master?.numPredict ?? 400,
  });

  const isOllama = formData.system === 'ollamaLocal' || formData.system === 'ollamaOnline';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const {name, value, type} = e.target;
    const numericFields = ['contextSize', 'temperature', 'repeatPenalty', 'numPredict'];
    setFormData((prev) => ({...prev, [name]: numericFields.includes(name) ? Number(value) : value}));
  };

  const getTemperatureLabel = (val: number) => {
    if (val <= 0.2) return "Determinista (Robótico)";
    if (val <= 0.6) return "Focado e Lógico";
    if (val <= 0.9) return "Normal";
    if (val <= 1.2) return "Muito Criativo";
    return "Criativo até demais (Instável)";
  };

  const getPenaltyLabel = (val: number) => {
    if (val < 1.0) return "Força Repetição (Ruim)";
    if (val === 1.0) return "Desativada (Padrão)";
    if (val <= 1.15) return "Variada / Ideal para RPG";
    if (val <= 1.3) return "Rígida (Evita clichês)";
    return "Extrema (Pode quebrar nomes e termos)";
  };

  const handleSave = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!formData.system) {
      setError('Escolha um sistema de IA.');
      return;
    }
    if (formData.system === 'gemini' && !formData.apiKey?.trim()) {
      setError('Configure uma chave de API do Gemini.');
      return;
    }
    // if (formData.system === 'ollamaLocal' && !formData.url?.trim()) {
    //   setError('Configure a URL do túnel do Ollama.');
    //   return;
    // }

    setSaving(true);
    setError('');

    try {
      const response = await fetch(`/api/room/${campaign.room}/master`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(formData),
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
            <select name="system" className="input" value={formData.system ?? ''} onChange={handleChange}>
              <option value="" disabled>-- Escolha --</option>
              <option value="gemini">Gemini</option>
              <option value="ollamaLocal">Ollama (local)</option>
              <option value="ollamaOnline">Ollama (online)</option>
            </select>
          </div>

          <div className="formGroup">
            <label className="label">Modelo</label>
            <input
              type="text"
              name="model"
              className="input"
              value={formData.model ?? ''}
              onChange={handleChange}
              placeholder={isOllama ? 'qwen2.5:3b' : 'gemini-3.5-flash'}
              required
            />
          </div>

          {formData.system === 'gemini' && (
            <div className="formGroup">
              <label className="label">Chave de API</label>
              <input
                type="apiKeyword"
                name="apiKey"
                className="input"
                value={formData.apiKey ?? ''}
                onChange={handleChange}
                placeholder={'se já salvou antes, não precisa colocar de novo.'}
              />
            </div>
          )}

          {formData.system === 'ollamaLocal' && (
            <div className="formGroup">
              <label className="label">URL do túnel</label>
              <input
                type="text"
                name="url"
                className="input"
                value={formData.url ?? ''}
                onChange={handleChange}
                placeholder='https://xxxx.ngrok-free.app'
              />
            </div>
          )}

          <div className="formGroup">
            <label className="label">Personalidade</label>
            <textarea
              name="personality"
              rows={3}
              className="input"
              value={formData.personality ?? ''}
              onChange={handleChange}
              placeholder="Mestre clássico de RPG, descritivo e justo."
            />
          </div>

          <hr />

          {isOllama && (
            <>
              <div className="formGroup">
                <div className="labelContainer">
                  <label className="label">Memória do Mestre</label>
                  <span className="tooltip-icon" data-tooltip="Tamanho do Contexto em Tokens."></span>
                </div>
                <select name="contextSize" className="input" value={formData.contextSize ?? 4096} onChange={handleChange}>
                  <option value={2048}>2048 - Leve</option>
                  <option value={4096}>4096 - Equilibrado</option>
                  <option value={8192}>8192 - Recomendado</option>
                  <option value={16384}>16384 - Ótimo</option>
                  <option value={32768}>32768 - Longo</option>
                  <option value={65536}>65536 - Muito Longo</option>
                  <option value={131072}>131072 - Máximo</option>
                </select>
              </div>

              <div className="formGroup">
                <div className="labelContainer">
                  <label className="label">Criatividade (Temperatura)</label>
                  <span className="tooltip-icon" data-tooltip="Valores altos trazem mais criatividade."></span>
                </div>
                <div className="sliderContainer">
                  <input type="range" name="temperature" min="0.0" max="1.5" step="0.05" className="input-range" value={formData.temperature ?? 0.8} onChange={handleChange}/>
                  <span className='label'>{formData.temperature} - {getTemperatureLabel(formData.temperature ?? 0.8)}</span>
                </div>
              </div>

              <div className="formGroup">
                <div className="labelContainer">
                  <label className="label">Penalidade de Repetição</label>
                  <span className="tooltip-icon" data-tooltip="Reduz respostas repetitivas."></span>
                </div>
                <div className="sliderContainer">
                  <input type="range" name="repeatPenalty" min="0.5" max="1.5" step="0.05" className="input-range" value={formData.repeatPenalty ?? 1.1} onChange={handleChange}/>
                  <span className='label'>{formData.repeatPenalty} - {getPenaltyLabel(formData.repeatPenalty ?? 1.1)}</span>
                </div>
              </div>

              <div className="formGroup">
                <div className="labelContainer">
                  <label className="label">Tamanho Máximo da Resposta</label>
                  <span className="tooltip-icon" data-tooltip="Controla o tamanho das falas do mestre."></span>
                </div>
                <input type="number" name="numPredict" className="input" value={formData.numPredict ?? 400} onChange={handleChange}/>
              </div>
            </>
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