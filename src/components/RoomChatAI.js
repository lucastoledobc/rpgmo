'use client';
import {useState, useEffect} from 'react';
import styles from '@/css/home.module.css';

export default function Room({roomId}) {
  const [data, setData] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Coluna 2: IA
  const [chatLog, setChatLog] = useState([]);
  const [input, setInput] = useState('');

  useEffect(() => {
    fetch(`/api/room/${roomId}`)
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setLoading(false);
        if (json && json.logAventura) {
          setChatLog(json.logAventura);
        }
        setLoading(false);
      });
  }, [roomId]);

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
    <section className={styles.centerColumn}>
        <div className={styles.aiChatContainer}>
        {/* Log de mensagens */}
        <div className={styles.chatLog}>
            {chatLog.map((msg, index) => (
            <p key={index} className={msg.texto.startsWith('Mestre') ? styles.aiResponse : styles.userResponse}>
                {msg.texto}
            </p>
            ))}
        </div>

        {/* Input de Ação */}
        <input 
            className={styles.aiInput} 
            placeholder="Digite sua ação..." 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleSend}
        />
        </div>
    </section>
  );
}