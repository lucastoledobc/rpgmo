'use client';
import { useState, useEffect, useRef } from 'react';

export default function RoomAdventure({ roomId }) {
  const [adventureLog, setAdventureLog] = useState([]);
  const [action, setAction] = useState('');
  const [loadingIA, setLoadingIA] = useState(false);
  const advEndRef = useRef(null);

  useEffect(() => {
    // 1. Polling para atualizar o texto da aventura a cada 3 segundos
    const fetchAdventure = async () => {
      try {
        const res = await fetch(`/api/room/${roomId}`);
        const data = await res.json();
        // Assumindo que o texto da aventura ficará no array "adventure" do JSON
        if (data.adventure) {
          setAdventureLog(data.adventure);
        }
      } catch (err) {
        console.error("Erro ao buscar aventura:", err);
      }
    };

    fetchAdventure();
    const interval = setInterval(fetchAdventure, 3000);
    return () => clearInterval(interval);
  }, [roomId]);

  useEffect(() => {
    advEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [adventureLog]);

  const handleSendAction = async (e) => {
    e.preventDefault();
    if (!action.trim() || loadingIA) return;

    const playerAction = action.trim();
    setAction('');
    setLoadingIA(true);

    // Pegamos o nome do jogador para a IA saber quem está agindo
    const playerName = sessionStorage.getItem('playerName') || 'Jogador';

    try {
      // 2. Envia a ação para a rota da IA
      await fetch(`/api/room/${roomId}/adventure`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: playerAction, playerName }),
      });
    } catch (err) {
      console.error("Erro ao falar com o Mestre:", err);
    } finally {
      setLoadingIA(false);
    }
  };

  return (
    <aside className="roomBox columnAdventure">
      <header className="header">
        <h3 className='title3'>AVENTURA</h3>
      </header>
      
      {/* Corpo do texto da história */}
      <div className="adventureBody" style={{ height: 'calc(100% - 110px)', overflowY: 'auto', padding: '10px' }}>
        {adventureLog.length === 0 ? (
          <p style={{ color: '#888', fontStyle: 'italic' }}>O Mestre está aguardando você iniciar a jornada...</p>
        ) : (
          adventureLog.map((log, index) => (
            <p key={index} style={{ marginBottom: '15px', lineHeight: '1.5', color: log.type === 'master' ? '#fff' : '#00ffcc' }}>
              <strong>{log.sender}:</strong> {log.text}
            </p>
          ))
        )}
        {loadingIA && <p style={{ color: '#888', animate: 'pulse' }}>O Mestre está digitando...</p>}
        <div ref={advEndRef} />
      </div>

      {/* Input de ação do rodapé */}
      <form onSubmit={handleSendAction} className="message">
        <input
          type="text"
          className="input"
          value={action}
          onChange={(e) => setAction(e.target.value)}
          placeholder={loadingIA ? "Aguardando o Mestre..." : "Digite sua ação..."}
          autoComplete="off"
          disabled={loadingIA}
        />
        <button type="submit" className="button" disabled={loadingIA}>ENVIAR</button>
      </form>
    </aside>
  );
}