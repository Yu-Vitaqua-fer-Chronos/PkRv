() => {
    // Write your code here.

    const client: import('revolt.js').Client = (window as any).controllers.client.getReadyClient();
    console.log('Received Client:', client.user.username);

    return ({
        onUnload: () => {
            // This runs when the plugin is disabled or unloaded.
            console.log('Plugin unloaded');
        }
    });
};
