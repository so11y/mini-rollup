import walk from "./walk";
import Scope from "./scope";
import { ImportDeclaration } from "ledad/src/elements/ImportDeclaration";
import { Program } from "ledad/src/parse/parse";
import { MagicString } from "../magic-string-zr";
export const analyser = (ast: Program, magicString: MagicString) => {
  let scope = new Scope();
  let currentTopLevelStatement;
  function addToScope(declarator) {
    var name = declarator.id.name;
    scope.add(name, false);
    if (!scope.parent) {
      currentTopLevelStatement._defines[name] = true;
    }
  }
  function addToBlockScope(declarator) {
    var name = declarator.id.name;
    scope.add(name, true);
    if (!scope.parent) {
      currentTopLevelStatement._defines[name] = true;
    }
  }

  ast.body.forEach((statement) => {
    currentTopLevelStatement = statement;
    Object.defineProperties(statement, {
      _defines: { value: {} },
      _modifies: { value: {} },
      _dependsOn: { value: {} },
      _module: { value: module },
      _value: { value: magicString.snip(statement.start, statement.end) }, // TODO don't use snip, it's a waste of memory
    });
    walk(statement, {
      enter(node) {
        let newScope;

        switch (node.type) {
          case "FunctionExpression":
          case "FunctionDeclaration":
            let names = node.params.map((name) => name.name);
            if (node.type === "FunctionDeclaration") {
              addToScope(node);
            } else if (node.type === "FunctionExpression" && node.id) {
              names.push(node.id.name);
            }
            newScope = new Scope({
              parent: scope,
              params: names,
              block: false,
            });
            break;
          case "BlockStatement":
            newScope = new Scope({
              parent: scope,
              block: true,
            });

            break;
          case "VariableDeclaration":
            node.declarations.forEach(
              node.kind === "var" ? addToScope : addToBlockScope
            );
            break;
        }

        if (newScope) {
          Object.defineProperty(node, "_scope", { value: newScope });
          scope = newScope;
        }
      },
      leave(node) {
        if (node === currentTopLevelStatement) {
          currentTopLevelStatement = null;
        }

        if (node._scope) {
          scope = scope.parent;
        }
      },
    });
  });

  (ast as any).body.forEach((statement) => {
    function checkForReads(node, parent) {
      if (node.type === "Identifier") {
        // disregard the `bar` in `foo.bar` - these appear as Identifier nodes
        if (parent.type === "MemberExpression" && node !== parent.object) {
          return;
        }

        // disregard the `bar` in { bar: foo }
        if (parent.type === "Property" && node !== parent.value) {
          return;
        }

        const definingScope = scope.findDefiningScope(node.name);

        if (
          (!definingScope || definingScope.depth === 0) &&
          !statement._defines[node.name]
        ) {
          statement._dependsOn[node.name] = true;
        }
      }
    }

    function checkForWrites(node) {
      function addNode(node) {
        while (node.type === "MemberExpression") {
          node = node.object;
        }
        if (node.type !== "Identifier") {
          return;
        }
        statement._modifies[node.name] = true;
      }

      if (node.type === "CallExpression") {
        node.arguments.forEach((arg) => addNode(arg));
      }
    }

    walk(statement, {
      enter(node, parent) {
        if (ImportDeclaration.isImportDeclaration(node)) return this.skip();

        if (node._scope) scope = node._scope;

        checkForReads(node, parent);
        checkForWrites(node);
      },
      leave(node) {
        if (node._scope) scope = scope.parent;
      },
    });
    (ast as any)._scope = scope;
  });
};
