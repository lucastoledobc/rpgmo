'use client';
import {useState, useEffect} from 'react';
import Char from './Char';

export default function RoomChars({roomId, chars: initialChars}) {
  const [charId, setCharId] = useState('');
  const [playerId, setPlayerId] = useState('');
  const [roomChars, setRoomChars] = useState(initialChars || []);
  const [selectedId, setSelectedId] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const savedId = sessionStorage.getItem('playerId');
    if (savedId) setPlayerId(savedId);
  }, []);

  const myChars = roomChars.filter(char => char.player === playerId);
  const availableChars = roomChars.filter(char => !char.player);

  const handleSelectSubmit = async (e) => {
    e.preventDefault();
    if (!selectedId) return;

    setRoomChars(prev => prev.map(char => 
      char.id === selectedId ? { ...char, player: playerId } : char
    ));

    setSelectedId('');
  };

  // Função auxiliar para abrir o modal no modo Edição
  const handleEditClick = (id) => {
    setCharId(id);
    setIsModalOpen(true);
  };

  // Função auxiliar para abrir o modal no modo Criação
  const handleCreateClick = () => {
    setCharId('new');
    setIsModalOpen(true);
  };

  return (
    <aside className="roomBox">
      <header className='header'>
        <h3 className='title3'>PERSONAGENS</h3>
      </header>

      <div className="chars">
        {/* Renderiza os MEUS personagens selecionados */}
        {myChars.length > 0 ? (
          myChars.map((char) => (
            <div key={char.id} className="charCard">
              <p>
                {char.name} ({char.class || char.classe})
              </p>
              
              {/* Exibição dos Status */}
              <div className="stats">
                {char.status?.map((s) => (
                  <span key={s.name}>
                    {s.name}: {s.value || s.valor} <br />
                  </span>
                ))}
              </div>

              {/* Botão de Editar movido para o escopo correto (do personagem) */}
              <button 
                type="button"
                className="button"
                onClick={() => handleEditClick(char.id)}
              >
                Editar
              </button>
            </div>
          ))
        ) : (
          <p>Nenhum personagem selecionado.</p>
        )}
      
        {/* Caixa de Seleção de personagens disponíveis */}
        {availableChars.length > 0 && (
          <div className='charCard'>
            <form onSubmit={handleSelectSubmit}>
              <label className="label">Escolha seu Personagem</label>
              <select 
                className="input" 
                value={selectedId} 
                onChange={(e) => setSelectedId(e.target.value)}
                required
              >
                <option>-- Selecione --</option>
                {availableChars.map((char) => (
                  <option key={char.id} value={char.id}>{char.name} ({char.id})</option>              
                ))}
              </select>
              <button type='submit' className="button">Vincular</button>
            </form>
          </div>
        )}

        <button className="button" onClick={handleCreateClick}>CRIAR NOVO</button>

        {isModalOpen && (
          <Char onClose={() => setIsModalOpen(false)} roomId={roomId} charId={charId} chars={roomChars}/>
        )}
      </div>
    </aside>
  );
}