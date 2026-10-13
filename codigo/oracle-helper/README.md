# Oracle Helper

Helper C# para integrar aplicações .NET a rotinas Oracle e mapear resultados de RefCursor para modelos da aplicação.

**Autor: Gustavo Monteiro Stelzer** · [Portfólio](https://gustavomstelzer.github.io/projetos/oracle-helper.html) · [LinkedIn](https://www.linkedin.com/in/gustavo-monteiro-stelzer-5a4586208/)

## Por que criei

Chamadas ao Oracle costumam repetir a preparação do comando, os parâmetros e a transformação do retorno. Criei o helper para concentrar essas rotinas e manter as chamadas dos repositórios mais consistentes.

## O que esta versão oferece

- Execução assíncrona de procedures e functions.
- `BindByName` nas chamadas Oracle.
- RefCursor convertido em `List<T>` ou primeiro registro.
- RefCursor combinado com parâmetros de saída.
- Functions com retorno textual e múltiplas saídas.
- Procedures com parâmetros de entrada, saída e entrada/saída.
- Normalização de nomes, associando, por exemplo, `CD_SERVICO` a `CdServico`.
- Tratamento de valores nulos e conversão de tipos Oracle.
- Execução de bloco PL/SQL com saída numérica 0/1 convertida para `bool`.
- `CancellationToken` nos métodos assíncronos.

## Organização

| Caminho | Conteúdo |
| --- | --- |
| `src/Gustavo.OracleHelper/OracleHelper.cs` | Classe de acesso e classe `ParametroOracle` |
| `samples/OracleHelper.Demo/Program.cs` | Demonstração executável em console |
| `sql/demo.sql` | Pacote Oracle com dados fictícios e sem tabelas de negócio |

A classe foi organizada em um projeto independente com o namespace `Gustavo.Data.Oracle`. A versão pública inclui exemplos isolados de dados corporativos. A revisão de outubro de 2026 tornou explícitas as falhas de conversão e as ambiguidades entre nomes de colunas.

## Requisitos

- SDK **.NET 10** para os projetos fornecidos.
- Pacote NuGet `Oracle.ManagedDataAccess.Core`, fixado em `23.26.301` no `.csproj`.
- Banco Oracle acessível e schema de desenvolvimento com permissão para criar o pacote de demonstração.

O driver é restaurado pelo próprio .NET. Nenhuma credencial ou endereço de banco está incluído.

## Compilar

Na pasta raiz deste repositório:

```shell
dotnet restore samples/OracleHelper.Demo/OracleHelper.Demo.csproj
dotnet build samples/OracleHelper.Demo/OracleHelper.Demo.csproj --configuration Release --no-restore
```

## Executar a demonstração

1. Em um schema separado de desenvolvimento, execute `sql/demo.sql` com SQL Developer, SQLcl ou ferramenta equivalente. O script usa `CREATE`, sem substituir um pacote que já exista. Verifique `USER_ERRORS` ao final.
2. No PowerShell, configure a conexão somente na sessão local:

```powershell
$env:ORACLE_DEMO_CONNECTION_STRING = Read-Host 'Informe a conexão Oracle de desenvolvimento' -MaskInput
dotnet run --project samples/OracleHelper.Demo/OracleHelper.Demo.csproj
Remove-Item Env:ORACLE_DEMO_CONNECTION_STRING
```

`-MaskInput` exige PowerShell 7.1 ou posterior. Outra opção é definir `ORACLE_DEMO_CONNECTION_STRING` nas variáveis de ambiente da configuração de execução da sua IDE, sem versionar esse valor.

3. O exemplo consulta o serviço fictício 101, chama uma function, executa uma procedure de validação e testa um bloco booleano. Nenhuma dessas chamadas grava tabelas.

Formato esperado da saída:

```text
101: Vistoria — PENDENTE
Serviço de demonstração 101
Validação concluída.
Código de demonstração reconhecido: True
```

Essa saída é uma referência ilustrativa, não um resultado de execução desta entrega.

## Exemplo de integração

```csharp
using Gustavo.Data.Oracle;
using Oracle.ManagedDataAccess.Client;

using var conexao = new OracleConnection(connectionString);

var servicos = await OracleHelper.ExecutarRefCursorAsync<ServicoDto>(
    conexao,
    "PCK_PORTFOLIO_DEMO.SP_LISTAR",
    new Dictionary<string, object?> { ["P_SITUACAO"] = "PENDENTE" },
    cancellationToken);
```

O modelo precisa ter construtor sem parâmetros e propriedades públicas graváveis. A aplicação que cria a conexão continua responsável por seu descarte.

## Decisões e limites da implementação

- A versão foi mantida como helper, sem se apresentar como um ORM completo.
- Colunas sem propriedade correspondente são ignoradas. Valores nulos não substituem o valor padrão da propriedade.
- Falhas de conversão geram `DataException` com a coluna e a propriedade de destino, preservando a exceção original. O mapeamento não devolve silenciosamente um objeto parcialmente convertido. A mensagem externa não inclui o valor recebido.
- Colunas que se tornam iguais após a normalização geram `DataException`; use aliases distintos no SQL. Indexadores e propriedades sem setter público ficam fora do mapeamento.
- `ExecutarRefCursorIDAsync<T>` usa o mapeamento da lista e então retorna o primeiro item. Não é uma consulta otimizada para grandes conjuntos.
- `ExecutarFunctionAsync` devolve string vazia para retorno nulo; `ExecutarFunctionNullableAsync` transforma retorno vazio ou em branco em `null`.
- O helper não gerencia commit/rollback nem transações por conta própria. Isso pertence ao fluxo da aplicação e das rotinas Oracle.
- O nome da rotina e o texto de um bloco PL/SQL devem vir do código da aplicação, nunca de entrada livre de usuário. Os valores devem ser passados como parâmetros.
- O projeto C# não foi compilado neste ambiente de preparação, que não dispõe do SDK .NET, nem executado contra um banco Oracle. Rode os comandos acima no ambiente de desenvolvimento antes de usar a biblioteca em outra aplicação.

## Referências

- [Driver oficial Oracle.ManagedDataAccess.Core](https://www.nuget.org/packages/Oracle.ManagedDataAccess.Core/23.26.301)
- [Documentação do ODP.NET](https://docs.oracle.com/en/database/oracle/oracle-database/26/odpnt/)

Oracle é uma marca de seu respectivo titular. Este é um projeto independente.
