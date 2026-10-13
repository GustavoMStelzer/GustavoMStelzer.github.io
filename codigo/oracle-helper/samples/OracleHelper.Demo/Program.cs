using Gustavo.Data.Oracle;
using Oracle.ManagedDataAccess.Client;

// Nunca grave credenciais neste arquivo. A conexão vem do ambiente local.
var connectionString = Environment.GetEnvironmentVariable("ORACLE_DEMO_CONNECTION_STRING");
if (string.IsNullOrWhiteSpace(connectionString))
{
    Console.Error.WriteLine("Defina ORACLE_DEMO_CONNECTION_STRING antes de executar. Consulte o README.");
    return 1;
}

using var cancellation = new CancellationTokenSource(TimeSpan.FromSeconds(30));

try
{
    using var conexao = new OracleConnection(connectionString);

    var servicos = await OracleHelper.ExecutarRefCursorAsync<ServicoDto>(
        conexao,
        "PCK_PORTFOLIO_DEMO.SP_LISTAR",
        new Dictionary<string, object?> { ["P_SITUACAO"] = "PENDENTE" },
        cancellation.Token);

    foreach (var servico in servicos)
        Console.WriteLine($"{servico.CdServico}: {servico.DsServico} — {servico.DsSituacao}");

    var descricao = await OracleHelper.ExecutarFunctionAsync(
        conexao,
        "PCK_PORTFOLIO_DEMO.FC_DESCRICAO",
        new Dictionary<string, object?> { ["P_CODIGO"] = 101 },
        cancellation.Token);
    Console.WriteLine(descricao);

    await OracleHelper.ExecutarProcedureAsync(
        conexao,
        "PCK_PORTFOLIO_DEMO.SP_VALIDAR",
        new Dictionary<string, object?> { ["P_CODIGO"] = 101 },
        cancellation.Token);
    Console.WriteLine("Validação concluída.");

    var existe = await OracleHelper.ExecutarBlocoBooleanoAsync(
        conexao,
        "BEGIN :P_RETORNO := CASE WHEN :P_CODIGO = 101 THEN 1 ELSE 0 END; END;",
        new Dictionary<string, object?> { ["P_CODIGO"] = 101 },
        15,
        cancellation.Token);
    Console.WriteLine($"Código de demonstração reconhecido: {existe}");
    return 0;
}
catch (OperationCanceledException)
{
    Console.Error.WriteLine("A demonstração foi cancelada ou atingiu o tempo limite.");
    return 2;
}
catch (OracleException ex)
{
    // Não imprime a string de conexão nem dados da aplicação.
    Console.Error.WriteLine($"Falha Oracle (código {ex.Number}). Verifique a conexão e o pacote de demonstração.");
    return 3;
}

public sealed class ServicoDto
{
    public int CdServico { get; set; }
    public string? DsServico { get; set; }
    public string? DsSituacao { get; set; }
    public bool FlAtivo { get; set; }
}
