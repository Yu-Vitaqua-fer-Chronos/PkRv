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

    var monkeyPatchedChannels: Map<import('revolt.js').Channel, boolean> = new Map()

    function monkeypatchChannelSend(channel: import('revolt.js').Channel) {
        if (!channel.havePermission("Masquerade")) {
            monkeyPatchedChannels.set(channel, false)
            return
        } else {
            monkeyPatchedChannels.set(channel, true)
        }

        let origSend = channel.sendMessage;

        async function customSendMessage(data: string | (Omit<{ attachments?: null | string[]; content?: null | string; embeds?: null | { colour?: null | string; description?: null | string; icon_url?: null | string; media?: null | string; title?: null | string; url?: null | string }[]; interactions?: null | { reactions?: null | string[]; restrict_reactions?: boolean }; masquerade?: null | { avatar?: null | string; colour?: null | string; name?: null | string }; nonce?: null | string; replies?: null | { id: string; mention: boolean }[] }, "nonce"> & { nonce?: string })): Promise<any> {
            var msgData: any = {}
            
            if (data['content']) {
                msgData = data;
            } else {
                msgData.content = data;
            }

            var m: any = null;
            var proxy_tag: any = null;

            for (let memberIndex in members) {
                let member = members[memberIndex]
                console.log("[PkRv] On member "+member['name'])
                for (let proxyIndex in member['proxy_tags']) {
                    let proxy = member['proxy_tags'][proxyIndex]

                    if (proxy['prefix'] != null && proxy['suffix'] != null && proxy['prefix'] != undefined && proxy['suffix'] != undefined) {
                        if (msgData.content.startsWith(proxy['prefix']) && msgData.content.endsWith(proxy['suffix'])) {
                            m = member;
                            proxy_tag = proxy;
                            break;
                        }
                    } else if (proxy['prefix'] != null && proxy['prefix'] != undefined) {
                        if (msgData.content.startsWith(proxy['prefix'])) {
                            m = member;
                            proxy_tag = proxy;
                            break;
                        }
                    } else {
                        if (msgData.content.endsWith(proxy['suffix'])) {
                            m = member;
                            proxy_tag = proxy;
                            break;
                        }
                    }
                }
                if (m != null) {break}
            }
            
            msgData['masquerade'] = {}

            if (proxy_tag['prefix'] != null && proxy_tag['prefix'] != undefined) {
              msgData.content = msgData.content.slice(proxy_tag['prefix'].length);
            } else if (proxy_tag['suffix'] != null && proxy_tag['suffix'] != undefined) {
              msgData.content = msgData.content.slice(undefined, -(proxy_tag['suffix'].length));
            }

            if (m["display_name"]) {
                msgData['masquerade']['name'] = m["display_name"]
            } else {
                msgData['masquerade']['name'] = m["name"]
            }

            if (m["avatar_url"]) {
                msgData['masquerade']['avatar'] = m["avatar_url"]
            }

            try {
                origSend(msgData);
            } catch (error) {
                origSend(data);
            }
        }

        channel.sendMessage = customSendMessage
    }

    var client: import('revolt.js').Client = client = (window as any).controllers.client.getReadyClient();
    console.log('[PkRv] Received Client:', client.user.username);

    client.on("message", async (message) => {
        if (message.author == client.user) {

            if (!monkeyPatchedChannels.has(message.channel)) {
                monkeypatchChannelSend(message.channel);
            }

            await message.channel!.sendMessage(message.content);
            await message.delete()
        }
    });

    return ({
        onUnload: () => {
            console.log('[PkRv] Plugin unloaded');
        }
    });
};
