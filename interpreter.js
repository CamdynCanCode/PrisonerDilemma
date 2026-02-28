// interpreter.js

function runBotScript(script, state) {
    const lines = script.split("\n").map(l => l.trim()).filter(l => l && !l.startsWith("#"));
    let variables = Object.assign({}, state); // copy of state
    let move = "C";
    let i = 0;

    function evaluateExpression(expr) {
        expr = expr.replace(/\bRANDOM\(\)/g, () => Math.random() < 0.5 ? '"C"' : '"D"');

        // Replace C and D literals
        expr = expr.replace(/\bC\b/g, '"C"');
        expr = expr.replace(/\bD\b/g, '"D"');

        // Replace variables
        for (let key in variables) {
            expr = expr.replace(new RegExp(`\\b${key}\\b`, "g"), JSON.stringify(variables[key]));
        }

        try {
            return eval(expr);
        } catch (e) {
            return false;
        }
    }

    while (i < lines.length) {
        let line = lines[i];
        if (line.startsWith("IF ")) {
            const condMatch = line.match(/IF (.+) THEN/);
            if (condMatch) {
                let condition = condMatch[1];
                let j = i+1;
                let executed = false;
                while (j < lines.length && lines[j].startsWith("    ")) {
                    const inner = lines[j].trim();
                    if (evaluateExpression(condition)) {
                        if (inner.startsWith("move =")) move = evaluateExpression(inner.split("=")[1].trim());
                        else if (inner.includes("=")) {
                            let [v, e] = inner.split("=");
                            variables[v.trim()] = evaluateExpression(e.trim());
                        }
                        executed = true;
                    }
                    j++;
                }
                i = j-1;
            }
        } else if (line.startsWith("ELSE IF ")) {
            const condMatch = line.match(/ELSE IF (.+) THEN/);
            if (condMatch) {
                let condition = condMatch[1];
                if (evaluateExpression(condition)) {
                    let inner = lines[i+1].trim();
                    if (inner.startsWith("move =")) move = evaluateExpression(inner.split("=")[1].trim());
                    else if (inner.includes("=")) {
                        let [v, e] = inner.split("=");
                        variables[v.trim()] = evaluateExpression(e.trim());
                    }
                }
            }
        } else if (line.startsWith("ELSE")) {
            let inner = lines[i+1].trim();
            if (inner.startsWith("move =")) move = evaluateExpression(inner.split("=")[1].trim());
            else if (inner.includes("=")) {
                let [v, e] = inner.split("=");
                variables[v.trim()] = evaluateExpression(e.trim());
            }
        } else if (line.startsWith("move =")) {
            move = evaluateExpression(line.split("=")[1].trim());
        } else if (line.startsWith("RETURN")) {
            move = evaluateExpression(line.split("RETURN")[1].trim());
            return {move, variables};
        } else if (line.includes("=")) {
            let [v, e] = line.split("=");
            variables[v.trim()] = evaluateExpression(e.trim());
        }
        i++;
    }
    return {move, variables};
}
