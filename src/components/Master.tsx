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

  const [system, setSystem] = useState(master.system);
  const [model, setModel] = useState(master.model);
  const [personality, setPersonality] = useState(master.personality ?? '');
  const [contextSize, setContextSize] = useState(master.contextSize?.toString() ?? '4096');
  const [temperature, setTemperature] = useState(master.temperature?.toString() ?? '0.85');
  const [repeatPenalty, setRepeatPenalty] = useState(master.repeatPenalty?.toString() ?? '1.1');
  const [numPredict, setNumPredict] = useState(master.numPredict?.toString() ?? '400');
  const [apiKey, setApiKey] = useState(''); // sempre começa vazio — nunca pré-preenchemos segredo

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const getTemperatureLabel = (val: string) => {
    const num = parseFloat(val);
    if (num <= 0.2) return "Determinista (Robótico)";
    if (num <= 0.6) return "Focado e Lógico";
    if (num <= 0.9) return "Normal";
    if (num <= 1.2) return "Muito Criativo";
    return "Criativo até demais (Instável)";
  };

  const getPenaltyLabel = (val: string) => {
    const num = parseFloat(val);
    if (num < 1.0) return "Força Repetição (Ruim)";
    if (num === 1.0) return "Desativada (Padrão)";
    if (num <= 1.15) return "Variada / Ideal para RPG";
    if (num <= 1.3) return "Rígida (Evita clichês)";
    return "Extrema (Pode quebrar nomes e termos)";
  };

  const handleSave = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!model.trim()) {
      setError('O modelo é obrigatório.');
      return;
    }

    if (system === 'gemini' && !master.hasApiKey && !apiKey.trim()) {
      setError('Esta sala ainda não tem uma chave de API do Gemini configurada.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const response = await fetch(`/api/room/${roomId}/master`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          system,
          model: model.trim(),
          personality: personality || null,
          apiKey: apiKey.trim() || undefined, // undefined = "não mexer na chave já salva"
          ...(system === 'ollama' ? {
            contextSize: contextSize ? Number(contextSize) : null,
            repeatPenalty: repeatPenalty ? Number(repeatPenalty) : null,
            numPredict: numPredict ? Number(numPredict) : null,
          } : {}),
          temperature: temperature ? Number(temperature) : null,
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
            <select className="input" value={system} onChange={(e) => setSystem(e.target.value)}>
              <option value="ollama">Ollama (local)</option>
              <option value="gemini">Gemini</option>
            </select>
          </div>

          <div className="formGroup">
            <label className="label">Modelo</label>
            <input
              type="text"
              className="input"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder={system === 'ollama' ? 'qwen2.5:3b' : 'gemini-3.5-flash'}
              required
            />
          </div>

          {system === 'gemini' && (
            <div className="formGroup">
              <label className="label">Chave de API</label>
              <input
                type="password"
                className="input"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={master.hasApiKey ? 'Chave já configurada — deixe em branco para manter' : 'Cole sua chave do Gemini'}
              />
            </div>
          )}

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

          {system === 'ollama' && (
            <div className="formGroup">
              <div className="labelContainer">
                <label className="label">Memória do Mestre</label>
                <span className="tooltip-icon" data-tooltip="Tamanho do Contexto em Tokens. + Tokens = + Memória = + memória do seu PC."></span>
              </div>
              <select className="input" value={contextSize} onChange={(e) => setContextSize(e.target.value)}>
                <option value={2048}>2048 - Leve</option>
                <option value={4096}>4096 - Equilibrado</option>
                <option value={8192}>8192 - Recomendado</option>
                <option value={16384}>16384 - Ótimo</option>
                <option value={32768}>32768 - Longo</option>
                <option value={65536}>65536 - Muito Longo</option>
                <option value={131072}>131072 - Máximo</option>
              </select>
            </div>
          )}

          <div className="formGroup">
            <div className="labelContainer">
              <label className="label">Criatividade (Temperatura)</label>
              <span className="tooltip-icon" data-tooltip="Valores baixos deixam o mestre lógico e previsível. Valores altos (0.8 - 1.0) trazem mais criatividade e descrições ricas. Acima de 1.2 pode gerar respostas sem sentido."></span>
            </div>

            <div className="sliderContainer">
              <input type="range" min="0.0" max="1.5" step="0.05" className="input-range" value={temperature} onChange={(e) => setTemperature(e.target.value)}/>
              <span className='label'>{temperature+" - "+getTemperatureLabel(temperature)}</span>
            </div>
          </div>

          {system === 'ollama' && (
            <>
              <div className="formGroup">
                <div className="labelContainer">
                  <label className="label">Penalidade de Repetição</label>
                  <span className="tooltip-icon" data-tooltip="Valores ligeiramente acima de 1.0 (como 1.1) forçam o mestre a usar sinônimos e termos variados, impedindo que a narração fique repetitiva."></span>
                </div>

                <div className="sliderContainer">
                  <input type="range" min="0.5" max="1.5" step="0.05" className="input-range"
                    value={repeatPenalty} onChange={(e) => setRepeatPenalty(e.target.value)}/>
                  <span className='label'>{repeatPenalty+" - "+getPenaltyLabel(repeatPenalty)}</span>
                </div>
              </div>

              <div className="formGroup">
                <div className="labelContainer">
                  <label className="label">Tamanho Máximo da Resposta (num_predict)</label>
                  <span className="tooltip-icon" data-tooltip="Controla o tamanho das falas do mestre. Valores equilibrados (300-400) evitam textos longos cansativos e mantêm o ritmo do jogo dinâmico."></span>
                </div>
                <input type="number" className="input" value={numPredict} onChange={(e) => setNumPredict(e.target.value)} />
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