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
    const interval = setInterval(fetchMessages, 300000);
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
        <div className="chatLog">
          {messages.map((msg, index) => (
            <div key={index} className={msg.sender === playerName ? 'myChat' : 'yourChat'}>
              <span className="chatSender">{msg.sender}</span>
              <div className='chatText'>{msg.text}</div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        <form onSubmit={handleSend} className="messageBox">          
          <span className="charLabel">
            @{playerName}
          </span>

          <textarea
            className="message"
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = e.target.scrollHeight + 'px';
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend(e); 
              }
            }}
            placeholder="Digite sua mensagem"
            rows={1}
            autoComplete="off"
          />

          <button type="submit" className="enter"></button>
        </form>
      </div>
    </aside>
  );
}