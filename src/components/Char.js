'use client';
import {useState, useEffect} from 'react';

export default function Char({roomId, chars, charId, onClose}) {
  const [charData, setCharData] = useState({
    id: charId,
    name: '',
    age: '',
    race: '',
    class: '',
    status: [
      {name: 'FOR', value: 10},
      {name: 'DES', value: 10},
      {name: 'CON', value: 10}
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
            {name: 'FOR', value: 10},
            {name: 'DES', value: 10},
            {name: 'CON', value: 10}
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
        <h1 className='title2'>{h1}</h1>
        
        {/* Note o 'name' batendo exatamente com as chaves do seu charData */}
        <input name="name" placeholder="Nome" value={charData.name} onChange={handleChange} className="input" required />
        <input name="age" placeholder="Idade" value={charData.age} onChange={handleChange} className="input" required />
        <input name="race" placeholder="Raça" value={charData.race} onChange={handleChange} className="input" />
        <input name="class" placeholder="Classe" value={charData.class} onChange={handleChange} className="input" />
        
        <h3 className='title3'>Status</h3>
        {charData.status.map((st, index) => (
          <div key={index}>
            <label>{st.name}:</label>
            <input 
              type="number" 
              value={st.value} 
              onChange={(e) => handleStatusChange(index, 'value', parseInt(e.target.value) || 0)} 
              className="input"
            />
          </div>
        ))}
        
        <h3 className='title3'>Escreva a história do personagem</h3>
        <input name="historia" placeholder="Escreva a história do personagem..." value={charData.historia} onChange={handleChange} className="input" />

        <div className='buttonContainer'>
          <button type="button" className="button" onClick={onClose}>CANCELAR</button>
          <button type="submit" className="button">SALVAR</button>
        </div>
      </form>
    </section>
  );
}