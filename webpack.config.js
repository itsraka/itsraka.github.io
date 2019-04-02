module.exports = {
    context: __dirname,
    entry: {
        companies: "./src/apps/companies",
        courses: "./src/apps/courses"
    },

    output: {
        path: __dirname + "/public",
        filename: "[name].js"
    },

    module: {
        rules: [
            {
                test: /\.ts?$/,
                loader: "ts-loader",
                exclude: /node_modules/
            }
        ]
    },

    resolve: {
        extensions: [".ts"]
    },

    plugins: []
};