export const validation = (schema) => {
    return (req, res, next) => {
        if (!schema) return next();

        if (typeof schema.validate === 'function') {
            const validationResults = schema.validate(req.body, { aboortEarly: false });
            if (validationResults.error) {
                return res.status(400).json({
                    message: "Validation Error",
                    error: validationResults.error.message
                });
            }
            return next();
        }

        const targets = ['body', 'params', 'query'];
        for (const target of targets) {
            if (schema[target] && typeof schema[target].validate === 'function') {
                const validationResults = schema[target].validate(req[target] || {}, { aboortEarly: false });
                if (validationResults.error) {
                    return res.status(400).json({
                        message: `Validation Error in ${target}`,
                        error: validationResults.error.message
                    });
                }
            }
        }

        return next();
    };
};