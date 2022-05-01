(state: any) => ({
    onClient: (client: import('revolt.js').Client) => {
        console.log('Received Client:', client.user.username);
    },
    onUnload: () => console.log('Plugin unloaded'),
});
