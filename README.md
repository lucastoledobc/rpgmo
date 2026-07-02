### RPGMO

Um site para jogar um MMO com amigos e uma IA ser o mestre.

## Tecnologias
- **Framework:** Next.js (React)
- **Estilização:** CSS Modules (Pixel Art estético)
- **Lógica:** JavaScript/TypeScript
- **IA:** Integração via API para narração e gestão de mundo.


## Mapa do Site

- `Home (/ )`: Acesso à sala ou navegação para criação.
- `Criar Sala (/create)`: Configuração do cenário e regras da partida.
- `Sala (/room/[id])`: O tabuleiro principal do jogo.
- `Personagem (/room/[id]/[char])`: Criação e edição de fichas de personagem.


## Home

Página simples com botão login e criar sala


## Criar sala

O menu é composto por:

- Nome da sala: Escolha um.
- Mundo: label select com opções genéricas tipo "fantasia, mediaval, cyberpunk, personalizado' com um botão do lado de upload.
- Personalização do mundo (opicional): Uma caixa chamada para personalizar o mundo escolhido.
- Senha: a senha que será usada para os jogadores entrarem.
- Botão Criar Sala: um código único será gerado (usado para o login).


## Sala

Ambiente com:
- Header: nome da sala.
- 3 colunas: personagens, ChatIAventura, ChatAmigos

# Personagens:

- 3 funções: 
1. Criar personagem: leva a próxima página "Personagem".
2. Selecionar personagem disponível: Uma label select que mostra os personagens disponíveis.
3. Stats dos personagens escolhidos. Tem o HP, Mana, etc. Se clicar em expandir, vai para a tela de "Personagem", mas com campos 'nome', 'idade', etc já preenchidos e podendo ser modificados.

# ChatIAventura:

A IA vai receber o mundo escolhido, ler os personagens e começar a aventura.
Há perguntas para as ações dos jogadores que vão descrever o que fazer um de cada vez.

Estado de pausa: para evitar atropelamentos, a IA entra em estado de pausa sempre que fizer perguntas, ela só vai continuar quando apertar o botão "Continuar".


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
- status: com label para distrubuição (editaveis)
- pertences:
- história:

Botões: Salvar e X (cancelar)