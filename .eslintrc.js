module.exports = {
    "extends": "@resolution/eslint-config/profile/react",
    "parserOptions": { 
        "tsconfigRootDir": __dirname, 
        "project": "./tsconfig.json" 
    },
    rules: {
        "react/react-in-jsx-scope": 'off'
    }
}
