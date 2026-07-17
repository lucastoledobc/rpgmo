// arquivo: tela de login
// local: src\app\page.tsx

'use client';
import {useState} from 'react';
import {useRouter} from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [alert, setAlert] = useState({text: '', type: ''});
  const [formData, setFormData] = useState({
    room: '',
    pass: '',
    playerName: ''
  });

  // atualiza a escrita na tela
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const {name, value} = e.target;
    const finalValue = name === 'room' ? value.trim().toUpperCase() : value;
    setFormData((prev) => ({...prev, [name]: finalValue}));
  };
  
  // login
  const login = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAlert({text: 'Verificando...', type: 'info'});

    const response = await fetch('/api/auth', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(formData),
    });

    const result = await response.json();

    if (response.ok) {
      localStorage.setItem('playerName', formData.playerName);
      router.push(`/room/${formData.room}`);
    }
    else {
      setAlert({text: result.error, type: 'error'});
    }
  }

  // página html
  return (
    <div className="container">
      <h1 className="title">RPG MO</h1>
      
      <main className="rpgBox">
        <form onSubmit={login}>
          <div className="formGroup">
            <label className="label" htmlFor="room">Sala</label>
            <input 
              type="text" 
              name="room"
              className="input"
              value={formData.room}
              onChange={handleChange}
              placeholder="Código da sala"
              autoComplete="off"
              required
            />
          </div>

          <div className="formGroup">
            <label className="label" htmlFor="pass">Senha</label>
            <input 
              type="password" 
              name="pass" 
              className="input"
              value={formData.pass}
              onChange={handleChange}
              placeholder="******"
              required
            />
          </div>
          
          <div className="formGroup">
            <label className="label" htmlFor="playerName">Jogador</label>
            <input 
              type="text" 
              name="playerName"
              className="input"
              value={formData.playerName}
              onChange={handleChange}
              placeholder="Seu nome"
              autoComplete="off"
              required
            />
          </div>

          <div className="buttonContainer">
            <button type="button" className="button" onClick={() => router.push('/create')}>CRIAR SALA</button>
            <button type="submit" className="button">ENTRAR</button>
          </div>
        </form>
        {/* Caixa de Alertas */}
        {alert.text && (
          <div className={`alertBox alertBox--${alert.type}`}>
            {alert.text}
          </div>
        )}
      </main>
    </div>
  );
}