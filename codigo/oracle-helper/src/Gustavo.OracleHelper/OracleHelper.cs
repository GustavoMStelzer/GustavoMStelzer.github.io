using System.Data;
using System.Globalization;
using System.Reflection;
using System.Text;
using Oracle.ManagedDataAccess.Client;
using Oracle.ManagedDataAccess.Types;

namespace Gustavo.Data.Oracle
{
    public static class OracleHelper
    {
        // RefCursor -> List<T>
        public static async Task<List<T>> ExecutarRefCursorAsync<T>(
            IDbConnection dbConnection,
            string storedProcedure,
            Dictionary<string, object?> parametros,
            CancellationToken ct = default)
            where T : new()
        {
            if (dbConnection is not OracleConnection oracleConn)
                throw new InvalidOperationException("A conexão precisa ser OracleConnection.");

            await using var cmd = oracleConn.CreateCommand();
            cmd.CommandText = storedProcedure;
            cmd.CommandType = CommandType.StoredProcedure;
            cmd.BindByName = true;

            AdicionarParametrosEntrada(cmd, parametros);

            cmd.Parameters.Add(new OracleParameter(
                "P_RETORNO",
                OracleDbType.RefCursor,
                ParameterDirection.Output));

            if (cmd.Connection.State != ConnectionState.Open)
                await cmd.Connection.OpenAsync(ct);

            using var reader = await cmd.ExecuteReaderAsync(ct);
            return await MapearReaderAsync<T>(reader, ct);
        }

        // RefCursor -> 1 registro
        public static async Task<T?> ExecutarRefCursorIDAsync<T>(
            IDbConnection dbConnection,
            string storedProcedure,
            Dictionary<string, object?> parametros,
            CancellationToken ct = default)
            where T : new()
        {
            var registros = await ExecutarRefCursorAsync<T>(
                dbConnection,
                storedProcedure,
                parametros,
                ct);

            return registros.FirstOrDefault();
        }

        // RefCursor + parâmetros de saída
        public static async Task<(List<T> Registros, Dictionary<string, object?> Saidas)>
            ExecutarRefCursorComSaidasAsync<T>(
                IDbConnection dbConnection,
                string storedProcedure,
                Dictionary<string, object?> parametros,
                IEnumerable<ParametroOracle>? parametrosSaida = null,
                string nomeCursor = "P_RETORNO",
                CancellationToken ct = default)
            where T : new()
        {
            if (dbConnection is not OracleConnection oracleConn)
                throw new InvalidOperationException("A conexão precisa ser OracleConnection.");

            await using var cmd = oracleConn.CreateCommand();
            cmd.CommandText = storedProcedure;
            cmd.CommandType = CommandType.StoredProcedure;
            cmd.BindByName = true;

            AdicionarParametrosEntrada(cmd, parametros);

            if (parametrosSaida is not null)
            {
                foreach (var parametro in parametrosSaida)
                    cmd.Parameters.Add(CriarParametro(parametro));
            }

            cmd.Parameters.Add(new OracleParameter(
                nomeCursor,
                OracleDbType.RefCursor,
                ParameterDirection.Output));

            if (cmd.Connection.State != ConnectionState.Open)
                await cmd.Connection.OpenAsync(ct);

            List<T> registros;
            using (var reader = await cmd.ExecuteReaderAsync(ct))
            {
                registros = await MapearReaderAsync<T>(reader, ct);
            }

            var saidas = new Dictionary<string, object?>(
                StringComparer.OrdinalIgnoreCase);

            foreach (OracleParameter parametro in cmd.Parameters)
            {
                if (parametro.Direction == ParameterDirection.Input ||
                    string.Equals(
                        parametro.ParameterName,
                        nomeCursor,
                        StringComparison.OrdinalIgnoreCase))
                {
                    continue;
                }

                saidas[parametro.ParameterName] =
                    NormalizarValorSaida(parametro.Value);
            }

            return (registros, saidas);
        }
        // Function -> varchar2
        public static async Task<string> ExecutarFunctionAsync(
            IDbConnection dbConnection,
            string functionName,
            Dictionary<string, object?> parametros,
            CancellationToken ct = default)
        {
            if (dbConnection is not OracleConnection oracleConn)
                throw new InvalidOperationException("A conexão precisa ser OracleConnection.");

            await using var cmd = oracleConn.CreateCommand();
            cmd.CommandText = functionName;
            cmd.CommandType = CommandType.StoredProcedure;
            cmd.BindByName = true;

            var retorno = new OracleParameter(
                "P_RETORNO",
                OracleDbType.Varchar2,
                4000)
            {
                Direction = ParameterDirection.ReturnValue
            };
            cmd.Parameters.Add(retorno);

            AdicionarParametrosEntrada(cmd, parametros);

            if (cmd.Connection.State != ConnectionState.Open)
                await cmd.Connection.OpenAsync(ct);

            await cmd.ExecuteNonQueryAsync(ct);

            return NormalizarValorSaida(retorno.Value)?.ToString() ?? string.Empty;
        }

        // Function com múltiplas saídas
        public static async Task<Dictionary<string, object?>>
            ExecutarFunctionComMultiplasSaidasAsync(
                IDbConnection dbConnection,
                string functionName,
                Dictionary<string, object?> parametros,
                IEnumerable<ParametroOracle>? parametrosSaida = null,
                string nomeRetorno = "P_RETORNO",
                OracleDbType tipoRetorno = OracleDbType.Varchar2,
                int tamanhoRetorno = 4000,
                CancellationToken ct = default)
        {
            if (dbConnection is not OracleConnection oracleConn)
                throw new InvalidOperationException("A conexão precisa ser OracleConnection.");

            await using var cmd = oracleConn.CreateCommand();
            cmd.CommandText = functionName;
            cmd.CommandType = CommandType.StoredProcedure;
            cmd.BindByName = true;

            var retorno = new OracleParameter
            {
                ParameterName = nomeRetorno,
                OracleDbType = tipoRetorno,
                Direction = ParameterDirection.ReturnValue
            };

            if (PrecisaTamanho(tipoRetorno))
                retorno.Size = tamanhoRetorno;

            cmd.Parameters.Add(retorno);

            AdicionarParametrosEntrada(cmd, parametros);

            if (parametrosSaida is not null)
            {
                foreach (var parametro in parametrosSaida)
                    cmd.Parameters.Add(CriarParametro(parametro));
            }

            if (cmd.Connection.State != ConnectionState.Open)
                await cmd.Connection.OpenAsync(ct);

            await cmd.ExecuteNonQueryAsync(ct);

            var saidas = new Dictionary<string, object?>(
                StringComparer.OrdinalIgnoreCase)
            {
                [nomeRetorno] = NormalizarValorSaida(retorno.Value)
            };

            foreach (OracleParameter parametro in cmd.Parameters)
            {
                if (parametro.Direction is
                    ParameterDirection.Output or
                    ParameterDirection.InputOutput)
                {
                    saidas[parametro.ParameterName] =
                        NormalizarValorSaida(parametro.Value);
                }
            }

            return saidas;
        }
        public static async Task<string?> ExecutarFunctionNullableAsync(
            IDbConnection dbConnection,
            string functionName,
            Dictionary<string, object?> parametros,
            CancellationToken ct = default)
        {
            var retorno = await ExecutarFunctionAsync(
                dbConnection,
                functionName,
                parametros,
                ct);

            return string.IsNullOrWhiteSpace(retorno) ? null : retorno;
        }

        // Procedure simples
        public static async Task ExecutarProcedureAsync(
            IDbConnection dbConnection,
            string procedureName,
            Dictionary<string, object?> parametros,
            CancellationToken ct = default)
        {
            if (dbConnection is not OracleConnection oracleConn)
                throw new InvalidOperationException("A conexão precisa ser OracleConnection.");

            await using var cmd = oracleConn.CreateCommand();
            cmd.CommandText = procedureName;
            cmd.CommandType = CommandType.StoredProcedure;
            cmd.BindByName = true;

            AdicionarParametrosEntrada(cmd, parametros);

            if (cmd.Connection.State != ConnectionState.Open)
                await cmd.Connection.OpenAsync(ct);

            await cmd.ExecuteNonQueryAsync(ct);
        }

        // Procedure simples - nomenclatura em português
        public static async Task ExecutarProcedimentoAsync(
            IDbConnection dbConnection,
            string nomeProcedimento,
            Dictionary<string, object?> parametros,
            CancellationToken ct = default)
        {
            await ExecutarProcedureAsync(
                dbConnection,
                nomeProcedimento,
                parametros,
                ct);
        }

        // Procedure com saídas
        public static async Task<Dictionary<string, object?>>
            ExecutarProcedureComSaidasAsync(
                IDbConnection dbConnection,
                string procedureName,
                Dictionary<string, object?> parametros,
                IEnumerable<ParametroOracle>? parametrosSaida = null,
                CancellationToken ct = default)
        {
            if (dbConnection is not OracleConnection oracleConn)
                throw new InvalidOperationException("A conexão precisa ser OracleConnection.");

            await using var cmd = oracleConn.CreateCommand();
            cmd.CommandText = procedureName;
            cmd.CommandType = CommandType.StoredProcedure;
            cmd.BindByName = true;

            AdicionarParametrosEntrada(cmd, parametros);

            if (parametrosSaida is not null)
            {
                foreach (var parametro in parametrosSaida)
                    cmd.Parameters.Add(CriarParametro(parametro));
            }

            if (cmd.Connection.State != ConnectionState.Open)
                await cmd.Connection.OpenAsync(ct);

            await cmd.ExecuteNonQueryAsync(ct);

            var saidas = new Dictionary<string, object?>(
                StringComparer.OrdinalIgnoreCase);

            foreach (OracleParameter parametro in cmd.Parameters)
            {
                if (parametro.Direction != ParameterDirection.Input)
                {
                    saidas[parametro.ParameterName] =
                        NormalizarValorSaida(parametro.Value);
                }
            }

            return saidas;
        }
        // Core
        private static void AdicionarParametrosEntrada(
            OracleCommand cmd,
            Dictionary<string, object?> parametros)
        {
            foreach (var (nome, valor) in parametros)
            {
                var parametro = cmd.CreateParameter();
                parametro.ParameterName = nome;
                parametro.Direction = ParameterDirection.Input;
                parametro.Value = valor ?? DBNull.Value;
                cmd.Parameters.Add(parametro);
            }
        }

        private static OracleParameter CriarParametro(
            ParametroOracle parametro)
        {
            var oracleParameter = new OracleParameter
            {
                ParameterName = parametro.Nome,
                Direction = parametro.Direcao,
                Value = parametro.Valor ?? DBNull.Value
            };

            if (parametro.Tipo.HasValue)
                oracleParameter.OracleDbType = parametro.Tipo.Value;

            if (parametro.Tipo.HasValue &&
                PrecisaTamanho(parametro.Tipo.Value) &&
                parametro.Size > 0)
            {
                oracleParameter.Size = parametro.Size;
            }

            return oracleParameter;
        }

        public static async Task<bool> ExecutarBlocoBooleanoAsync(
            IDbConnection dbConnection,
            string blocoPlSql,
            Dictionary<string, object?> parametros,
            int commandTimeoutSegundos,
            CancellationToken ct = default,
            string nomeParametroRetorno = "P_RETORNO")
        {
            if (dbConnection is not OracleConnection oracleConn)
                throw new InvalidOperationException(
                    "A conexão precisa ser OracleConnection.");

            await using var cmd = oracleConn.CreateCommand();

            cmd.CommandText = blocoPlSql;
            cmd.CommandType = CommandType.Text;
            cmd.BindByName = true;
            cmd.CommandTimeout = commandTimeoutSegundos;

            AdicionarParametrosEntrada(cmd, parametros);

            var retorno = new OracleParameter
            {
                ParameterName = nomeParametroRetorno,
                OracleDbType = OracleDbType.Decimal,
                Direction = ParameterDirection.Output
            };

            cmd.Parameters.Add(retorno);

            if (cmd.Connection.State != ConnectionState.Open)
                await cmd.Connection.OpenAsync(ct);

            await cmd.ExecuteNonQueryAsync(ct);

            var valor = NormalizarValorSaida(retorno.Value);

            if (valor is null)
            {
                throw new InvalidOperationException(
                    $"O bloco PL/SQL não retornou valor " +
                    $"no parâmetro '{nomeParametroRetorno}'.");
            }

            var resultado = Convert.ToDecimal(
                valor,
                CultureInfo.InvariantCulture);

            return resultado switch
            {
                0 => false,
                1 => true,
                _ => throw new InvalidOperationException(
                    $"O parâmetro '{nomeParametroRetorno}' do bloco PL/SQL " +
                    $"deve retornar 0 ou 1. " +
                    $"Valor recebido: {resultado}.")
            };
        }

        private static async Task<List<T>> MapearReaderAsync<T>(
            IDataReader reader,
            CancellationToken ct)
            where T : new()
        {
            var resultado = new List<T>();

            var propriedades = typeof(T)
                .GetProperties(BindingFlags.Public | BindingFlags.Instance)
                .Where(p => p.SetMethod?.IsPublic == true && p.GetIndexParameters().Length == 0)
                .ToArray();

            var mapaColunas = BuildColumnMap(reader);

            while (await ((System.Data.Common.DbDataReader)reader)
                       .ReadAsync(ct))
            {
                var item = new T();

                foreach (var propriedade in propriedades)
                {
                    if (!TryGetOrdinal(
                        mapaColunas,
                        propriedade.Name,
                        out var ordinal))
                    {
                        continue;
                    }

                    var valor = reader.GetValue(ordinal);
                    if (valor is DBNull || IsOracleNull(valor))
                        continue;

                    var tipoDestino =
                        Nullable.GetUnderlyingType(
                            propriedade.PropertyType)
                        ?? propriedade.PropertyType;

                    try
                    {
                        propriedade.SetValue(
                            item,
                            ConvertToTarget(valor, tipoDestino));
                    }
                    catch (Exception ex) when (ex is FormatException or
                        InvalidCastException or OverflowException or
                        ArgumentException or TargetInvocationException)
                    {
                        throw new DataException(
                            $"Não foi possível mapear a coluna '{reader.GetName(ordinal)}' " +
                            $"para '{typeof(T).Name}.{propriedade.Name}' " +
                            $"({propriedade.PropertyType.Name}).",
                            ex);
                    }
                }

                resultado.Add(item);
            }

            return resultado;
        }

        private static Dictionary<string, int> BuildColumnMap(
            IDataRecord reader)
        {
            var mapa = new Dictionary<string, int>(
                StringComparer.OrdinalIgnoreCase);

            for (var i = 0; i < reader.FieldCount; i++)
            {
                var nome = reader.GetName(i) ?? string.Empty;
                var normalizado = Normalize(nome);

                if (!mapa.TryAdd(normalizado, i))
                {
                    throw new DataException(
                        $"O resultado contém colunas ambíguas após normalização: '{nome}'. " +
                        "Use aliases distintos na consulta.");
                }
            }

            return mapa;
        }

        private static bool TryGetOrdinal(
            Dictionary<string, int> mapa,
            string nomePropriedade,
            out int ordinal)
        {
            var direto = Normalize(nomePropriedade);
            if (mapa.TryGetValue(direto, out ordinal))
                return true;

            var snakeCase = Normalize(
                ToSnakeUpper(nomePropriedade));

            if (mapa.TryGetValue(snakeCase, out ordinal))
                return true;

            ordinal = -1;
            return false;
        }

        private static string Normalize(string valor)
        {
            if (string.IsNullOrWhiteSpace(valor))
                return string.Empty;

            var builder = new StringBuilder(valor.Length);

            foreach (var caractere in valor)
            {
                if (char.IsLetterOrDigit(caractere))
                    builder.Append(
                        char.ToUpperInvariant(caractere));
            }

            return builder.ToString();
        }

        private static string ToSnakeUpper(string valor)
        {
            if (string.IsNullOrWhiteSpace(valor))
                return string.Empty;

            var builder = new StringBuilder(valor.Length + 8);

            for (var i = 0; i < valor.Length; i++)
            {
                var caractere = valor[i];

                if (char.IsUpper(caractere) &&
                    i > 0 &&
                    char.IsLetterOrDigit(valor[i - 1]))
                {
                    builder.Append('_');
                }

                builder.Append(
                    char.ToUpperInvariant(caractere));
            }

            return builder.ToString();
        }

        private static object? ConvertToTarget(
            object valor,
            Type tipoDestino)
        {
            valor = DesembrulharValorOracle(valor);

            if (tipoDestino.IsInstanceOfType(valor))
                return valor;

            if (tipoDestino == typeof(string))
                return valor.ToString();

            if (tipoDestino == typeof(DateTime))
            {
                if (valor is DateTime data)
                    return data;

                return Convert.ToDateTime(valor);
            }

            if (tipoDestino == typeof(decimal))
                return Convert.ToDecimal(valor);

            if (tipoDestino == typeof(int))
                return Convert.ToInt32(valor);

            if (tipoDestino == typeof(long))
                return Convert.ToInt64(valor);

            if (tipoDestino == typeof(double))
                return Convert.ToDouble(valor);

            if (tipoDestino == typeof(bool))
            {
                if (valor is bool booleano)
                    return booleano;

                var texto = valor.ToString()?.Trim();

                if (string.Equals(
                    texto,
                    "S",
                    StringComparison.OrdinalIgnoreCase))
                {
                    return true;
                }

                if (string.Equals(
                    texto,
                    "N",
                    StringComparison.OrdinalIgnoreCase))
                {
                    return false;
                }

                if (int.TryParse(texto, out var numero))
                    return numero != 0;

                return Convert.ToBoolean(valor);
            }

            if (tipoDestino.IsEnum)
                return Enum.ToObject(
                    tipoDestino,
                    Convert.ToInt32(valor));

            return Convert.ChangeType(valor, tipoDestino);
        }

        private static object DesembrulharValorOracle(object valor)
        {
            return valor switch
            {
                OracleString oracleString => oracleString.Value,
                OracleDecimal oracleDecimal => oracleDecimal.Value,
                OracleDate oracleDate => oracleDate.Value,
                OracleTimeStamp oracleTimestamp => oracleTimestamp.Value,
                OracleTimeStampTZ oracleTimestampTz =>
                    oracleTimestampTz.Value,
                OracleTimeStampLTZ oracleTimestampLtz =>
                    oracleTimestampLtz.Value,
                _ => valor
            };
        }

        private static object? NormalizarValorSaida(object? valor)
        {
            if (valor is null ||
                valor is DBNull ||
                IsOracleNull(valor))
            {
                return null;
            }

            return DesembrulharValorOracle(valor);
        }

        private static bool PrecisaTamanho(
            OracleDbType tipo)
        {
            return tipo is
                OracleDbType.Varchar2 or
                OracleDbType.NVarchar2 or
                OracleDbType.Char or
                OracleDbType.NChar or
                OracleDbType.Raw or
                OracleDbType.LongRaw;
        }

        public static bool IsOracleNull(object? value)
        {
            if (value is null)
                return true;

            return value switch
            {
                OracleString oracleString => oracleString.IsNull,
                OracleDecimal oracleDecimal => oracleDecimal.IsNull,
                OracleDate oracleDate => oracleDate.IsNull,
                OracleBlob oracleBlob => oracleBlob.IsNull,
                OracleClob oracleClob => oracleClob.IsNull,
                OracleBinary oracleBinary => oracleBinary.IsNull,
                OracleTimeStamp oracleTimestamp =>
                    oracleTimestamp.IsNull,
                OracleTimeStampTZ oracleTimestampTz =>
                    oracleTimestampTz.IsNull,
                OracleTimeStampLTZ oracleTimestampLtz =>
                    oracleTimestampLtz.IsNull,
                OracleXmlType oracleXml => oracleXml.IsNull,
                _ => false
            };
        }
    }

    public sealed class ParametroOracle
    {
        public ParametroOracle(
            string nome,
            object? valor,
            ParameterDirection direcao =
                ParameterDirection.Input,
            OracleDbType? tipo = null,
            int size = 4000)
        {
            Nome = nome;
            Valor = valor;
            Direcao = direcao;
            Tipo = tipo;
            Size = size;
        }

        public object? Valor { get; set; }
        public string Nome { get; set; }
        public OracleDbType? Tipo { get; set; }
        public int Size { get; set; }
        public ParameterDirection Direcao { get; set; }
    }
}
