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
