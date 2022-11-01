() => {
    const PK_TOKEN = "TOKEN GOES HERE"
    const API_URL = "https://api.pluralkit.me/v2/"
    const MEMBERS_URL = "systems/@me/members"

    function getPluralKitMembers() {
        fetch(API_URL+MEMBERS_URL, {
            headers: {'Authorization': PK_TOKEN}
        }).then(res => {
            return res.json();
        });
    }

    const members: any = getPluralKitMembers();

    const client: import('revolt.js').Client = (window as any).controllers.client.getReadyClient();
    console.log('Received Client:', client.user.username);

    client.on("message", async (message) => {
        if (message.author == client.user) {
            var m: any = null;

            for (let member in members) {
                for (let proxy in member['proxy_tags']) {
                    if (proxy['prefix'] && proxy['suffix']) {
                        if (message.content.startsWith(proxy['prefix']) && message.content.endsWith(proxy['suffix'])) {
                            m = member;
                            break;
                        }
                    } else if (proxy['prefix']) {
                        if (message.content.startsWith(proxy['prefix'])) {
                            m = member;
                            break;
                        }
                    } else {
                        if (message.content.endsWith(proxy['suffix'])) {
                            m = member;
                            break;
                        }
                    }
                }
                if (m != null) {break}
            }

            if (m != null) {
                var msgData = {masquerade: {}}

                if (m["display_name"]) {
                    msgData['name'] = m["display_name"]
                } else {
                    msgData['name'] = m["name"]
                }

                if (m["avatar_url"]) {
                    msgData['avatar'] = m["avatar_url"]
                }

                await message.channel!.sendMessage(msgData);
                await message.delete()
            }
        }
    });

    return ({
        onUnload: () => {
            console.log('Plugin unloaded');
        }
    });
};
