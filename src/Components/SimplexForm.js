import { useState } from "react";

import { Button, Form, Row, Col } from "react-bootstrap";

export default function SimplexForm({ getSimplexResults, handleClear, error }) {
    const [numVariables, setNumVariables] = useState(0);
    const [numRestrictions, setNumRestrictions] = useState(0);
    const [objFuncCoefficients, setObjFuncCoefficients] = useState([]);
    const [restrictionsCoefficients, setRestrictionsCoefficients] = useState([]);
    const [maximize, setMaximize] = useState(true);
    const [safeMode, setSafeMode] = useState(true);

    const tolerate = 1e-10;

    function handleVariablesNumChange(e) {
        if (e.target.value > numVariables) {
            setObjFuncCoefficients(
                objFuncCoefficients.concat(
                    Array(e.target.value - numVariables).fill(0)
                )
            );
        } else {
            setObjFuncCoefficients(
                objFuncCoefficients.slice(0, e.target.value)
            );
        }

        setNumVariables(Number(e.target.value));
    }

    function handleRestrictionsNumChange(e) {
        if (e.target.value > numRestrictions) {
            
            const len = Number(numVariables) + 2;

            setRestrictionsCoefficients(
                restrictionsCoefficients.concat(
                    Array.from({ length: e.target.value - numRestrictions }, () => Array.from({ length: len - 2 }).fill(0).concat([1, 0]))
                )
            );
        } else {
            setRestrictionsCoefficients(
                restrictionsCoefficients.slice(0, e.target.value)
            );
        }

        setNumRestrictions(Number(e.target.value));
    }

    function handleObjFuncCoefficientsChange(e) {
        const index = e.target.id.split("_")[1] - 1;
        const value = e.target.value;

        const newCoefficients = objFuncCoefficients.map((item, i) => {
            if (i === index) {
                return Number(value);
            }
            return item;
        });

        setObjFuncCoefficients(newCoefficients);
    }

    function handleRestrCoefficientsChange(e) {
        const row = e.target.id.split("_")[0] - 1;
        const col = e.target.id.split("_")[1] - 1;
        const value = e.target.value;

        const newCoefficients = restrictionsCoefficients.map((restriction, i) => {
            if (i === row) {
                return restriction.map((item, j) => {
                    if (j === col) {
                        return Number(value);
                    }
                    return item;
                });
            }
            return restriction;
        });

        setRestrictionsCoefficients(newCoefficients);
    }

    function doSimplex(numVariables, numRestrictions, objFuncCoefficients, restrictions, mode, safeMode) {
        // Step by step simplex method

        let error;

        if (numVariables === 0 || numRestrictions === 0) {
            error = "O número de variáveis e o número de restrições têm que ser maiores que 0";
            return [null, null, error];
        }

        // Get initial data
        const [objFunc, artificialObjFunc, newRestrictions] = transformData(numVariables, numRestrictions, objFuncCoefficients, restrictions, mode);
        let tables = [];

        // Making the first simplex table
        let table = [];
        let n_rows = numRestrictions + 2;
        let n_cols = numVariables + 2 * numRestrictions + 3;

        table.push(objFunc);

        for (let i = 0; i < numRestrictions; i++) {
            table.push(newRestrictions[i]);
        }

        table.push(artificialObjFunc);

        // Phase 1
        addInfo(tables, table, [], n_cols, n_rows, numRestrictions, numVariables);

        let [new_table, signal] = simplexPhase(1, table, tables, n_rows, n_cols, numVariables, numRestrictions, safeMode);

        if (signal) {
            error = "O algoritmo excedeu a quantidade máxima de iterações limitadas pelo modo seguro.";
            return [null, null, error];
        }

        // Artificial objective function is not zeroed
        if (new_table[n_rows - 1][n_cols - 1] > tolerate || new_table[n_rows - 1][n_cols - 1] < -tolerate) {
            error = "A solução não é viável";
            return [tables, null, error, 1];
        }
        

        // Phase 2
        new_table = new_table.slice(0, n_rows - 1).map((row, i) => {
            return row.slice(0, numVariables + numRestrictions).concat(row[n_cols - 3]).concat(row[n_cols - 1]); 
        });

        n_rows = new_table.length;
        n_cols = new_table[0].length;

        [new_table, signal] = simplexPhase(2, new_table, tables, n_rows, n_cols, numVariables, numRestrictions, safeMode);

        if (signal) {
            error = "O algoritmo excedeu a quantidade máxima de iterações limitadas pelo modo seguro.";
            return [null, null, error];
        }

        let ans = [];

        let last_table = tables[tables.length - 1].table;

        for (let i = 0; i < n_cols - 1; i++) {
            let sum = 0;
            let pos = 0;

            for (let j = 1; j < n_rows + 1; j++) {
                if (Math.abs(last_table[j][i]) === 1){
                    pos = j;
                }
                
                sum += Math.abs(last_table[j][i]);
            }
            
            if (sum === 1) {
                ans.push({"letter": last_table[0][i], "value": last_table[pos][n_cols - 1]});
            } else {
                ans.push({"letter": last_table[0][i], "value": 0});
            }
        }

        return [tables, ans];
    }

    function simplexPhase(phase, table, tables, n_rows, n_cols, numVariables, numRestrictions, safeMode) {
        let signal = false;
        let count = 0;

        while (safeMode === 0 ? true : count < 100) {

            // Getting pivot column
            let lowest_col = 0;
            let pivot_col = 0;
            let objFunc

            if (phase === 1) {
                objFunc = table[n_rows - 1];
            } else if (phase === 2) {
                objFunc = table[0];
            } else {
                break;
            }

            let subtract = (n_rows > numRestrictions + 1) ? n_cols - 3 - numRestrictions : n_cols - 2;

            for (let i = 0; i < subtract; i++) {
                if (objFunc[i] < lowest_col) {
                    lowest_col = objFunc[i];
                    pivot_col = i;
                }
            }

            // Break if there are no negatives
            if (lowest_col >= -tolerate) {
                break;
            }

            // Getting pivot row
            let lowest_row = Number.MAX_VALUE;
            let pivot_row = 0;
            let division = 0;

            for (let i = 1; i < n_rows; i++) {
                if (table[i][pivot_col] !== 0) {
                    division = table[i][n_cols - 1] / table[i][pivot_col];
                }

                if (division > 0 && division < lowest_row) {
                    lowest_row = division;
                    pivot_row = i;
                }
            }

            // Making pivot one
            let operations = [];
            let pivot = table[pivot_row][pivot_col];
            
            let newRow = table[pivot_row].map(value => value / pivot);
            let newTable = [...table];

            newTable[pivot_row] = newRow;

            operations.push(`L${pivot_row + 1} / ${pivot}`);

            // for (let i = 0; i < n_cols; i++) {
            //     table[pivot_row][i] = (table[pivot_row][i] / pivot);
            // }

            // Escalation
            for (let i = 0; i < n_rows; i++) {
                if (i !== pivot_row) {
                    // let c = table[i][pivot_col];
                    let c = newTable[i][pivot_col];

                    let newRow = newTable[i].map((value, j) => value - (newTable[pivot_row][j] * c));

                    operations.push(`L${i + 1} - (L${pivot_row + 1} * ${c})`);

                    newTable[i] = newRow;

                    // for (let j = 0; j < n_cols; j++) {
                    //     table[i][j] = table[i][j] - (table[pivot_row][j] * c)
                    // }
                }
            }

            table = newTable;

            addInfo(tables, table, operations, n_cols, n_rows, numRestrictions, numVariables);

            count++;
        }

        if (count === 100) signal = true;

        return [table, signal];
    }

    function transformData(numVariables, numRestrictions, objFuncCoefficients, restrictions, mode) {
        let newObjFuncCoefficients = [...objFuncCoefficients];
        let newRestrictions = restrictions.map(r => {return r.map(i => {return i})});

        // Transform the restrictions
        let restrictionsCoefficients = []

        for (let i = 0; i < numRestrictions; i++) {

            // Slack variables
            for (let j = 0; j < numRestrictions; j++) {
                let value = 99;
                let sign = numVariables + j;

                if (newRestrictions[i][sign] === 1) {
                    value = 1;
                }
                else if (newRestrictions[i][sign] === 2) {
                    value = 0;
                }
                else if (newRestrictions[i][sign] === 3) {
                    value = -1;
                }

                newRestrictions[i].splice(sign, 0, (i === j) ? value : 0);
            }

            // Artificial variables
            for (let j = 0; j < numRestrictions; j++) {
                let value = 99;
                let sign = numVariables + numRestrictions + j;

                if (newRestrictions[i][sign] === 2 || newRestrictions[i][sign] === 3) {
                    value = 1;
                }
                else {
                    value = 0;
                }

                newRestrictions[i].splice(sign, 0, (i === j) ? value : 0);
            }

            // Objective functions
            for (let j = 0; j < 2; j++) {
                let sign = numVariables + 2 * numRestrictions + j;

                newRestrictions[i].splice(sign, 0, 0);
            }
        }

        restrictionsCoefficients = newRestrictions.map((restriction, i) => {
            return restriction.filter((el, j) => j !== restriction.length - 2);
        });


        // Make the objective function canonical
        const len = newRestrictions[0].length;

        let canonObjFunc = newObjFuncCoefficients.map(item => item * - 1).concat(Array.from({ length: len - numVariables - 1 }, () => 0));
        canonObjFunc[len - 4] = 1;


        // Check if mode is minimize (false)
        if (!mode) {
            // Multiply the objective function coefficients by -1
            canonObjFunc = canonObjFunc.map((item) => item * -1);
        }


        // Artificial objective function
        const sign = len - 2;
        let canonArtificialObjFunc = Array.from({ length: len - 1 }, () => 0);

        for (let i = 0; i < numRestrictions; i++) {
            if (newRestrictions[i][sign] !== 1) {
                for (let j = 0; j < len - 1; j++) {
                    if (j < numVariables + numRestrictions || j >= numVariables + 2 * numRestrictions)
                    canonArtificialObjFunc[j] +=  -1 * restrictionsCoefficients[i][j];
                }
            }
        }

        canonArtificialObjFunc[len - 3] = -1;

        return [canonObjFunc, canonArtificialObjFunc, restrictionsCoefficients];
    }

    function addInfo(tables, table, operations, n_cols, n_rows, numRestrictions, numVariables) {
        let info_row = [];

        for (let i = 0; i < n_cols; i++) {
            if (i < numVariables) {
                info_row.push(`X${i + 1}`);
            }
            else if (i < numVariables + numRestrictions) {
                info_row.push(`S${i - numVariables + 1}`);
            }
            else if (n_rows > numRestrictions + 1 && i < numVariables + 2 * numRestrictions){
                info_row.push(`A${i - numVariables - numRestrictions + 1}`);
            }
        }

        info_row.push("Z");

        if (n_rows > numRestrictions + 1) {
            info_row.push("W");
        }

        info_row.push("T.I.");


        const newTable = [info_row, ...table]

        tables.push({operations: operations, table: newTable});
    }

    function clear() {
        const e = {target: {
            id: 0,
            value: ""
        }}

        handleVariablesNumChange(e);
        handleRestrictionsNumChange(e);
        setMaximize(true);

        handleClear();
    }

    // console.log("Obj:" + objFuncCoefficients);

    // if (restrictionsCoefficients.length > 0) {
    //     console.log("Res:" + JSON.stringify(restrictionsCoefficients));
    // }

    return (
        <>
            <h1 className="text-center mb-5">SP Simplex</h1>
            <Form className="w-75 mx-auto mb-5">
                <Row className="mb-3">
                    <Form.Group as={Col} md="6" controlId="numVariables">
                        <Form.Label>Número de variáveis</Form.Label>
                        <Form.Control
                            type="number"
                            placeholder="0"
                            onChange={(e) => handleVariablesNumChange(e)}
                            value={(numVariables === 0) ? "" : numVariables}
                        />
                    </Form.Group>
                    <Form.Group as={Col} md="6" controlId="numRestrictions">
                        <Form.Label>Número de restrições</Form.Label>
                        <Form.Control
                            type="number"
                            placeholder="0"
                            onChange={(e) => handleRestrictionsNumChange(e)}
                            value={(numRestrictions === 0) ? "" : numRestrictions}
                        />
                    </Form.Group>
                </Row>
                <Row className="mb-3">
                    <Form.Group as={Col}>
                        <div key={"default-radio"} className="mb-3">
                            <Form.Check
                                type="radio"
                                id="radio-maximizar"
                                label="Maximizar"
                                name="radio-group"
                                checked={maximize}
                                onChange={() => setMaximize(true)}
                            />
                            <Form.Check
                                type="radio"
                                id="radio-minimizar"
                                label="Minimizar"
                                name="radio-group"
                                checked={!maximize}
                                onChange={() => setMaximize(false)}
                            />
                        </div>
                    </Form.Group>
                </Row>
                <Row className="mb-3">
                    <Form.Group as={Col}>
                        <Form.Check
                            type="checkbox"
                            id="check-safemode"
                            label={`Modo seguro${safeMode ? " (recomendado)" : ""}`}
                            name="check-safemode"
                            checked={safeMode}
                            onChange={() => setSafeMode(!safeMode)}
                        />
                    </Form.Group>
                </Row>

                <div className="d-flex flex-column g-2 mb-3">
                    <div className="d-flex me-2 mb-3">
                        <h5>Função Objetivo (Z)</h5>
                    </div>
                    <div className="align-self-center">
                        <Row className="mb-3 g-3 row-grid">
                            <Variables numVariables={numVariables} row={0} handleChange={handleObjFuncCoefficientsChange} />
                        </Row>
                    </div>
                </div>

                <div className="d-flex flex-column g-2 mb-3">
                    <div className="d-flex me-2 mb-3">
                        <h5>Restrições</h5>
                    </div>
                    <div className="align-self-center">
                        <Restrictions numRestrictions={numRestrictions} numVariables={numVariables} handleChange={handleRestrCoefficientsChange} />
                    </div>
                </div>
                <Row className="mb-3 justify-content-center">
                    {/* <Form.Group
                        as={Col}
                        controlId="numVariables"
                        className="d-flex justify-content-center">
                        <Button onClick={() => handleSolve(numVariables, numRestrictions, objFuncCoefficients, restrictionsCoefficients, maximize)}>Resolver</Button>
                    </Form.Group> */}
                    <Form.Group
                        as={Col}
                        controlId="numVariables"
                        className="d-flex justify-content-center">
                        <Button onClick={() => getSimplexResults(doSimplex(numVariables, numRestrictions, objFuncCoefficients, restrictionsCoefficients, maximize, safeMode))}>Resolver</Button>
                    </Form.Group>
                </Row>
                <Row className="mb-3 justify-content-center">
                    <Form.Group
                        as={Col}
                        controlId="numVariables"
                        className="d-flex justify-content-center">
                        <Button onClick={() => clear()}>Limpar</Button>
                    </Form.Group>
                </Row>
            </Form>
            <h2 className="text-danger text-center">{error}</h2>
        </>
    );
}

function Restrictions({ numRestrictions, numVariables, handleChange }) {
    const restrictions_el_array = [];

    if (numRestrictions > 0) {
        for (let i = 0; i < numRestrictions; i++) {
            restrictions_el_array.push(
                <Restriction numVariables={numVariables} id={i+1} handleChange={handleChange} key={i} />
            );
        }

        return (
            <>
                {restrictions_el_array}
            </>
        );
    }

}

function Restriction({ numVariables, id, handleChange }) {

    return (
        <Row className="mb-3 g-3 row-grid" key={"row_" + id}>
            <Variables row={id} numVariables={numVariables} handleChange={handleChange} />
            <div className="col-auto d-flex align-items-center">
                <Form.Select aria-label="Select" id={`${id}_${Number(numVariables) + 1}`} onChange={handleChange}>
                    <option value="1">{"<="}</option>
                    <option value="2">{"="}</option>
                    <option value="3">{">="}</option>
                </Form.Select>
            </div>
            <div className="col-auto d-flex align-items-center">
                <Form.Control id={`${id}_${Number(numVariables) + 2}`} type="number" placeholder="0" onChange={handleChange} />
            </div>
        </Row>
    );
}


function Variables({ numVariables, handleChange, row }) {
    const arr = [];

    for (let i = 0; i < numVariables; i++) {
        let col = i + 1;
        let pos = {row: row, col: col}

        arr.push(<Variable pos={pos} id={i + 1} handleChange={handleChange} key={"xi_" + i} />);

        if (i < numVariables - 1) {
            arr.push(
                <div className="col-auto d-flex align-items-center" key={"label" + i}>
                    <Form.Label className="m-0">+</Form.Label>
                </div>
            );
        }
    }

    return (
        <>
            {arr}
        </>
    );
}

function Variable({ id, pos, handleChange }) {
    return (
        <div
            className="col-auto d-flex align-items-center"
            key={id}>
            <Form.Control
                type="number"
                placeholder="0"
                id={`${pos.row}_${pos.col}`}
                onChange={(e) => handleChange(e)}
            />
            <Form.Label className="m-0 ms-2">
                X<sub>{id}</sub>
            </Form.Label>
        </div>
    );
}