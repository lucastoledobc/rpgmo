'use client';
import {useState, useEffect} from 'react';
import {useRouter} from 'next/navigation';
import styles from '@/css/home.module.css';

export default function Char({roomId, charId}) {
  const router = useRouter();
  const [charData, setCharData] = useState({    
    id: charId,
    nome: '',
    idade: '',
    raca: '',
    classe: '',
    status: [
      { nome: 'Força', valor: 10, tipo: 'atributo' },
      { nome: 'HP', valor: 20, maximo: 20, tipo: 'recurso' }
    ],
    historia: ''
  });

  const handleChange = (e) => {
    const {name, value} = e.target;
    setCharData(prev => ({ ...prev, [name]: value }));
  };

  const handleStatusChange = (index, field, value) => {
    const newStatus = [...charData.status];
    newStatus[index][field] = value;
    setCharData(prev => ({ ...prev, status: newStatus }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await fetch(`/api/room/${roomId}/char`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(charData),
    });
    router.back();
  };

  let h1 = '';
  if(charId=='new'){h1="Criar Personagem"}else{h1="Editar Personagem"}

  return (
    <form className={styles.rpgBox} onSubmit={handleSubmit}>
      <h1>{h1}</h1>
      
      <input name="nome" placeholder="Nome" value={charData.nome} onChange={handleChange} className={styles.input} />
      <input name="raca" placeholder="Raça" value={charData.raca} onChange={handleChange} className={styles.input} />
      
      <h3>Status</h3>
      {charData.status.map((st, index) => (
        <div key={index} style={{ display: 'flex', gap: '5px' }}>
          <label>{st.nome}:</label>
          <input 
            type="number" 
            value={st.valor} 
            onChange={(e) => handleStatusChange(index, 'valor', parseInt(e.target.value))} 
            className={styles.input}
          />
        </div>
      ))}

      
      <input name="historia" placeholder="Escreva a história do personagem..." value={charData.historia} onChange={handleChange} className={styles.input} />

      <button type="submit" className={styles.button}>SALVAR</button>
      <button type="button" className={styles.button} onClick={() => router.back()}>CANCELAR</button>
    </form>
  );
}