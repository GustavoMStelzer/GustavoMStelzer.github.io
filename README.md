# Gustavo Stelzer

Desenvolvedor Full Stack. Trabalho com C#, .NET, Angular e Oracle em sistemas corporativos, integrações e modernização de aplicações legadas.

[Acessar meu portfólio](https://gustavomstelzer.github.io/)

## Projetos selecionados

- **[Oracle Helper](https://gustavomstelzer.github.io/projetos/oracle-helper.html):** classe C# que criei para organizar chamadas a procedures e functions e mapear RefCursor para objetos. [Código](codigo/oracle-helper/src/Gustavo.OracleHelper/OracleHelper.cs).
- **[Equipes e serviços em campo](https://gustavomstelzer.github.io/projetos/equipes-em-campo.html):** minha atuação nas interfaces e integrações para acompanhar equipes e serviços.
- **[Arrecadação e conciliação](https://gustavomstelzer.github.io/projetos/arrecadacao-e-conciliacao.html):** experiência com recebimentos bancários, Pix e boleto.

Também atuei com rateio de energia solar, controle de EPIs, controle de acesso e migração de Oracle Forms para web. O site apresenta uma seleção dessa experiência. As representações dos sistemas corporativos usam dados fictícios.

## Entre um código e outro

- **[Café com robô](https://gustavomstelzer.github.io/jogos/cafe-com-robo.html):** jogo da velha com modo Desafio e modo Imbatível, usando minimax.
- **[Plantão do apagão](https://gustavomstelzer.github.io/jogos/plantao-do-apagao.html):** quebra-cabeça de redes, com geração de árvores, rotações e busca em largura.
- **[Ponto Crítico](https://www.youtube.com/@PontoCriticoDocs):** meu projeto de mini-documentários sobre tecnologia, empresas e histórias que despertam minha curiosidade.

## Código do site

HTML, CSS e JavaScript, sem etapa de build ou dependências no navegador. Layout responsivo, navegação por teclado, opções de aparência e suporte a movimento reduzido. Os ícones dos jogos são vetores SVG locais.

A lógica dos jogos fica em `assets/js/games/`, separada dos arquivos de interface com sufixo `-ui.js`. Os placares do jogo da velha usam o armazenamento da sessão; se estiver indisponível, o jogo continua em memória.

### Verificar a lógica dos jogos

Com Node.js instalado, execute na raiz:

```shell
node --test tests/games.test.cjs
```

Os testes percorrem todas as escolhas humanas contra o robô determinístico, com ambos os participantes começando, e verificam a geração e resolução das redes. Os requisitos e limites do projeto C# estão em [codigo/oracle-helper/README.md](codigo/oracle-helper/README.md).

## Contato

- [LinkedIn](https://www.linkedin.com/in/gustavo-monteiro-stelzer-5a4586208/)
- [gustavomstelzer@gmail.com](mailto:gustavomstelzer@gmail.com)
