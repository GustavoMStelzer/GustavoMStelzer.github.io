# Personalização

O site já está pronto para publicar. Estes ajustes são opcionais.

## Cores e movimentos

No topo do site, **Estilo** oferece vermelho, roxo e gelo. No celular, o controle é o símbolo **◐**. A opção **Reduzir movimentos** desativa as animações e a rolagem suave.

Para alterar o padrão inicial, edite `assets/js/config.js`:

```js
window.PORTFOLIO_THEME = {
  accent: 'red',
  motion: 'system'
};
```

| Propriedade | Opções |
| --- | --- |
| `accent` | `red`, `violet`, `ice` |
| `motion` | `system`, `reduced` |

A preferência salva pelo visitante tem prioridade. Use uma janela privada para conferir um novo padrão.

## Retrato

Substitua `assets/img/gustavo-stelzer.png` por uma imagem quadrada com o mesmo nome. Uma versão com mais resolução melhora a nitidez. Se mudar o formato, atualize o caminho da imagem e sua descrição `alt` em `index.html`.

## Textos e links

Edite as seções de `index.html`:

| ID | Seção |
| --- | --- |
| `projetos` | Oracle Helper e experiência profissional |
| `sobre` | Trajetória e formação |
| `alem-do-codigo` | Ponto Crítico |
| `jogos` | Café com robô e Plantão do apagão |
| `contato` | Links de contato |

A página do Oracle Helper fica em `projetos/oracle-helper.html`. O currículo pode ser substituído mantendo o nome `assets/curriculo-gustavo-stelzer.pdf`.

## Estilos

As variáveis ficam no início de `assets/css/portfolio.css`. Cada cor de destaque tem um bloco `data-accent` próprio.

| Variável | Uso |
| --- | --- |
| `--bg` | Fundo principal |
| `--surface` | Fundo de seções e painéis |
| `--ink` | Texto principal |
| `--muted` | Texto secundário |
| `--accent` e `--accent-rgb` | Cor de destaque |
| `--sans` e `--mono` | Fontes |
| `--reveal-distance` | Deslocamento na entrada das seções |

As cores do pôster do Ponto Crítico estão em `.critical-poster`.

## Projeto e perfil

Para publicar o Oracle Helper separadamente, extraia `assets/downloads/oracle-helper.zip` e siga seu README. Para atualizar o perfil do GitHub, use o conteúdo de `docs/README-perfil.md` no repositório `GustavoMStelzer/GustavoMStelzer`.

## Jogos

As páginas ficam em `jogos/`. Textos de partida e comportamento de interface ficam em `assets/js/games/*-ui.js`; as regras ficam nos arquivos sem esse sufixo. A identidade visual está em `assets/css/arcade.css`. Os personagens são os arquivos `robot.svg`, `coffee.svg` e `bulb.svg` em `assets/img/`.

O modo Desafio do jogo da velha tem 30% de chance de escolher uma casa aleatória quando não há vitória nem bloqueio imediato. O Imbatível sempre usa minimax. O placar separa as dificuldades.

No Plantão do apagão, os tamanhos disponíveis são 3, 4 e 5. Cada toque gira 90°. A usina permanece fixa. Dicas orientam uma peça para a solução gerada e são contadas separadamente dos giros do jogador.

## Apresentação dos projetos

Os relatos adicionais ficam em `projetos/equipes-em-campo.html` e `projetos/arrecadacao-e-conciliacao.html`. Seus exemplos visuais são fictícios e identificados no próprio site. A imagem de compartilhamento é `assets/img/portfolio-social.png`.
