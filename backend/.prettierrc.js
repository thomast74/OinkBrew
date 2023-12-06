module.exports = {
  plugins: [require.resolve('@trivago/prettier-plugin-sort-imports')],
  printWidth: 100,
  singleQuote: true,
  trailingComma: 'all',
  tabWidth: 2,
  importOrder: ["^@nestjs/(.*)$", "^rxjs/(.*)$", "^mongoose/(.*)$", "<THIRD_PARTY_MODULES>", "^[./]"],
  importOrderParserPlugins: ['typescript', 'decorators-legacy'],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true,
};
