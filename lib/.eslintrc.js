module.exports = {
  'extends': 'airbnb-base',
  'env': {
    'node': true,
    'jest': true,
  },
  'plugins': [
    'import',
  ],
  'rules': {
    'no-underscore-dangle': 'off',
    'no-use-before-define': ['error', { 'functions': false, 'classes': true }],
    'max-len': ['error', 120],
    'class-methods-use-this': 'off',
  }
};
