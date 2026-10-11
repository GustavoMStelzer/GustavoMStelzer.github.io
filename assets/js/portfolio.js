'use strict';

(() => {
  document.documentElement.classList.add('js');

  document.querySelectorAll('[data-year]').forEach(element => {
    element.textContent = String(new Date().getFullYear());
  });

  setupNavigation();
  setupCodeExamples();

  function setupNavigation() {
    const button = document.querySelector('.menu-toggle');
    const navigation = document.querySelector('.main-nav');

    if (!button || !navigation) return;

    function setOpen(open) {
      button.setAttribute('aria-expanded', String(open));
      navigation.classList.toggle('is-open', open);

      const icon = button.querySelector('span');
      if (icon) icon.textContent = open ? '−' : '+';
    }

    button.addEventListener('click', () => {
      setOpen(button.getAttribute('aria-expanded') !== 'true');
    });

    navigation.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => setOpen(false));
    });

    document.addEventListener('keydown', event => {
      if (event.key !== 'Escape' || button.getAttribute('aria-expanded') !== 'true') return;
      setOpen(false);
      button.focus();
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 760) setOpen(false);
    });
  }

  function setupCodeExamples() {
    const examples = document.querySelector('[data-code-examples]');
    if (!examples) return;

    const tabs = [...examples.querySelectorAll('[role="tab"]')];
    const copyButton = examples.querySelector('[data-copy-active]');
    const status = examples.querySelector('[data-copy-status]');
    const title = examples.querySelector('[data-result-title]');
    const description = examples.querySelector('[data-result-description]');
    const output = examples.querySelector('[data-result-code]');

    const results = {
      refcursor: {
        title: 'Um resultado tipado.',
        description: 'O cursor expõe CD_SERVICO e DS_SERVICO. O helper relaciona essas colunas às propriedades do modelo e preenche a lista.',
        code: 'List<ServicoDto>\n[\n  {\n    CdServico: 101,\n    DsServico: "Vistoria"\n  }\n]'
      },
      function: {
        title: 'O retorno da function.',
        description: 'O parâmetro de retorno é registrado como VARCHAR2. Depois da execução, o helper normaliza o valor recebido e o devolve como string.',
        code: 'string descricao\n\n"Serviço de demonstração 101"'
      },
      procedure: {
        title: 'A rotina é executada.',
        description: 'A aplicação aguarda a execução da procedure. No exemplo, o pacote valida o código informado, sem gravar registros.',
        code: 'P_CODIGO: 101\n\nExecução concluída.\nSem retorno de dados.'
      }
    };

    function activate(tab) {
      tabs.forEach(item => {
        const selected = item === tab;
        const panel = document.getElementById(item.getAttribute('aria-controls'));

        item.setAttribute('aria-selected', String(selected));
        item.tabIndex = selected ? 0 : -1;
        if (panel) panel.hidden = !selected;
      });

      const result = results[tab.dataset.example];
      title.textContent = result.title;
      description.textContent = result.description;
      output.textContent = result.code;
      if (status) status.textContent = 'C# · exemplos de integração';
    }

    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => activate(tab));
      tab.addEventListener('keydown', event => {
        const positions = {
          ArrowRight: (index + 1) % tabs.length,
          ArrowLeft: (index - 1 + tabs.length) % tabs.length,
          Home: 0,
          End: tabs.length - 1
        };
        const next = positions[event.key];
        if (next === undefined) return;

        event.preventDefault();
        activate(tabs[next]);
        tabs[next].focus();
      });
    });

    copyButton.addEventListener('click', async () => {
      const active = tabs.find(tab => tab.getAttribute('aria-selected') === 'true');
      const panel = document.getElementById(active.getAttribute('aria-controls'));
      const copied = await copyText(panel.querySelector('code').textContent);

      copyButton.focus();
      if (status) {
        status.textContent = copied
          ? 'Código copiado.'
          : 'Selecione o trecho e copie com Ctrl+C.';
      }
    });
  }

  async function copyText(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {
      // Arquivos abertos por file:// podem não ter acesso à Clipboard API.
    }

    const buffer = document.createElement('textarea');
    buffer.value = text;
    buffer.setAttribute('readonly', '');
    buffer.style.cssText = 'position:fixed;left:-9999px;top:0;';
    document.body.appendChild(buffer);
    buffer.select();

    try {
      return document.execCommand('copy');
    } catch {
      return false;
    } finally {
      buffer.remove();
    }
  }
})();
