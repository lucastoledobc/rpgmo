'use client';
import { useState } from 'react';
import styles from '@/css/home.module.css';

export default function ConfigMestre({ roomId, initialConfig }) {
  const [config, setConfig] = useState(initialConfig || {
    chaveAPI: '',
    personalidade: ''
  });

  const salvarConfig = async () => {
    await fetch(`/api/room/${roomId}/config-mestre`, {
      method: 'POST',
      body: JSON.stringify(config),
    });
    alert("Mestre configurado com sucesso!");
  };

  return (
    <div className={styles.rpgBox}>
      <h3>CONFIGURAR MESTRE IA</h3>
      <input 
        type="password" 
        placeholder="Cole sua Chave da OpenAI aqui" 
        className={styles.input}
        value={config.chaveAPI}
        onChange={(e) => setConfig({...config, chaveAPI: e.target.value})}
      />
      <textarea 
        placeholder="Como o mestre deve se comportar?" 
        className={styles.input}
        value={config.personalidade}
        onChange={(e) => setConfig({...config, personalidade: e.target.value})}
      />
      <button className={styles.button} onClick={salvarConfig}>SALVAR MESTRE</button>
    </div>
  );
}