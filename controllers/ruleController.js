const Rule = require('../models/rule');

// Utility function to split rule strings considering nested parentheses
const splitRule = (ruleString, operator) => {
    const parts = [];
    let currentPart = '';
    let depth = 0;
  
    for (let i = 0; i < ruleString.length; i++) {
      const char = ruleString[i];
  
      if (char === '(') {
        depth++;
      }
       if (char === ')') {
       
        depth--;
      } 
      if (depth === 0 && ruleString.substring(i, i + operator.length) === operator) {
        parts.push(currentPart.trim());
        currentPart = '';
        i += operator.length - 1; // Skip the operator
      } else {
        currentPart += char;
      }
    }
  
    if (currentPart.trim() !== '') {
      parts.push(currentPart.trim());
    }
    console.log(parts)
  
    return parts;
  };
  
  

// Main function to parse the rule string into an AST
const parseRule = (ruleString) => {
    ruleString = ruleString.trim();
  
    // Remove outermost parentheses if present
    if (ruleString.startsWith('(') && ruleString.endsWith(')')) {
      ruleString = ruleString.slice(1, -1).trim();
    }
  
    // Function to handle logical operators and nested conditions
    const parseNestedRule = (ruleString) => {
      const operators = ['AND', 'OR'];

      for (const operator of operators) {
        const parts = splitRule(ruleString, ` ${operator} `);
        if (parts.length > 1) {
          return {
            type: 'operator',
            left: parseNestedRule(parts[0]),
            right: parseNestedRule(parts.slice(1).join(` ${operator} `)), // Handle remaining parts
            value: operator
          };
        }
      }
  
      // If no operator is found, it's a single condition
      return { type: 'operand', value: parseCondition(ruleString) };
    };
  
    return parseNestedRule(ruleString);
  };
  

// Utility function to parse individual conditions
const parseCondition = (conditionString) => {
    conditionString = conditionString.trim();

    // Remove surrounding parentheses if present
    if (conditionString.startsWith('(') && conditionString.endsWith(')')) {
        conditionString = conditionString.slice(1, -1).trim();
    }

    // Check for logical operators in the condition
    const operators = ['AND', 'OR'];
    for (const operator of operators) {
        const parts = splitRule(conditionString, ` ${operator} `);
        if (parts.length > 1) {
            return {
                type: 'operator',
                left: parseCondition(parts[0]),
                right: parseCondition(parts.slice(1).join(` ${operator} `)),
                value: operator
            };
        }
    }

    // Pattern to handle different data types including strings and numbers
    const conditionPattern = /^(\w+)\s*([<>]=?|==|!=)\s*(\d+|'.*'|".*"|true|false)$/;
    ;
    const match = conditionString.match(conditionPattern);

    if (!match) {
        throw new Error(`Invalid condition format: ${conditionString}`);
    }

   const [, attribute, operator, value] = match;
    


    let parsedValue;
    if (value === 'true' || value === 'false') {
        parsedValue = value === 'true'; // Convert to boolean
    } else if (value.startsWith("'") || value.startsWith('"')) {
        parsedValue = value.slice(1, -1); // Remove surrounding quotes for strings
    } else if (!isNaN(value)) {
        parsedValue = parseFloat(value); // Convert to number
    } else {
        parsedValue = value; // Treat as string
    }

    return { attribute, operator, value: parsedValue };
};
// Function to parse individual conditions

// Controller functions
exports.createRule = async (req, res) => {
    try {
        const { name, ruleString } = req.body;
        console.log('Received request:', req.body); // Log the received request
        const rule = parseRule(ruleString);
        console.log('Parsed rule:', rule); // Log the parsed rule
        const newRule = new Rule({ name, rule });
        await newRule.save();
        res.status(201).json({ message: "Rule created successfully" });
    } catch (error) {
        console.error('Error creating rule:', error); // Log the error details
        res.status(500).json({ error: error.message });
    }
};

exports.combineRules = async (req, res) => {
    try {
        const { ruleStrings, name } = req.body;
        console.log('Received request:', { ruleStrings, name });

        if (!Array.isArray(ruleStrings) || !name) {
            throw new Error('Invalid request data');
        }

        const combinedAST = ruleStrings.reduce((combined, ruleString) => {
            const ast = parseRule(ruleString);
            if (!combined) return ast;
            return { type: 'operator', left: combined, right: ast, value: 'AND' };
        }, null);

        console.log('Combined AST:', combinedAST);

        // Check if a rule with the specified name already exists
        let existingRule = await Rule.findOne({ name: name });

        if (existingRule) {
            // Update the existing rule
            existingRule.rule = combinedAST;
            await existingRule.save();
            res.status(200).json({ combinedAST, message: "Rule updated successfully" });
        } else {
            // Create a new rule if it does not exist
            const newRule = new Rule({ name: name, rule: combinedAST });
            await newRule.save();
            res.status(201).json({ combinedAST, message: "Rule created successfully" });
        }
    } catch (error) {
        console.error('Error in combineRules:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.evaluateRule = async (req, res) => {
    try {
        const { rule, data } = req.body;
        console.log('Received request:', { rule, data });

        // Parse the rule into an AST
        const ruleAST = parseRule(rule);
        console.log('Parsed AST:', ruleAST); // Log parsed AST for debugging

        // Function to evaluate conditions
        const evaluateCondition = (condition, data) => {
            console.log("entered evalute");
            const { attribute, operator, value } = condition;
            const dataValue = data[attribute];
            console.log(data[attribute]);
            // Convert dataValue and value to the same type for comparison
            if ((typeof dataValue === 'string') && (typeof value === 'string')) {
                console.log("datatypes in if condition");
                switch (operator) {
                    case '==': return dataValue === value;
                    case '!=': return dataValue !== value;
                    default: return false;
                }
                
            } else if ((typeof dataValue == 'string') && (typeof value == 'number')) {
                console.log("datatypes in else if condition");
                switch (operator) {
                    case '>': return dataValue > value;
                    case '<': return dataValue < value;
                    case '>=': return dataValue >= value;
                    case '<=': return dataValue <= value;
                    case '==': return dataValue === value;
                    case '!=': return dataValue !== value;
                    default: return false;
                }
            } else if ((typeof dataValue === 'string') && (typeof value === 'boolean')) {
                console.log("datatypes in boolean condition");
                switch (operator) {
                    case '==': return dataValue === value;
                    case '!=': return dataValue !== value;
                    default: return false;
                }
            } else if ((dataValue instanceof Date) && (value instanceof Date)) {
                console.log("datatypes in date condition");
                switch (operator) {
                    case '==': return dataValue.getTime() === value.getTime();
                    case '!=': return dataValue.getTime() !== value.getTime();
                    default: return false;
                }
            }

            // If dataValue or value types are incompatible
            return false;
        };

        // Function to evaluate the AST
        const evaluate = (node, data) => {
            console.log('Evaluating node:', node);
            
            if (node.type === 'operand') {
                
                const result = evaluateCondition(node.value, data);
                console.log('Operand result:', result);
                return result;
            }
        
            const leftResult = evaluate(node.left, data);
            const rightResult = evaluate(node.right, data);
        
            console.log('Left result:', leftResult);
            console.log('Right result:', rightResult);
        
            switch (node.value) {
                case 'AND': return leftResult && rightResult;
                case 'OR': return leftResult || rightResult;
                default: return false;
            }
        };
        

        // Evaluate the rule against the data
        const result = evaluate(ruleAST, data);
        res.status(200).json({ result });
    } catch (error) {
        console.error('Error evaluating rule:', error);
        res.status(500).json({ error: error.message });
    }
};
