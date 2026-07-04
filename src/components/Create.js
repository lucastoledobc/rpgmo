'use client';
import {useState, useRef} from 'react';
import {useRouter} from 'next/navigation';

export default function Create() {
  const [room, setRoom] = useState(null);
  const [data, setData] = useState(null);
  const [alert, setAlert] = useState({text: '', type: ''});
  const fileInputRef = useRef(null);
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    pass: '',
    date: '',
    book: null,
    worldId: '',
    worldHistory: '',
    worldRules: '',
    worldCustom: '',
    masterId: '',
    apikey: '',
    personality: ''
  });
  
  // Gera um ID de 12 dígitos
  const gerarId = () => {
    return Array.from({length: 12}, () => 
      "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"[Math.floor(Math.random() * 36)]
    ).join('');
  };

  // Carrega livro 
  const handleBook = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target.result);

        const uploadRes = await fetch('/api/create/book', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(json),
        });
        
        if (uploadRes.ok) {
          const dadosSala = {
            name: json.name,
            worldId: "personalizado",
            book: file
          };
          setFormData(dadosSala);
        }
      }
      catch (err) {
        alert("Erro ao processar o arquivo.");
      }
    };
    reader.readAsText(file);
  };

  // Carrega aventura antiga
  const handleJSON = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target.result);
        setData(json);
      }
      catch (err) {
        alert("Erro ao ler o arquivo JSON.");
      }
    };
    reader.readAsText(file);
  };

  // Função para enviar ao backend
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    let newId = gerarId();
    let sucesso = false;

    // Tentativa de criar
    while (!sucesso) {
      let payload = {formData, newId, data};
      const response = await fetch('/api/create', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload),
      });
      const result = await response.json();

      if (response.ok) {
        setRoom(newId);
        sucesso = true;
        setAlert({text: result.success, type: 'success'});
      }
      else if (response.status == 409) {
        newId = gerarId(); // Gera novo ID e tenta o loop de novo
      }
      else {
        setAlert({text: result.error, type: 'error'});
        break;
      }
    }
  };


  // atualiza a escrita na tela
  const handleChange = (e) => {
    const {name, value} = e.target;
    setFormData((prev) => ({...prev, [name]: value}));
  };
  
  // html da tela
  return (
    <div className="container">
      <h1 className="title">CRIAR AVENTURA</h1>
      
      <main className="rpgBox">
        <form onSubmit={handleSubmit}>
        <section>
          <h2 className='subTitle'>SALA</h2>

          <div className="formGroup">
            <label className="label">Nome</label>
            <input name="name" className="input" value={formData.name} onChange={handleChange} placeholder="Nome da Sala" required/>
          </div>
          
          <div className="formGroup">
            <label className="label">Senha</label>
            <input name="pass" type="password" className="input" value={formData.pass} onChange={handleChange} placeholder="******" required/>
          </div>
        </section>
        <hr />
        
        <section>
          <h2 className='subTitle'>MUNDO</h2>

          <div className="formGroup">
            <label className="label">Sistema</label>
            <select name="worldId" className="input" value={formData.worldId} onChange={handleChange}>
              <option>Fantasia Medieval</option>
              <option>Cyberpunk</option>
              <option>Terror</option>
              <option>Personalizado (Livro ou crie você)</option>
            </select>
          </div>
          
          <div className="formGroup">
            <label className="label">Livro</label>
            <button type="button" className="button" onClick={() => fileInputRef.current.click()}>[CARREGAR LIVRO]</button>
              <input type="file" ref={fileInputRef} onChange={handleBook} style={{display: 'none'}} accept=".json"/>
          </div>

          <div className="formGroup">
            <label className="label">Personalização</label>
            <textarea name="worldCustom" className="input" rows={4} value={formData.worldCustom} onChange={handleChange} placeholder={"Coloque detalhes pessoais: \nTodos dados são d6... \nOs desertos são diamantes... \n\nOu crie do zero: Era uma vez..."}/>
          </div>
          </section>
          <hr />

        <section>
          <h2 className='subTitle'>MESTRE</h2>

          <div className="formGroup">
            <label className="label">Sistema</label>
            <select name="masterId" className="input" value={formData.masterId} onChange={handleChange}>
              <option>gpt-o4</option>
              <option>Gemini-Flash-3</option>
              <option>Claude-Fable</option>
              <option>Personalizado</option>
            </select>
          </div>
          
          <div className="formGroup">
            <label className="label">Chave API</label>
            <input 
              name="apikey" 
              type="password" 
              className="input" 
              value={formData.apikey} 
              onChange={handleChange}
              placeholder="******"
              required
              />
          </div>
          <div className="formGroup">
            <label className="label">Personalidade</label>
            <textarea name="personality" className="input" rows={4} value={formData.personality} onChange={handleChange} placeholder='Mestre clássico de RPG, descritivo e justo.'/>
          </div>
          </section>
          <hr />

          <div className="buttonContainer">
            <button type="button" className="button" onClick={() => fileInputRef.current.click()}>[CARREGAR AVENTURA]</button>
              <input type="file" ref={fileInputRef} onChange={handleJSON} style={{display: 'none'}} accept=".json"/>
            <button type="submit" className="button">CRIAR SALA</button>
          </div>
        </form>
        {alert.text && (
          <div className="">
            {alert.text}
            {alert.type=="success" && (
            <>
            <p>ID da sala: <strong>{room}</strong></p>
            <div className="buttonContainer">
              <button className="button" onClick={() => navigator.clipboard.writeText(room)}>COPIAR ID</button>
              <button className="button" onClick={() => router.push(`/`)}>VOLTAR</button>
              <p>Boa Aventura!</p>
            </div>
            </>
          )}
          </div>
        )}
      </main>
    </div>
  );
}