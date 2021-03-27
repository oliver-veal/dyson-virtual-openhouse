module.exports = {
  extends: ['stylelint-config-standard', 'stylelint-config-prettier'],
  plugins: ['stylelint-order'],
  rules: {
    'custom-property-empty-line-before': 'never',
    'declaration-empty-line-before': 'never',
    'order/order': ['custom-properties', 'declarations'],
    'order/properties-alphabetical-order': true,
  },
}
