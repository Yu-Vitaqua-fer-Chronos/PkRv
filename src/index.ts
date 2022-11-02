() => {
    const PK_TOKEN = "QUEEEEEEEEEEEEER"
    const API_URL = "https://api.pluralkit.me/v2/"
    const MEMBERS_URL = "systems/@me/members"

    async function getPluralKitMembers() {
        console.log("[PkRv] Getting member list")
        var res = await fetch(API_URL+MEMBERS_URL, {
            headers: {'Authorization': PK_TOKEN}
        })

        let data = await res.json()
        console.log("[PkRv] Recieved JSON: "+data)
        return data
    }

    let members: any;
    getPluralKitMembers().then(m => {members = m})

    var client: import('revolt.js').Client = null;
    while (client == null) {
      client = (window as any).controllers.client.getReadyClient();
    }
    console.log('[PkRv] Received Client:', client.user.username);

    client.on("message", async (message) => {
        if (message.nonce == "DO_NOT_PROCESS") {return}

        if (message.author == client.user) {
            console.log("[PkRv] Message was ours")
            var m: any = null;

            console.log("[PkRv] Iterating through members")
            for (let memberIndex in members) {
                let member = members[memberIndex]
                console.log("[PkRv] On member "+member['name'])
                for (let proxyIndex in member['proxy_tags']) {
                    let proxy = member['proxy_tags'][proxyIndex]

                    console.log("[PkRv] Proxy tag: "+proxy)
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
                var msgData = {
                  content: message.content,
                  masquerade: {},
                  nonce: "DO_NOT_PROCESS"
                }

                if (m["display_name"]) {
                    msgData['masquerade']['name'] = m["display_name"]
                } else {
                    msgData['masquerade']['name'] = m["name"]
                }

                if (m["avatar_url"]) {
                    msgData['masquerade']['avatar'] = m["avatar_url"]
                }

                await message.channel!.sendMessage(msgData);
                await message.delete()
                console.log("[PkRv] Sent message with masq")
            }
        }
    });

    return ({
        onUnload: () => {
            console.log('[PkRv] Plugin unloaded');
        }
    });
};
