module.exports = {
    "extends": "@resolution/eslint-config/profile/react",
    "parserOptions": { 
        "tsconfigRootDir": __dirname, 
        "project": "./tsconfig.json" 
    },
    rules: {
        "no-console": "off",
    }
}
