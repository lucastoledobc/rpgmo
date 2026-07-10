"use client";
import {useState} from 'react';

export default function Master({roomId, config, onClose}) {
  const [mensagem, setMensagem] = useState({text: '', type: ''});
  const [formData, setFormData] = useState({
    system: config?.system || 'ollama',
    model: config?.model || '',
    contextSize: config?.contextSize || 4096,
    personality: config?.personality || ''
  });

  // Função genérica e segura para atualizar qualquer campo do formulário
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  // Função api
  const handleSave = async (e) => {
    e.preventDefault();
    setMensagem({text: 'Salvando...', type: 'info'});

    try {
      const res = await fetch(`/api/room/${roomId}/master`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || data.details || "Erro desconhecido no servidor.");
      
      setMensagem({text: data.message, type: 'success'});

      setTimeout(() => {
        if (onClose) onClose();
      }, 2000);
    }
    catch (error) {
      setMensagem({text: error.message, type: 'error'});
    }
  };

  return (
    <section className='modelBox'>
      <div className="rpgBox">
        <h2 className="title2">⚙️ Configurar Mestre IA</h2>
        
        <form onSubmit={handleSave}>
          {/* Sistema */}
          <div className="formGroup">
            <label className="label">Motor (Sistema) </label>
            <select 
              name="system"
              value={formData.system}
              onChange={handleChange}
              className="select"
            >
              <option value="ollama">Ollama (Local)</option>
              <option value="gemini">Google Gemini</option>
              <option value="claude">Anthropic Claude</option>
            </select>
          </div>

          {/* Modelo */}          
          < div className="formGroup">
            <label className="label">Modelo </label>
            <input 
              type="text"
              name='model'
              value={formData.model}
              onChange={handleChange}
              placeholder="Ex: llama3, qwen, gemma2:2b"
              className="label"
            />
            <p>
              Digite o nome exato do modelo (para Ollama, deve estar baixado no seu PC).
            </p>
          </div>

          {/* Tamanho de Contexto */}          
          <div className="formGroup">
          <label className="label">Tamanho de Contexto</label>
            <input 
              type="number" 
              name='contextSize'
              value={formData.contextSize} 
              onChange={handleChange}
              placeholder="Ex: 4096, 8192"
              className="label"
            />
          </div>

          {/* Personalidade */}          
          <div className="formGroup">
          <label className="label">Personalidade do Mestre </label>
          <textarea 
            name='personality'
            value={formData.personality} 
            onChange={handleChange}
            rows={3}
            className="texarea"
            placeholder="Ex: Sarcástico, focado em terror psicológico..."
          />
          </div>

          {/* Aqui entrarão os próximos inputs (Contexto, Temperatura, etc.) quando você quiser */}
          
          {/* Botões */}
          <div className="buttonContainer">
            <button type="button" className="button" onClick={onClose}>Cancelar</button>
            <button type="submit" className="button">Salvar</button>
          </div>
        </form>
        {mensagem.text && (
          <div className="alertBox">
            {mensagem.text}
          </div>
        )}
      </div>
    </section>
  );
}