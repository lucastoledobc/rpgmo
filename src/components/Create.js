'use client';
import {useState, useRef} from 'react';
import {useRouter} from 'next/navigation';
import styles from '@/css/home.module.css';


export default function Create() {
  const router = useRouter();
  const fileInputRef = useRef(null);
  const [salaCriada, setSalaCriada] = useState(null);
  const [formData, setFormData] = useState({
    nomeSala: '',
    senha: '',
    mundo: 'Fantasia Medieval',
    personalizacao: ''
  });
  
  // Gera um ID de 12 dígitos
  const gerarId = () => {
    return Array.from({length: 12}, () => 
      "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"[Math.floor(Math.random() * 36)]
    ).join('');
  };

  // Função centralizada para enviar ao backend
  const enviarParaServidor = async (dados) => {
    let novoId = gerarId();
    let sucesso = false;

    // Tentativa de criar com tratamento de conflito (409)
    while (!sucesso) {
      const payload = {...dados, id: novoId};
      const response = await fetch('/api/create', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload),
      });
      // console.log(response)

      if (response.ok) {
        setSalaCriada(novoId);
        sucesso = true;
      }
      else if (response.status == 409) {
        novoId = gerarId(); // Gera novo ID e tenta o loop de novo
      }
      else {
        alert("Erro ao criar sala.");
        break;
      }
    }
  };

  // Criar sala do zero
  const handleSubmit = (e) => {
    e.preventDefault();
    enviarParaServidor(formData);
  };

  // Carregar antigo e criar sala
  const handleCarregarJSON = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target.result);
        const dadosCarregados = {
          nomeSala: json.nomeSala || '',
          senha: json.senha || '',
          mundo: 'personalizado',
          personalizacao: json.personalizacao || ''
        };
        // Já enviamos direto para o servidor
        enviarParaServidor(dadosCarregados);
      } catch (err) {
        alert("Erro ao ler o arquivo JSON.");
      }
    };
    reader.readAsText(file);
  };

  // atualiza a escrita na tela
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({...prev, [name]: value}));
  };


  // mensagem para retornar
  if (salaCriada) {
    return (
      <main className={styles.container}>
        <div className={styles.rpgBox}>
          <h3>SALA CRIADA COM SUCESSO!</h3>
          <p>ID da sala: <strong>{salaCriada}</strong></p>
          <div className={styles.buttonContainer}>
            <button className={styles.button} onClick={() => navigator.clipboard.writeText(salaCriada)}>COPIAR ID</button>
            <button className={styles.button} onClick={() => router.push('/')}>VOLTAR</button>
          </div>
        </div>
      </main>
    );
  }
  
  // html da tela
  return (
    <main className={styles.container}>
      <h1 className={styles.title}>CRIAR AVENTURA</h1>
      
      <div className={styles.rpgBox}>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleCarregarJSON} 
          style={{ display: 'none' }} 
          accept=".json"
        />

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem', textAlign: 'right' }}>
            <button 
              type="button" 
              className={styles.button} 
              onClick={() => fileInputRef.current.click()}
            >
              [ CARREGAR JSON ]
            </button>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>NOME DA SALA</label>
            <input name="nomeSala" className={styles.input} value={formData.nomeSala} onChange={handleChange} required />
          </div>
          
          <div className={styles.formGroup}>
            <label className={styles.label}>SENHA DA SALA</label>
            <input name="senha" type="password" className={styles.input} value={formData.senha} onChange={handleChange} required />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>MUNDO</label>
            <select name="mundo" className={styles.input} value={formData.mundo} onChange={handleChange}>
              <option>Fantasia Medieval</option>
              <option>Cyberpunk</option>
              <option>Terror</option>
              <option>Personalizado</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>PERSONALIZAÇÃO</label>
            <textarea name="personalizacao" className={styles.input} rows={4} value={formData.personalizacao} onChange={handleChange} />
          </div>

          <div className={styles.buttonContainer}>
            <button type="submit" className={styles.button}>CRIAR SALA</button>
          </div>
        </form>
      </div>
    </main>
  );
}