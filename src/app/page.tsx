'use client';
import {useState} from 'react';
import {useRouter} from 'next/navigation';

export default function Home() {
  const [room, setRoom] = useState('');
  const [pass, setPass] = useState('');
  const [name, setName] = useState('');
  const [mensagem, setMensagem] = useState({text: '', type: ''});
  const router = useRouter();

  const login = async (e: React.SubmitEvent) => {
    e.preventDefault();
    setMensagem({text: 'Verificando...', type: 'info'});

    const response = await fetch('/api/auth', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({id: room, pass}),
    });

    const data = await response.json();

    if (response.ok) {
      sessionStorage.setItem('playerId', data.playerId);
      sessionStorage.setItem('playerName', name);
      router.push(`/room/${room}`);
    }
    else {
      setMensagem({text: data.error, type: 'error'});
    }
  }

  return (
    <div className="container">
      <h1 className="title">RPG MO</h1>
      
      <main className="rpgBox">
        <form onSubmit={login}>
          <div className="formGroup">
            <label className="label" htmlFor="room">Sala</label>
            <input 
              type="text" 
              id="room" 
              className="input"
              value={room}
              onChange={(e) => setRoom(e.target.value.trim().toLocaleUpperCase())}
              placeholder="Código da sala"
              autoComplete="off"
              required
            />
          </div>

          <div className="formGroup">
            <label className="label" htmlFor="pass">Senha</label>
            <input 
              type="password" 
              id="pass" 
              className="input"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              placeholder="******"
            />
          </div>
          
          <div className="formGroup">
            <label className="label" htmlFor="name">Jogador</label>
            <input 
              type="text" 
              id="name" 
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value.trim())}
              placeholder="Seu nome"
              autoComplete="off"
              required
            />
          </div>

          <div className="buttonContainer">
            <button type="submit" className="button">ENTRAR</button>
            <button type="button" className="button" onClick={() => router.push('/create')}>CRIAR SALA</button>
          </div>
        </form>
        {/* Caixa de Alertas */}
        {mensagem.text && (
          <div className="alertBox">
            {mensagem.text}
          </div>
        )}
      </main>
    </div>
  );
}