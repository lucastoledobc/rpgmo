// arquivo: componente do chat entre jogadores
// local: src\components\RoomChat.tsx

'use client';
import {useState, useEffect, useRef} from 'react';

interface ChatMessage {
  id: number;
  sender: string;
  text: string;
  sentAt: string;
}

interface RoomChatProps {
  roomId: string;
}

export default function RoomChat({roomId}: RoomChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPlayerName(localStorage.getItem('playerName') || 'Jogador');
  }, []);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await fetch(`/api/room/${roomId}/chat`);
        const data = await res.json();
        if (data.messages) setMessages(data.messages);
      }
      catch (err) {
        console.error("Erro ao buscar chat:", err);
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 10000);
    return () => clearInterval(interval);
  }, [roomId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({behavior: 'smooth'});
  }, [messages]);

  const handleSend = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!text.trim() || sending) return;

    const messageText = text.trim();
    setText('');
    setSending(true);

    try {
      await fetch(`/api/room/${roomId}/chat`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({sender: playerName, text: messageText}),
      });
    }
    catch (err) {
      console.error("Erro ao enviar mensagem:", err);
    }
    finally {
      setSending(false);
    }
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
        <div ref={endRef} />
        </div>
      </div>

        <form onSubmit={handleSend} className="messageBox">
          <input
            type="text"
            className="message"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Digite uma mensagem..."
            autoComplete="off"
            disabled={sending}
          />

          <button type="submit" className="enter" disabled={sending}></button>
        </form>
    </aside>
  );
}