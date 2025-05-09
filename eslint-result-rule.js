/**
 * @fileoverview Regel som identifierar användning av utdaterade Result-API-metoder
 * @author Pling Team
 */

"use strict";

// ------------------------------------------------------------------------------
// Regelimplementation
// ------------------------------------------------------------------------------

/**
 * @type {import('eslint').Rule.RuleModule}
 */
module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Identifierar användning av utdaterade Result-API-metoder",
      category: "Best Practices",
      recommended: true,
    },
    fixable: "code",
    schema: [], // inga options
    messages: {
      useValueProperty: "Använd .value istället för .getValue()",
      useErrorProperty: "Använd .error istället för .getError()",
      avoidUnwrap: "Kontrollera result.isOk() och använd .value istället för .unwrap()",
      avoidUnwrapOr: "Använd result.isOk() ? result.value : defaultValue istället för .unwrapOr()"
    }
  },

  create(context) {
    return {
      // Hitta anrop till getValue()
      "CallExpression[callee.property.name='getValue']"(node) {
        context.report({
          node,
          messageId: "useValueProperty",
          fix(fixer) {
            return fixer.replaceText(node, `${context.getSourceCode().getText(node.callee.object)}.value`);
          }
        });
      },

      // Hitta anrop till getError()
      "CallExpression[callee.property.name='getError']"(node) {
        context.report({
          node,
          messageId: "useErrorProperty",
          fix(fixer) {
            return fixer.replaceText(node, `${context.getSourceCode().getText(node.callee.object)}.error`);
          }
        });
      },

      // Hitta anrop till unwrap()
      "CallExpression[callee.property.name='unwrap']"(node) {
        context.report({
          node,
          messageId: "avoidUnwrap",
          // Ingen automatisk fix eftersom det behövs en omskrivning med kontroll
        });
      },

      // Hitta anrop till unwrapOr()
      "CallExpression[callee.property.name='unwrapOr']"(node) {
        context.report({
          node,
          messageId: "avoidUnwrapOr",
          // Ingen automatisk fix eftersom det behövs en omskrivning med kontroll
        });
      }
    };
  }
}; 