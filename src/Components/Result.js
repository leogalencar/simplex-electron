export default function Result({ tables, answer }) {

    return (
        <div className="mt-5">
            <h1 className="text-center mb-5">Resolução</h1>
            <div className="px-5 mb-5">
            Resposta:
                <ul>
                    {(answer) && answer.map((pair, i) => {
                        return (
                            <li key={i}>{pair.letter}: {Math.round((pair.value + Number.EPSILON) * 100) / 100}</li>
                        );
                    })}
                </ul>
            </div>
            {(tables) && tables.map((table, i) => {
                return (
                    <div className="mb-5 px-5" key={i}>
                        <h3>
                            {(i > 0) ? (
                                `Fase ${(answer && table.table[0].length - 1 === answer.length) ? "2 (Z)" : "1 (W)"} - Iteração ${i}`
                            ) : (
                                "Tabela inicial"
                            )}
                            {(i === tables.length - 1) && " (Solução Ótima)"}
                        </h3>
                        
                        
                        <div className="table-responsive">
                            <table className="table table-bordered table-striped">
                                <thead className="bg-primary">
                                    {table.table[0].map((el, j) => {
                                        return (
                                            <th className="text-center" scope="col" key={j}>
                                                {el}
                                            </th>
                                        );
                                    })}
                                </thead>
                                <tbody className="table-group-divider">
                                    {table.table.map((row, j) => {
                                        if (j === 0) {
                                            return "";
                                        }
                                        return (
                                            <tr className="text-center" key={j}>
                                                {row.map((el, k) => {
                                                    return (
                                                        <td key={k}>{Math.round((el + Number.EPSILON) * 100) / 100}</td>
                                                    );
                                                })}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            {(table.operations.length > 0) && (
                                <div>
                                    <h5>Operações</h5>
                                    <ul>
                                        {table.operations.map((operation, j) => {
                                            return (
                                                <li key={j}>{operation}</li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
