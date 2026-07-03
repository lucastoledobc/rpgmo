'use client';
import styles from '@/css/home.module.css';

export default function Room() {
  return (
    <aside className={styles.rightColumn}>
      <h3>CHAT</h3>
      <div className={styles.friendChat}>
          {/* Lista de mensagens */}
      </div>
    </aside>
  );
}