'use client';
import {useState, useEffect, useRef} from 'react';

export default function RoomChat({roomId}) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [playerName, setPlayerName] = useState('Jogador');
  const chatEndRef = useRef(null);

  // 1. Carrega o nome do jogador e busca mensagens inicialmente
  useEffect(() => {
    const savedName = sessionStorage.getItem('playerName');
    if (savedName) setPlayerName(savedName);

    // Função para buscar mensagens do servidor
    const fetchMessages = async () => {
      try {
        const res = await fetch(`/api/room/${roomId}`);
        const data = await res.json();
        if (data.chat) {
          setMessages(data.chat);
        }
      }
      catch (err) {
        console.error("Erro ao buscar chat:", err);
      }
    };

    fetchMessages();

    // 2. POLLING: Busca novas mensagens a cada 2 segundos
    const interval = setInterval(fetchMessages, 1000);
    return () => clearInterval(interval);
  }, [roomId]);

  // 3. Scroll automático para a última mensagem
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({behavior: 'smooth'});
  }, [messages]);

  // 4. Envia a mensagem para o servidor
  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    const newMessage = {
      sender: playerName,
      text: text.trimEnd()
    };
    
    await fetch(`/api/room/${roomId}/chat`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({roomId, newMessage}),
    });

    setText('');
  };

  return (
    <aside className="roomBox">
      <header className="header">
        <h3 className='title3'>CHAT</h3>
      </header>
      
      <div className="chat">
        {messages.map((msg, index) => (
          <div key={index} style={{marginBottom: '10px', textAlign: msg.sender === playerName ? 'right' : 'left'}}>
            <span className="sender">
              {msg.sender}
            </span>
            <div style={{
              display: 'inline-block',
              padding: '8px 12px',
              borderRadius: '8px',
              backgroundColor: msg.sender === playerName ? '#0070f3' : '#333',
              color: '#fff',
              marginTop: '2px'
            }}>
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />

      <form onSubmit={handleSend} className="message">
        <input
          type="text"
          className="input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Digite sua mensagem..."
          autoComplete="off"
        />
        <button type="submit" className="button">ENVIAR</button>
      </form>
      </div>
    </aside>
  );
}