'use client';
import {useRouter} from 'next/navigation';
import {useState, useEffect} from 'react';
import styles from '@/css/home.module.css';

export default function Room({roomId}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const router = useRouter();
  
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

  if (loading) return <div className={styles.container}>Carregando Aventura...</div>;

  const handleEditChar = (charId) => {
    router.push(`/room/${roomId}/${charId}`);
  };

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
    <header className={`${styles.roomHeader} ${isExpanded ? styles.expanded : ''}`}>
      <div className={styles.headerMain}>
          <h1>SALA: {data.nomeSala}</h1>
          <button onClick={() => setIsExpanded(!isExpanded)}>
              {isExpanded ? '▲ FECHAR' : '▼ INFO'}
          </button>
      </div>
      
      {/* Informações detalhadas */}
      {isExpanded && (
        <div className={styles.headerDetails}>
          <p><strong>ID da Sala:</strong> {data.id}</p>
          <p><strong>Criado em:</strong> {new Date(data.createdAt).toLocaleString()}</p>
          <p><strong>Personalização:</strong> {data.personalizacao || 'Nenhuma'}</p>
          <p><strong>Total de Personagens:</strong> {data.personagens?.length}</p>
        </div>
      )}
    </header>
  );
}