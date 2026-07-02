'use client';
import { useState, useEffect } from 'react';
import styles from '@/css/home.module.css';

export default function Room({ roomId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    fetch(`/api/room/${roomId}`)
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setLoading(false);
      });
  }, [roomId]);

  if (loading) return <div className={styles.container}>Carregando Aventura...</div>;

  return (
    <div className={styles.pageWrapper}>

      {/* Header Fixo no topo */}
      <header className={`${styles.roomHeader} ${isExpanded ? styles.expanded : ''}`}>
        <div className={styles.headerMain}>
            <h1>SALA: {data.nomeSala}</h1>
            <button onClick={() => setIsExpanded(!isExpanded)}>
                {isExpanded ? '▲ FECHAR' : '▼ INFO'}
            </button>
        </div>
        
        {/* Informações detalhadas que aparecem ao expandir */}
        {isExpanded && (
            <div className={styles.headerDetails}>
                <p><strong>ID da Sala:</strong> {data.id}</p>
                <p><strong>Criado em:</strong> {new Date(data.createdAt).toLocaleString()}</p>
                <p><strong>Personalização:</strong> {data.personalizacao || 'Nenhuma'}</p>
                <p><strong>Total de Personagens:</strong> {data.personagens?.length}</p>
            </div>
        )}
      </header>

      {/* Conteúdo Principal */}
      <div className={styles.layout}>
        {/* Coluna 1: Personagens */}
        <aside className={styles.leftColumn}>
          <h3>PERSONAGEM</h3>
          <div className={styles.charStatus}>
             {data.personagens?.length === 0 ? <p>Nenhum personagem.</p> : <p>Dados carregados...</p>}
          </div>
          <button className={styles.button}>+ CRIAR / TROCAR</button>
        </aside>

        {/* Coluna 2: Mestre IA */}
        <section className={styles.centerColumn}>
          <div className={styles.aiChatContainer}>
            <div className={styles.chatLog}>
              <p>Mestre: Bem-vindo à sala {data.nomeSala}. A aventura começa agora...</p>
            </div>
            <input className={styles.aiInput} placeholder="Digite sua ação..." />
          </div>
        </section>

        {/* Coluna 3: Chat Amigos */}
        <aside className={styles.rightColumn}>
          <h3>CHAT</h3>
          <div className={styles.friendChat}>
             {/* Lista de mensagens */}
          </div>
        </aside>
      </div>
    </div>
  );
}