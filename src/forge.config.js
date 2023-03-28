module.exports = {
    publishers: [
        {
            name: '@electron-forge/publisher-github',
            config: {
                repository: {
                    owner: 'Benjamim Krug',
                    name: 'github-repo-name',
                },
                prerelease: false,
                draft: true,
            },
        },
    ],
}