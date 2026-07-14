// arquivo: componente de criação de sala
// local: src\components\Create.tsx

'use client';
import {useState, useRef} from 'react';
import {useRouter} from 'next/navigation';

interface FormDataState {
  title: string;
  pass: string;
  worldId: string;
  worldTitle: string;
  worldVersion: string;
  timeline: string;
  createdAt: string | null;
  masterSystem: string;
  masterModel: string;
  masterKey: string;
  personality: string;
  chars: any[];
  log: any[];
  chat: any[];
}

export default function Create() {
  const router = useRouter();
  const bookInputRef = useRef<HTMLInputElement>(null);
  const adventureInputRef = useRef<HTMLInputElement>(null);
  const [room, setRoom] = useState('');
  const [alert, setAlert] = useState({text: '', type: ''});
  const [formData, setFormData] = useState<FormDataState>({
    title: '',
    pass: '',
    worldId: '',
    worldTitle: '',
    worldVersion: '1.00',
    timeline: '',
    createdAt: null,
    masterSystem: 'ollama',
    masterModel: 'qwen2.5:3b',
    masterKey: '',
    personality: '',
    chars: [],
    log: [],
    chat: []
  });

  // atualiza a escrita na tela
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const {name, value} = e.target;
    setFormData((prev) => ({...prev, [name]: value}));
  };

  // Carrega livro (upload de mundo personalizado)
  const handleBook = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const resultText = event.target?.result as string;
        const json = JSON.parse(resultText);

        const uploadRes = await fetch('/api/create/book', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(json),
        });

        const result = await uploadRes.json();

        if (uploadRes.ok) {
          setFormData((prev) => ({
            ...prev,
            worldId: result.worldId,
            worldTitle: 'custom'
          }));
        }
        else {
          setAlert({text: result.error, type: 'error'});
        }
      }
      catch (err) {
        setAlert({text: 'Erro ao receber o livro.', type: 'error'});
      }
    };
    reader.readAsText(file);
  };

  // Carrega aventura antiga
  const handleJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAlert({text: 'Preenchendo dados a partir da aventura...', type: 'info'});

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const resultText = event.target?.result as string;
        const json = JSON.parse(resultText);

        setFormData((prev) => ({
          ...prev,
          title: json.title,
          worldTitle: json.worldTitle,
          worldVersion: json.worldVersion,
          timeline: json.timeline,
          createdAt: json.createdAt,
          chars: json.chars,
          log: json.log,
          chat: json.chat
        }));

        setAlert({text: 'Dados preenchidos. Confirme nome da sala e senha antes de criar.', type: 'info'});
      }
      catch (err) {
        setAlert({text: 'Erro ao receber a aventura.', type: 'error'});
      }
    };
    reader.readAsText(file);
  };

  // cria a sala
  const create = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();

    setAlert({text: 'Criando a sala...', type: 'info'});

    const response = await fetch('/api/create', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(formData),
    });

    const result = await response.json();

    if (response.ok) {
      setRoom(result.roomId);
      setAlert({text: 'Sala criada!', type: 'success'});
    } 
    else {
      setAlert({text: result.error, type: 'error'});
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
            <input type='text' name="title" className="input" value={formData.title} onChange={handleChange} placeholder="Título da Aventura" required/>
          </div>

          <div className="formGroup">
            <label className="label">Senha</label>
            <input type="password" name="pass" className="input" value={formData.pass} onChange={handleChange} placeholder="******" required/>
          </div>
        </section>
        <hr />

        <section className='section'>
          <h2 className='title2'>MUNDO</h2>

          <div className="formGroup">
            <label className="label">Sistema</label>
            <select name="worldTitle" className="input" value={formData.worldTitle} onChange={handleChange}>
              <option value="Fantasia Medieval">Fantasia Medieval</option>
              <option value="cyberpunk">Cyberpunk</option>
              <option value="terror">Terror</option>
              <option value="custom">Personalizado (seu sistema)</option>
            </select>
          </div>

          <div className="formGroup">
            <label className="label">Livro</label>
            <button type="button" className="button" onClick={() => bookInputRef.current?.click()}>[CARREGAR LIVRO]</button>
            <input type="file" ref={bookInputRef} onChange={handleBook} style={{display: 'none'}} accept=".json"/>
          </div>
        </section>
        <hr />

        <section className='section'>
          <h2 className='title2'>MESTRE</h2>

          <div className="formGroup">
            <label className="label">Sistema</label>
            <select name="masterSystem" className="input" value={formData.masterSystem} onChange={handleChange}>
              <option value="ollama">Ollama (local)</option>
              <option value="claude">Claude</option>
              <option value="gemini">Gemini</option>
              <option value="gpt">ChatGPT</option>
            </select>
          </div>

          <div className="formGroup">
            <label className="label">Modelo</label>
            <input type='text' name="masterModel" className="input" value={formData.masterModel} onChange={handleChange} placeholder="qwen2.5:3b / gemini-flash / gpt-o4" required/>
          </div>          

          <div className="formGroup">
            <label className="label">API Key</label>
            <input type="password" name="masterKey" className="input" value={formData.masterKey} onChange={handleChange} placeholder="Senha API da sua IA"/>
          </div>          

          <div className="formGroup">
            <label className="label">Personalidade</label>
            <input type='text' name="personality" className="input" value={formData.personality} onChange={handleChange} placeholder={"Mestre clássico de RPG, descritivo e justo."}/>
          </div>
        </section>
        <hr />

        <div className="buttonContainer">
          <button type="button" className="button" onClick={() => adventureInputRef.current?.click()}>[CARREGAR AVENTURA]</button>
          <input type="file" ref={adventureInputRef} onChange={handleJSON} style={{display: 'none'}} accept=".json"/>

          <button type="submit" className="button">CRIAR SALA</button>
        </div>
        </form>

        {alert.text && (
          <div className="alertBox">
            <h3 className='subTile'>{alert.text}</h3>
            {alert.type=="success" && (
            <>
            <p>ID da sala: <strong>{room}</strong></p>
            <div className="buttonContainer">
              <button className="button" onClick={() => navigator.clipboard.writeText(room)}>COPIAR ID</button>
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