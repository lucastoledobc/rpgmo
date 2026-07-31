// arquivo: modal de rolagem de dados
// local: src\components\Dice.tsx

'use client';
import {useState, useEffect, useRef} from 'react';

interface DiceProps {
  roomId: string
  diceNotation: string; // "NdX";
  onClose: () => void;
}

function parseDice(notation: string): {count: number; sides: number} {
  const match = notation.trim().toLowerCase().match(/^(\d+)d(\d+)$/);
  let result;
  if (match) {
    result = {count: Number(match[1]), sides: Number(match[2])};
  }
  else {
    result = {count: 1, sides: 20};
  }
  return result;
}

export default function Dice({roomId, diceNotation, onClose}: DiceProps) {
  const parsed = parseDice(diceNotation);
  const [rolling, setRolling] = useState(false);
  const [display, setDisplay] = useState<string>('?');
  const [manualValue, setManualValue] = useState('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const {count, sides} = parsed;
  const min = count;
  const max = count * sides;

  const rollAutomatically = () => {
  if (rolling) return;
  setRolling(true);

  let ticks = 0;
  intervalRef.current = setInterval(() => {
    setDisplay(String(Math.floor(Math.random() * max) + min));
    ticks++;

    if (ticks >= 10) {
      if (intervalRef.current) clearInterval(intervalRef.current);

      let total = 0;
      for (let i = 0; i < count; i++) {
        total += Math.floor(Math.random() * sides) + 1;
      }

      setDisplay(String(total));
      setRolling(false);
      setTimeout(() => sendDiceValue(total), 1000);
    }
    }, 80);
  };

  const handleSubmitManual = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const val = Number(manualValue);
    if (val >= min && val <= max) {
      sendDiceValue(val);
    }
  };

  const sendDiceValue = async (value: number) => {
    try {
      await fetch(`/api/room/${roomId}/adventure/dice`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({diceValue: value}),
      });
      onClose();
    }
    catch (err) {
      console.error("Erro ao rolar os Dados:", err);
    }
  };


  return (
    <div className="modalBox">
      <div className="editBox">
        <h2 className='title3'>Role os dados</h2>
        <p style={{opacity: 0.7, fontSize: '0.8em'}}>{diceNotation}</p>

        <div className="diceBox">
          <span className="diceValue">{display}</span>
        </div>

        <div className="buttonContainer">
          <button type="button" className="button" onClick={rollAutomatically} disabled={rolling}>
            {rolling ? 'Rolando...' : 'Rolar dados'}
          </button>
        </div>

        <p style={{opacity: 0.7, fontSize: '0.8em', marginTop: '1em'}}>ou digitar valor</p>

        <form onSubmit={handleSubmitManual} className="messageBox">
          <input
            type="number"
            className="input"
            min={min}
            max={max}
            value={manualValue}
            onChange={(e) => setManualValue(e.target.value)}
            placeholder={`${min}-${max}`}
            disabled={rolling}
          />
          <button type="submit" className="button" disabled={rolling || !manualValue}>Enviar</button>
        </form>
      </div>
    </div>
  );
}