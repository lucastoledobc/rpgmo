'use client';

import {useState} from 'react';
import {useRouter} from 'next/navigation';
import styles from '@/css/home.module.css';

export default function Home() {
  const [sala, setSala] = useState('');
  const [senha, setSenha] = useState('');
  const [mensagem, setMensagem] = useState({ text: '', type: '' });
  const router = useRouter();

  const handleEntrar = async (e: React.SubmitEvent) => {
    e.preventDefault();
    setMensagem({text: 'Verificando...', type: 'info'});

    const response = await fetch('/api/auth', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ id: sala.trim(), senha }),
    });

    const data = await response.json();

    if (response.ok) {
      router.push(`/room/${sala.trim()}`);
    }
    else {
      setMensagem({text: data.error, type: 'error'});
    }
  }

  return (
    <main className={styles.container}>
      <h1 className={styles.title}>RPG MO</h1>
      
      <div className={styles.rpgBox}>
        <form onSubmit={handleEntrar}>
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="sala">SALA</label>
            <input 
              type="text" 
              id="sala" 
              className={styles.input}
              value={sala}
              onChange={(e) => setSala(e.target.value)}
              placeholder="Código da sala"
              autoComplete="off"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="senha">SENHA</label>
            <input 
              type="password" 
              id="senha" 
              className={styles.input}
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="******"
            />
          </div>

          <div className={styles.buttonContainer}>
            <button type="submit" className={styles.button}>ENTRAR</button>
            <button type="button" className={styles.button} onClick={() => router.push('/create')}>CRIAR SALA</button>
          </div>

          {/* Caixa de Alertas Moderna */}
          {mensagem.text && (
            <div className={styles.alertBox} style={{ 
              marginTop: '1rem', 
              color: mensagem.type === 'error' ? '#ff4d4d' : '#fff',
              textAlign: 'center',
              border: '1px solid #fff',
              padding: '0.5rem'
            }}>
              {mensagem.text}
            </div>
          )}
        </form>
      </div>
    </main>
  );
}