function runBot(code, context) {
    const lines = code.split("\n").map(l => l.trim());
    const variables = { ...context };

    let i = 0;

    function evalExpression(expr) {
        try {
            const keys = Object.keys(variables);
            const values = Object.values(variables);
            return new Function(...keys, "return " + expr)(...values);
        } catch {
            return 0;
        }
    }

    function runBlock() {
        while (i < lines.length) {
            let line = lines[i];

            if (!line || line.startsWith("#")) {
                i++;
                continue;
            }

            // END block
            if (line === "END") {
                i++;
                return;
            }

            // RETURN
            if (line.startsWith("RETURN")) {
                const value = line.replace("RETURN", "").trim();
                return evalExpression(value);
            }

            // IF
            if (line.startsWith("IF")) {
                const condition = line
                    .replace("IF", "")
                    .replace("THEN", "")
                    .trim();

                i++;
                const conditionResult = evalExpression(condition);

                if (conditionResult) {
                    const result = runBlock();
                    if (result !== undefined) return result;

                    // Skip ELSE block if it exists
                    if (lines[i] === "ELSE") {
                        i++;
                        skipBlock();
                    }
                } else {
                    skipBlock();

                    if (lines[i] === "ELSE") {
                        i++;
                        const result = runBlock();
                        if (result !== undefined) return result;
                    }
                }

                continue;
            }

            // ELSE (shouldn't happen alone, but skip safely)
            if (line === "ELSE") {
                i++;
                runBlock();
                continue;
            }

            // Assignment
            if (line.includes("=")) {
                const [name, expr] = line.split("=");
                variables[name.trim()] = evalExpression(expr.trim());
                i++;
                continue;
            }

            i++;
        }
    }

    function skipBlock() {
        let depth = 1;
        while (i < lines.length && depth > 0) {
            if (lines[i].startsWith("IF")) depth++;
            if (lines[i] === "END") depth--;
            i++;
        }
    }

    const result = runBlock();

    // 🔒 GUARANTEED RETURN
    if (result === "C" || result === "D") {
        return result;
    }

    return "C"; // default fallback
}
