'use client';
import {useState, useEffect} from 'react';

export default function Char({roomId, chars, charId, onClose}) {
  const [charData, setCharData] = useState({
    id: charId,
    nome: '',
    idade: '',
    raca: '',
    classe: '',
    status: [
      { nome: 'FOR', valor: 10 },
      { nome: 'DES', valor: 10 },
      { nome: 'CON', valor: 10 }
    ],
    historia: ''
  });

  // useEffect monitora o charId. Se for diferente de 'new', busca o personagem
  useEffect(() => {
    if (charId && charId !== 'new' && chars) {
      const foundChar = chars.find(c => c.id === charId);
      
      if (foundChar) {
        setCharData({
          id: foundChar.id,
          nome: foundChar.name || '',
          idade: foundChar.age || '',
          raca: foundChar.race || '',
          classe: foundChar.class || '',
          status: foundChar.status || [
            { nome: 'FOR', valor: 10 },
            { nome: 'DES', valor: 10 },
            { nome: 'CON', valor: 10 }
          ],
          historia: foundChar.history || ''
        });
      }
    }
  }, [charId, chars]);

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
    await fetch(`/api/room/${roomId}/char/edit`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(charData),
    });
    
    if (onClose) onClose(); 
  };

  let h1 = charId === 'new' || !charId ? "Criar Personagem" : "Editar Personagem";

  return (
    <section className='editBox'>
      <form className="roomBox" onSubmit={handleSubmit}>
        <h1>{h1}</h1>
        
        {/* Note o 'name' batendo exatamente com as chaves do seu charData */}
        <input name="nome" placeholder="Nome" value={charData.nome} onChange={handleChange} className="input" required />
        <input name="raca" placeholder="Raça" value={charData.raca} onChange={handleChange} className="input" />
        <input name="classe" placeholder="Classe" value={charData.classe} onChange={handleChange} className="input" />
        
        <h3>Status</h3>
        {charData.status.map((st, index) => (
          <div key={index} style={{ display: 'flex', gap: '5px', alignItems: 'center', marginBottom: '5px' }}>
            <label style={{ width: '50px' }}>{st.nome}:</label>
            <input 
              type="number" 
              value={st.valor} 
              onChange={(e) => handleStatusChange(index, 'valor', parseInt(e.target.value) || 0)} 
              className="input"
            />
          </div>
        ))}
        
        <input name="historia" placeholder="Escreva a história do personagem..." value={charData.historia} onChange={handleChange} className="input" />

        <div className='buttonContainer'>
          <button type="button" className="button" onClick={onClose}>CANCELAR</button>
          <button type="submit" className="button">SALVAR</button>
        </div>
      </form>
    </section>
  );
}