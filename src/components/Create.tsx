// arquivo: componente de criação de sala
// local: src\components\Create.tsx

'use client';
import {useState, useRef} from 'react';
import {useRouter} from 'next/navigation';

interface FormDataState {
  room: {
    pass: string;
  };
  adventure: {
    title: string;
    worldId: number;
    state: any;
    context: any;
    timeline: any;
    createdAt: any | null;
  };
  world: number | any;
  master: {
    system: string;
    model: string;
    apiKey: string;
    personality: string;
  };
  chars: any[];
  charStatus: any[];
  charItems: any[];
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
    room: {
      pass: ''
    },
    adventure: {
      title: '',
      worldId: 1,
      state: '',
      context: '',
      timeline: '',
      createdAt: null
    },
    world: 1,
    master: {
      system: 'gemini',
      model: 'gemini-3.5-flash-lite',
      apiKey: '',
      personality: 'Mestre clássico de RPG, descritivo e justo.'
    },
    chars: [],
    charStatus: [],
    charItems: [],
    log: [],
    chat: []
  });

  // atualiza a escrita na tela
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const {name, value} = e.target;
    setFormData((prev) => ({...prev, [name]: value}));
  };

  // Carrega livro (upload de mundo personalizado)
  const handleBook = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setAlert({text: 'Nenhum livro selecionado.', type: 'error'});
      return;
    }

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
            adventure: {
              ...prev.adventure,
              worldId: 0
            },
            world: result,
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
    if (!file) {
      setAlert({text: 'Nenhuma aventura selecionada.', type: 'error'});
      return;
    }

    setAlert({text: 'Preenchendo dados a partir da aventura...', type: 'info'});

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const resultText = event.target?.result as string;
        const json = JSON.parse(resultText);

        setFormData((prev) => ({
          ...prev,
          room: {
            title: json.title,
            pass: json.pass
          },
          adventure: {
            title: json.title,
            worldId: 0,
            state: json.state,
            context: json.context,
            timeline: json.timeline,
            createdAt: json.createdAt,
          },
          world: json.world,
          chars: json.chars,
          charStatus: json.charStatus,
          charItems: json.charItems,
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
            <input type='text' name="title" className="input" value={formData.adventure.title} onChange={handleChange} placeholder="Título da Aventura" required/>
          </div>

          <div className="formGroup">
            <label className="label">Senha da Sala</label>
            <input type="password" name="pass" className="input" value={formData.room.pass} onChange={handleChange} placeholder="******" required/>
          </div>
        </section>
        <hr />

        <section className='section'>
          <h2 className='title2'>MUNDO</h2>

          <div className="formGroup">
            <label className="label">Sistema</label>
            <select name="world" className="input" value={formData.world} onChange={handleChange}>
              <option value="1">Fantasia Medieval</option>
              <option value="2">Cyberpunk</option>
              <option value="3">Terror</option>
              <option value="0">Personalizado (seu livro)</option>
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
            <select name="masterSystem" className="input" value={formData.master.system} onChange={handleChange}>
              <option value="gemini">Gemini</option>
              <option value="ollamaLocal">Ollama (local)</option>
              <option value="ollamaOnline">Ollama (online)</option>
              <option value="person">Pessoa</option>
            </select>
          </div>

          <div className="formGroup">
            <label className="label">Modelo</label>
            <input type='text' name="masterModel" className="input" value={formData.master.model} onChange={handleChange} placeholder={
              formData.master.system == 'gemini' ? "gemini-flash" : 
              formData.master.system == 'ollamaLocal' ? "qwen2.5:3b" : 
              formData.master.system == 'ollamaOnline' ? "gemma4:cloud" :
              formData.master.system == 'person' ? "nome do jogador" : ""}
            required/>
          </div>

          <div className="formGroup">
            <label className="label">{
            formData.master.system === 'gemini' ? 'API Key (Gemini)' : 
            formData.master.system === 'ollamaLocal' ? 'URL Local' : 
            formData.master.system === 'ollamaOnline' ? 'API Key (Ollama)' : ''}</label>
            <input type="password" name="masterKey" className="input" value={formData.master.apiKey} onChange={handleChange} placeholder={
              formData.master.system === 'gemini' ? '******' : 
              formData.master.system === 'ollamaLocal' ? 'http://127.0.0.1:11434' : 
              formData.master.system === 'ollamaOnline' ? '******' : ''} 
            />
          </div>

          <div className="formGroup">
            <label className="label">Personalidade</label>
            <input type='text' name="personality" className="input" value={formData.master.personality} onChange={handleChange} placeholder={"Mestre clássico de RPG, descritivo e justo."}/>
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
          <div className={`alertBox alertBox--${alert.type}`}>
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