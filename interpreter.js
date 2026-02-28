// interpreter.js

function runBotScript(script, state) {

    // --- Persistent state ---
    let variables = { ...state };

    // Default move
    variables.move = variables.move || "C";

    function RANDOM() {
        return Math.random() < 0.5 ? "C" : "D";
    }

    // --- Tokenization ---
    function tokenize(code) {
        return code
            .replace(/#/g, "//") // allow comments
            .split(/\n/)
            .map(l => l.trim())
            .filter(l => l.length > 0 && !l.startsWith("//"));
    }

    const lines = tokenize(script);

    // --- Expression evaluator (safe math + logic only) ---
    function evaluate(expr) {
        expr = expr
            .replace(/\bAND\b/g, "&&")
            .replace(/\bOR\b/g, "||");

        // Replace variable names with values
        Object.keys(variables).forEach(key => {
            const value = typeof variables[key] === "string"
                ? `"${variables[key]}"`
                : variables[key];

            expr = expr.replace(
                new RegExp(`\\b${key}\\b`, "g"),
                value
            );
        });

        try {
            return Function(`"use strict"; return (${expr})`)();
        } catch {
            return false;
        }
    }

    // --- Block parser ---
    function executeBlock(startIndex) {
        let i = startIndex;

        while (i < lines.length) {

            let line = lines[i];

            // IF
            if (line.startsWith("IF ")) {

                const condition = line.match(/IF (.+) THEN \{/)[1];
                const result = evaluate(condition);

                i++; // move inside block

                if (result) {
                    i = executeBlock(i);
                    return i;
                } else {
                    // Skip block
                    i = skipBlock(i);

                    // Handle ELSE IF / ELSE
                    if (lines[i] && lines[i].startsWith("ELSE IF")) {
                        continue;
                    }
                    if (lines[i] && lines[i].startsWith("ELSE")) {
                        i++;
                        return executeBlock(i);
                    }
                }
            }

            // ELSE IF
            else if (line.startsWith("ELSE IF ")) {

                const condition = line.match(/ELSE IF (.+) THEN \{/)[1];
                const result = evaluate(condition);

                i++;

                if (result) {
                    i = executeBlock(i);
                    return i;
                } else {
                    i = skipBlock(i);
                }
            }

            // ELSE
            else if (line.startsWith("ELSE")) {
                i++;
                return executeBlock(i);
            }

            // End block
            else if (line === "}") {
                return i + 1;
            }

            // RETURN
            else if (line.startsWith("RETURN ")) {
                const value = line.replace("RETURN ", "");
                variables.move = evaluate(value);
                return lines.length; // stop execution
            }

            // Assignment
            else if (line.includes("=")) {
                const [varName, expr] = line.split("=");
                variables[varName.trim()] = evaluate(expr.trim());
            }

            i++;
        }

        return i;
    }

    function skipBlock(startIndex) {
        let depth = 1;
        let i = startIndex;

        while (i < lines.length && depth > 0) {
            if (lines[i].includes("{")) depth++;
            if (lines[i] === "}") depth--;
            i++;
        }

        return i;
    }

    executeBlock(0);

    return {
        move: variables.move,
        variables
    };
}
