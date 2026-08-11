// arquivo: modal de edição do mestre da sala
// local: src\components\Master.tsx

'use client';
import {useState} from 'react';
import {useRouter} from 'next/navigation';
import type {Campaign, Master} from '@/types/campaign';

interface MasterProps {
  campaign: Campaign;
  onClose: () => void;
}

export default function Master({campaign, onClose}: MasterProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [pass, setPass] = useState('');
  const [formData, setFormData] = useState<Master>({
    system: campaign.master?.system,
    model: campaign.master?.model,
    modelImg: campaign.master?.modelImg,
    apiKey: campaign.master?.apiKey,
    url: campaign.master?.url,
    contextSize: campaign.master?.contextSize,
    temperature: campaign.master?.temperature,
    repeatPenalty: campaign.master?.repeatPenalty,
    numPredict: campaign.master?.numPredict,
    personality: campaign.master?.personality,
  });

  // atualiza a escrita na tela
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const {name, value} = e.target;
    setFormData((prev) => ({...prev, [name]: value}));
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

    if (formData.system === 'gemini' && !formData.apiKey && !pass.trim()) {
      setError('Esta sala ainda não tem uma chave de API do Gemini configurada.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const response = await fetch(`/api/room/${campaign.data?.room}/master`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({...formData, pass}),
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
            <select className="input" value={formData.system?.toString()} onChange={handleChange}>
              <option value="gemini">Gemini</option>
              <option value="ollamaLocal">Ollama (local)</option>
              <option value="ollamaOnline">Ollama (online)</option>
            </select>
          </div>

          <div className="formGroup">
            <label className="label">Modelo</label>
            <input
              type="text"
              className="input"
              value={formData.model?.toString()}
              onChange={handleChange}
              placeholder={formData.system === 'ollama' ? 'qwen2.5:3b' : 'gemini-3.5-flash'}
              required
            />
          </div>

          {formData.system !== 'ollamaLocal' && (
            <div className="formGroup">
              <label className="label">Chave de API</label>
              <input
                type="password"
                className="input"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                placeholder={formData.apiKey ? 'Chave já configurada — deixe em branco para manter' : 'Cole sua chave do Gemini'}
                required
              />
            </div>
          )}
          
          {formData.system === 'ollamaLocal' && (
            <div className="formGroup">
              <label className="label">Url</label>
              <input
                type="text"
                className="input"
                value={formData.url?.toString()}
                onChange={handleChange}
                placeholder='http://127.0.0.1:11434'
                required
              />
            </div>
          )}

          <div className="formGroup">
            <label className="label">Personalidade</label>
            <textarea
              rows={3}
              className="input"
              value={formData.personality?.toString()}
              onChange={handleChange}
              placeholder="Mestre clássico de RPG, descritivo e justo."
            />
          </div>

          <hr />

          {formData.system === 'ollama' && (
            <>
            <div className="formGroup">
              <div className="labelContainer">
                <label className="label">Memória do Mestre</label>
                <span className="tooltip-icon" data-tooltip="Tamanho do Contexto em Tokens. + Tokens = + Memória = + memória do seu PC."></span>
              </div>
              <select className="input" value={formData.contextSize ?? 2024} onChange={handleChange}>
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
                <span className="tooltip-icon" data-tooltip="Valores baixos deixam o mestre lógico e previsível. Valores altos (0.8 - 1.0) trazem mais criatividade e descrições ricas. Acima de 1.2 pode gerar respostas sem sentido."></span>
              </div>

              <div className="sliderContainer">
                <input type="range" min="0.0" max="1.5" step="0.05" className="input-range" value={formData.temperature ?? 0.8} onChange={handleChange}/>
                <span className='label'>{formData.temperature+" - "+getTemperatureLabel(formData.temperature ?? 0.8)}</span>
              </div>
            </div>

            <div className="formGroup">
              <div className="labelContainer">
                <label className="label">Penalidade de Repetição</label>
                <span className="tooltip-icon" data-tooltip="Valores ligeiramente acima de 1.0 (como 1.1) forçam o mestre a usar sinônimos e termos variados, impedindo que a narração fique repetitiva."></span>
              </div>

              <div className="sliderContainer">
                <input type="range" min="0.5" max="1.5" step="0.05" className="input-range"
                  value={formData.repeatPenalty ?? 1.1} onChange={handleChange}/>
                <span className='label'>{formData.repeatPenalty+" - "+getPenaltyLabel(formData.repeatPenalty ?? 1.1)}</span>
              </div>
            </div>

            <div className="formGroup">
              <div className="labelContainer">
                <label className="label">Tamanho Máximo da Resposta (num_predict)</label>
                <span className="tooltip-icon" data-tooltip="Controla o tamanho das falas do mestre. Valores equilibrados (300-400) evitam textos longos cansativos e mantêm o ritmo do jogo dinâmico."></span>
              </div>
              <input type="number" className="input" value={formData.numPredict ?? 400} onChange={handleChange}/>
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