'use client';
import { useState } from 'react';

export default function CharacterManager() {
  const [personagens, setPersonagens] = useState([]); // Array de personagens
  const [selecionado, setSelecionado] = useState(null);

  return (
    <div>
      {selecionado ? (
        <div className="status-box">
          <h4>{selecionado.nome}</h4>
          <p>HP: {selecionado.hp}</p>
          <p>FOR: {selecionado.forca}</p>
        </div>
      ) : (
        <p>Nenhum personagem selecionado.</p>
      )}

      {personagens.length > 0 && (
        <select onChange={(e) => setSelecionado(JSON.parse(e.target.value))}>
          {personagens.map((p, i) => (
            <option key={i} value={JSON.stringify(p)}>{p.nome}</option>
          ))}
        </select>
      )}

      <button onClick={() => alert("Abrir modal de criação")}>+ CRIAR PERSONAGEM</button>
    </div>
  );
}