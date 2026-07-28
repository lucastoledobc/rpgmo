// arquivo: componente do chat entre jogadores
// local: src\components\RoomChat.tsx

'use client';
import {useState, useEffect, useRef} from 'react';

interface LogEntry {
  id: number;
  sender: string;
  charId: string | null;
  charName: string | null;
  type: string;
  text: string;
  sentAt: string;
}

export default function RoomChat({roomId}: {roomId: string}) {
  const [log, setLog] = useState<LogEntry[]>([]);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchLog = async () => {
      try {
        const res = await fetch(`/api/room/${roomId}/log`);
        const data = await res.json();
        if (data.log) setLog(data.log);
      }
      catch (err) {
        console.error("Erro ao buscar log:", err);
      }
    };

    fetchLog();
    const interval = setInterval(fetchLog, 10000);
    return () => clearInterval(interval);
  }, [roomId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({behavior: 'smooth'});
  }, [log]);

  return (
    <aside className="roomBox">
      <header className="header">
        <h3 className='title3'>Log</h3>
      </header>

      <div className='log'>
        <div className="loglog">
          {log.length && (log.map((entry) => (
            <div className='messageRow' key={entry.id}>
              {entry.type === 'system' && (
                <p>
                  <span className="log_system">{entry.charName}</span>: {entry.text}
                </p>
              )}
              {entry.type === 'ic' && (
                <p>
                  <span className="log_ic">{entry.charName}</span>: {entry.text}
                </p>
              )}
              {entry.type === 'ic' && (
                <p>
                  <span className="log_oc">{entry.charName}</span>: {entry.text}
                </p>
              )}
              {entry.type === 'npc' && (
                <p>
                  <span className="log_npc">{entry.charName}</span>: {entry.text}
                </p>
              )}
              {entry.type === 'error' && (
                <p>
                  <span className="log_error">{entry.charName}</span>: {entry.text}
                </p>
              )}
            </div>
          )))}
          <div ref={endRef} />
        </div>
      </div>
    </aside>
  );
}