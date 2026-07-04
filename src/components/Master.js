'use client';
import {useState} from 'react';
import styles from '@/css/home.module.css';

export default function ConfigMestre({roomId}) {
  const [config, setConfig] = useState({
    AI: '',
    chaveAPI: '',
    personalidade: ''
  });

  const salvarConfig = async () => {
    await fetch(`/api/room/${roomId}/chatAI`, {
      method: 'POST',
      body: JSON.stringify(config),
    });
    alert("Mestre configurado com sucesso!");
  };

  return (
    <main className={styles.rpgBox}>
      <h3>CONFIGURAR MESTRE IA</h3>
      <label className={styles.label} htmlFor="sala">IA</label>
      <input 
        type="text" 
        id="sala" 
        className={styles.input}
        value={config.AI}
        onChange={(e) => setConfig({...config, AI: e.target.value})}
        placeholder="gpt-4o / Gemini-Flash"
        autoComplete="off"
        required
      />
      <label className={styles.label} htmlFor="senha">IA</label>
      <input 
        type="password" 
        id="senha" 
        placeholder="Cole sua Chave aqui" 
        className={styles.input}
        value={config.chaveAPI}
        onChange={(e) => setConfig({...config, chaveAPI: e.target.value})}
      />
      <label className={styles.label} htmlFor="text">Personalidade</label>
      <textarea 
        id="text" 
        placeholder="Como o mestre deve se comportar?" 
        className={styles.input}
        value={config.personalidade}
        onChange={(e) => setConfig({...config, personalidade: e.target.value})}
      />
      <button className={styles.button} onClick={salvarConfig}>SALVAR MESTRE</button>
    </main>
  );
}