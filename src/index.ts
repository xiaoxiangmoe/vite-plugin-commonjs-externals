import * as acorn from 'acorn';
import * as esModuleLexer from 'es-module-lexer';
import type {
  ImportDefaultSpecifier,
  ImportNamespaceSpecifier,
  ImportSpecifier,
  Program,
} from 'estree';
import MagicString from 'magic-string';
import type { Plugin } from 'vite';

export interface CommonjsExternalsPluginOptions {
  readonly externals: ReadonlyArray<string | RegExp>;
  readonly exts?: ReadonlyArray<string>;
}

function transformEsm(
  imports: ReadonlyArray<esModuleLexer.ImportSpecifier>,
  code: string,
  externals: ReadonlyArray<string | RegExp>
) {
  const imports2 = imports
    .map(i => ({
      ...i,
      importStatement: code.substring(i.ss, i.se),
    }))
    .filter(
      ({ n, d }) =>
        // static import
        d === -1 &&
        n !== undefined &&
        externals.some(external =>
          typeof external === 'string'
            ? external === n
            : external instanceof RegExp
            ? external.test(n)
            : false
        )
    );

  if (imports2.length === 0) {
    return;
  }

  const magicString = new MagicString(code);
  imports2.forEach(({ importStatement, ss, se }) => {
    const program: Program = acorn.parse(importStatement, {
      ecmaVersion: 'latest',
      sourceType: 'module',
    }) as any;
    const node = program.body[0];

    if (node?.type !== 'ImportDeclaration') {
      return;
    }

    if (typeof node.source.value !== 'string') {
      return;
    }

    if (node.specifiers.length === 0) {
      magicString.overwrite(ss, se, `require('${node.source.value}')`);
      return;
    }

    const importNamespaceSpecifierList = node.specifiers.filter(
      x => x.type === 'ImportNamespaceSpecifier'
    ) as ReadonlyArray<ImportNamespaceSpecifier>;

    const importDefaultSpecifierList = node.specifiers.filter(
      x => x.type === 'ImportDefaultSpecifier'
    ) as ReadonlyArray<ImportDefaultSpecifier>;
    const importSpecifierList = node.specifiers.filter(
      x => x.type === 'ImportSpecifier'
    ) as ReadonlyArray<ImportSpecifier>;

    if (importNamespaceSpecifierList.length > 1) {
      throw new Error(
        `Illegal state of importNamespaceSpecifierList: it can only have zero or one namespace import. \`${importStatement}\``
      );
    }

    if (importDefaultSpecifierList.length > 1) {
      throw new Error(
        `Illegal state of importDefaultSpecifierList: it can only have zero or one default import. \`${importStatement}\``
      );
    }

    const requireStatement = (identifiers: string) =>
      `const ${identifiers}=(()=>{const mod = require("${node.source.value}");return mod && mod.__esModule ? mod : Object.assign(Object.create(null),mod,{default:mod,[Symbol.toStringTag]:"Module"})})();`;
    const localNamesIdentifiers = [
      ...importSpecifierList.map(
        spec => `${spec.imported.name}: ${spec.local.name}`
      ),
      ...importDefaultSpecifierList.map(spec => `default: ${spec.local.name}`),
    ].join(', ');

    if (importNamespaceSpecifierList.length === 0) {
      magicString.overwrite(
        ss,
        se,
        requireStatement(`{${localNamesIdentifiers}}`)
      );
      return;
    }

    const namespaceIdentifier = importNamespaceSpecifierList[0]!.local.name;
    const namespaceRequireStatement = requireStatement(namespaceIdentifier);

    if (localNamesIdentifiers === '') {
      magicString.overwrite(ss, se, namespaceRequireStatement);
      return;
    }

    magicString.overwrite(
      ss,
      se,
      namespaceRequireStatement +
        `const {${localNamesIdentifiers}}=${namespaceIdentifier};`
    );
  });
  return {
    code: magicString.toString(),
    map: magicString.generateMap(),
  };
}

const commonjsExternalsPlugin = ({
  externals,
  exts = ['ts', 'tsx', 'js', 'jsx', 'mjs', 'cjs', 'vue', 'svelte'],
}: CommonjsExternalsPluginOptions): Plugin => ({
  name: 'commonjs-externals',
  async transform(code, id) {
    if (!exts.some(ext => id.endsWith('.' + ext))) {
      return;
    }

    await esModuleLexer.init;
    const [imports] = esModuleLexer.parse(code);
    return transformEsm(imports, code, externals);
  },
});

export default commonjsExternalsPlugin;
