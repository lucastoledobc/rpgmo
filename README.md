### RPGMO

Um site para jogar RPG com amigos e uma IA ser o mestre.

## Tecnologias
- **Framework:** Next.js (React)
- **Estilização:** CSS Modules (Pixel Art estético)
- **Lógica:** JavaScript/TypeScript
- **IA:** Integração via API para narração e gestão de mundo.


## Mapa do Site

- `Home (/ )`: Acesso à sala ou navegação para criação.
- `Criar Sala (/create)`: Configuração do cenário e regras da partida.
- `Configurar Mestre (/master)`: Configuração do Mestre (IA).
- `Sala (/room/[id])`: O tabuleiro principal do jogo.
- `Personagem (/room/[id]/[char])`: Criação e edição de fichas de personagem.


## Home

Página simples com botão login e criar sala


## Criar sala

O menu é composto por:

- Nome da sala: Escolha um.
- Senha: a senha que será usada para os jogadores entrarem.
- Mundo: Escolha o modelo do jogo.
    - label select com opções genéricas prontas tipo "fantasia medieval, cyberpunk".
    ou
    - selecione "personalizado" e suba seu livro D&D ou Tormenta.
- Personalização do mundo (opicional): Uma caixa chamada para personalizar o mundo escolhido ou criar um do zero.
- Botão Criar Sala: um código único será gerado (usado para o login).


# Configurar Mestre

Formulário para configurar o Mestre.
Campos:
- IA (gpt, gemini, claude).
- chave API.
- Personalidade do Mestre.


## Sala

Ambiente com:
- Header: nome da sala. 
    Expandível para mostrar os detalhes: id da sala, mundo, personagens e botão Salvar Aventura.
- 3 colunas: personagens, ChatIAventura, ChatAmigos


# Personagens:

- 3 funções: 
1. Criar personagem: leva a próxima página "Personagem".
2. Selecionar personagem disponível: Uma label select que mostra os personagens disponíveis.
3. Stats dos personagens escolhidos. Tem o HP, Mana, etc. Se clicar em expandir, vai para a tela de "Personagem", mas com campos 'nome', 'idade', etc já preenchidos e podendo ser modificados.

# ChatIAventura:

A IA vai receber as configurações do Mestre, o mundo (história, regras e personalização), os personagens, log da Aventura (se houver) e começar a aventura.

Interface:
- Engrenagem (configurações): Alterar as configurações do mestre.
- Botão play/pause: ativa/desativa o estado de pausa.

Estado de pausa: neste momento todos os jogadores podem fazer perguntas, interagir entre si e com o mundo e até modificar a aventura. O Mestre só vai continuar quando apertar o botão "Play".

Barra de mensagem:
- label personagem: escolha qual dos personagens vai realizar a ação.
- campo de texto: área de comunicação com o Mestre.

Comandos:
- @fulano -> direciona sua ação à personagem 'fulano'.
- #GM -> o que for escrito vai ser considerado como verdade. Função para jogadores personalizarem a aventura.


# ChatAmigos:

Um chat simples com texto ou voz. A IA não vai receber nada daqui.


## Personagem

Uma tela para criação ou edição de personagem.

# Campos:
- imagem: 32x32 pixels (editavel)
- nome:
- idade:
- classe:
- raça:
- status: label para distrubuição (editaveis)
- equipamento: 
- pertences:
- história:

Botões: Cancelar e Salvar


## Mapa do código:

/src
  - /app
    - /api (routes)
    - /create
      - page.tsx (página para criação de sala)
    - /room 
      - [id]
        - page.tsx (página da sala)
    - layout.tsx
    - page.tsx (página de login)
  - /components
    - Char.js (Modal para criação/edição de char)
    - Create.js (Componente para criação de sala)
    - Master (Modal para edição da IA_Mestre)
    - RoomAdventure.js (Componente para coluna central da sala)
    - RoomChars.js (Componente para coluna esquerda da sala)
    - RoomChat.js (Componente para coluna direita da sala)
    - RoomHEader.js (Componente para o Header da sala)
  - /css
    - /fonts (fontes utilizadas)
    - globals.css
  - /data
    - /livros (json's com história prontas para jogar)
    - /rooms  (json's com dados das salas criadas) - descontinuado
    - rooms.json (lista das salas criadas)
  - /db
    - index.ts
    - schema.ts (estrutura da db)

