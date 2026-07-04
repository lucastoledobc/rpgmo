'use client';
import {useState, useEffect} from 'react';

export default function Room({roomId, mestreInfo}) {
  const [data, setData] = useState(null);
  const [chatLog, setChatLog] = useState([]);
  const [input, setInput] = useState('');

  // Coluna 2: IA
  const handleSend = async (e) => {
    if (e.key === 'Enter' && input.trim() !== '') {
      const userMsg = { turno: chatLog.length + 1, texto: `Jogador: ${input}` };
      setChatLog((prev) => [...prev, userMsg]);
      setInput('');

      // Chamada para sua nova rota chatAI
      const res = await fetch(`/api/room/${roomId}/chatAI`, {
        method: 'POST',
        body: JSON.stringify({ mensagem: input }),
      });
      const result = await res.json();

      setChatLog((prev) => [...prev, { turno: prev.length + 1, texto: `Mestre: ${result.resposta}` }]);
    }
  };

  return (
    <section className="centerColumn">
        <div className="aiChatContainer">
        {/* Log de mensagens */}
        <div className="chatLog">
            {chatLog.map((msg, index) => (
            <p key={index} className={msg.texto.startsWith('Mestre') ? aiResponse : userResponse}>
                {msg.texto}
            </p>
            ))}
        </div>

        {/* Input de Ação */}
        <input 
            className="aiInput" 
            placeholder="Digite sua ação..." 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleSend}
        />
        </div>
    </section>
  );
}