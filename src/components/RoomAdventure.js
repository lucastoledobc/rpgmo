'use client';
import {useState, useEffect, useRef} from 'react';
import Master from './Master.js';

export default function RoomAdventure({roomData}) {
  const [showMasterConfig, setShowMasterConfig] = useState(false);
  const [adventureLog, setAdventureLog] = useState([]);
  const [selectedCharId, setSelectedCharId] = useState('');
  const [action, setAction] = useState('');
  const [loadingIA, setLoadingIA] = useState(false);
  const advEndRef = useRef(null);

  // Polling para atualizar o texto da aventura a cada 3 segundos
  useEffect(() => { 
  const fetchAdventure = async () => {
    try {
      // Busca os dados mais recentes do servidor
      const response = await fetch(`/api/room/${roomData.room.id}`);
      const updatedData = await response.json();
      
      // 2. Atualiza o estado com o log fresco que veio do fetch
      if (updatedData.log) {
        setAdventureLog(updatedData.log);
      }
    }
    catch (err) {
      console.error("Erro ao atualizar log:", err);
    }
  };

    // Executa uma vez logo ao montar
    fetchAdventure();
    
    // Intervalo para atualizar a cada 3 segundos
    const interval = setInterval(fetchAdventure, 10000);
    
    return () => clearInterval(interval);
  }, [roomData.room.id]);

  useEffect(() => {
    advEndRef.current?.scrollIntoView({behavior: 'smooth'});
  }, [adventureLog]);


  const handleSendAction = async (e) => {
    e.preventDefault();
    if (!selectedCharId || action.trim() == '') {setAction(''); return;}
    const selectedChar = roomData.chars.find(c => c.id === selectedCharId);

    const payload = {
      playerName: sessionStorage.getItem('playerName') || 'Jogador',
      char: selectedChar,
      action: action.trim()
    };

    setAction('');
    setLoadingIA(true);
    try {
      const res = await fetch(`/api/room/${roomData.room.id}/adventure`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.details || "Erro no servidor");
      }
      
    } 
    catch (err) {
      console.error("Falha ao enviar ação:", err.message);
      alert(`Erro: ${err.message}`);
    }
    finally {
      setLoadingIA(false);
    }
  };

  return (
    <aside className="roomBox">
      <header className="header">
        <h3 className='title3'>AVENTURA</h3>
        <button className='settings' onClick={() => setShowMasterConfig(true)}></button>

        {showMasterConfig && (
          <Master 
            roomId={roomData.room.id} 
            config={roomData.master} 
            onClose={() => setShowMasterConfig(false)} 
          />
        )}
      </header>
      
      {/* Corpo do texto da história */}
      <div className="adventure">
        <div className="adventureLog">
          {adventureLog.map((log, index) => (
            <div key={index} className="messageRow">
              <span className="senderName">{log.charName}:</span>
              <span className="messageText">{log.text}</span>
            </div>
          ))}
          {loadingIA && <p style={{animate: 'pulse'}}>O Mestre está digitando...</p>}
          <div ref={advEndRef}/>
        </div>

        {/* Input de ação do rodapé */}
        <form onSubmit={handleSendAction} className="messageBox">

          <div className="charSelectorWrapper">
          <select
            className="hiddenSelect"
            value={selectedCharId}
            onChange={(e) => setSelectedCharId(e.target.value)}
            required
          >
            {roomData.chars.map((c) => (
              <option key={c.id} value={c.id}>{c.name} ({c.id})</option>
            ))}
          </select>
          <span className="charLabel">
            @{selectedCharId ? roomData.chars.find(c => c.id === selectedCharId)?.name : ''}
          </span>
          </div>

          <textarea
            className="message"
            value={action}
            onChange={(e) => {
              setAction(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = e.target.scrollHeight + 'px';
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault(); // Impede que pule linha
                handleSendAction(e); // Dispara a função de envio
              }
            }}
            placeholder={loadingIA ? "Aguardando o Mestre..." : "Digite sua ação..."}
            rows={1} // Começa com uma linha
            autoComplete="off"
            disabled={loadingIA}
          />

          <button type="submit" className="enter"></button>
        </form>
      </div>
    </aside>
  );
}