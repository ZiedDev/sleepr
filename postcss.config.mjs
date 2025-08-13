const postCssConfig = {
    plugins: {
        'postcss-preset-env': {
            autoprefixer: {
                flexbox: 'no-2009',
                grid: 'autoplace',
            },
            stage: 3,
            features: {
                'custom-properties': false,
            },
        },
        autoprefixer: {},
    },
};

export default postCssConfig