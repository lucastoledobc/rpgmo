// arquivo: componente de criação de sala
// local: src\components\Create.tsx

'use client';
import {useState, useRef} from 'react';
import {useRouter} from 'next/navigation';
import type {Campaign} from '@/types/campaign';

export default function Create() {
  const router = useRouter();
  const campaignInputRef = useRef<HTMLInputElement>(null);
  const [alert, setAlert] = useState({text: '', type: ''});
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<Campaign>({
    room: '',
    title: '',
    pass: '',
    worldId: '1',
  });

  // atualiza os campos na tela
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const {name, value} = e.target;
    setFormData((prev) => ({...prev, [name]: value}));
  };

  // Carrega campanha antiga (upload pra continuar de onde parou)
  const handleCampaign = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setAlert({text: 'Nenhuma campanha selecionada.', type: 'error'});
      return;
    }

    setIsLoading(true);
    setAlert({text: 'Preenchendo dados a partir da campanha...', type: 'info'});

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const resultText = event.target?.result as string;
        const json: Campaign = JSON.parse(resultText);

        if (!json.title || !json.world) {
          setAlert({text: 'Campanha inválida ou incompleta.', type: 'error'});
          return;
        }

        setFormData((prev) => ({
          ...prev,
          ...json,
          master: {...prev.master, ...json.master}
        }));

        setAlert({text: 'Dados preenchidos. Confirme a senha antes de criar.', type: 'info'});
      }
      catch (err) {
        setAlert({text: 'Erro ao ler a campanha — verifique se é um JSON válido.', type: 'error'});
      }
      finally {
        setIsLoading(false);
      }
    };
    reader.readAsText(file);
  };

  // cria a sala
  const create = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();

    setIsLoading(true);
    setAlert({text: 'Criando a sala...', type: 'info'});

    try {
      const response = await fetch('/api/create', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        setFormData((prev) => ({...prev, room: result.room}));
        setAlert({text: 'Sala criada!', type: 'success'});
      }
      else {
        setAlert({text: result.error, type: 'error'});
      }
    }
    catch (error) {
      setAlert({text: 'Erro de conexão com o servidor.', type: 'error'});
    }
    finally {
      setIsLoading(false);
    }
  };

  // html da tela
  return (
    <div className="container">
      <h1 className="title">CRIAR AVENTURA</h1>

      <main className="rpgBox">
        <form onSubmit={create}>
          <section className='section'>
            <h2 className='title2'>SALA</h2>

            <div className="formGroup">
              <label className="label">Título da Aventura</label>
              <input type='text' name="title" className="input" value={formData.title ?? ''} onChange={handleChange} placeholder="Título da Aventura"/>
            </div>

            <div className="formGroup">
              <label className="label">Senha da Sala</label>
              <input type="password" name="pass" className="input" value={formData.pass ?? ''} onChange={handleChange} placeholder="******" required/>
            </div>
          </section>
          <hr />

          <section className='section'>
            <h2 className='title2'>MUNDO</h2>

            <div className="formGroup">
              <label className="label">Sistema</label>
              <select name="worldId" className="input" value={formData.worldId} onChange={handleChange}>
                <option value="1">Fantasia Medieval</option>
                <option value="2">Cyberpunk</option>
                <option value="3">Terror</option>
                <option value="">Personalizado / Decidir depois</option>
              </select>
            </div>
          </section>
          <hr />

          <div className="buttonContainer">
            <button type="button" className="button" onClick={() => campaignInputRef.current?.click()}>[CARREGAR CAMPANHA]</button>
            <input type="file" ref={campaignInputRef} onChange={handleCampaign} style={{display: 'none'}} accept=".json"/>

            <button type="submit" className="button" disabled={isLoading}>
              {isLoading ? 'ESPERE...' : 'CRIAR SALA'}
            </button>
          </div>
        </form>

        {alert.text && (
          <div className={`alertBox alertBox--${alert.type}`}>
            <h3 className='subTile'>{alert.text}</h3>
            {alert.type === "success" && (
              <>
                <p>ID da sala: <strong>{formData.room}</strong></p>
                <div className="buttonContainer">
                  <button className="button" onClick={() => navigator.clipboard.writeText(formData.room || '')}>COPIAR ID</button>
                  <button className="button" onClick={() => router.push(`/`)}>VOLTAR</button>
                </div>
                <h3 className='subTile'>Boa Aventura!</h3>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}