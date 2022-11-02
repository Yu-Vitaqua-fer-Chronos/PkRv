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

		// Assigning right back on channel is required to be able to reuse it.
        channel['origSend'] = channel.sendMessage;
        channel.sendMessage = async function(data: string | (Omit<{ attachments?: null | string[]; content?: null | string; embeds?: null | { colour?: null | string; description?: null | string; icon_url?: null | string; media?: null | string; title?: null | string; url?: null | string }[]; interactions?: null | { reactions?: null | string[]; restrict_reactions?: boolean }; masquerade?: null | { avatar?: null | string; colour?: null | string; name?: null | string }; nonce?: null | string; replies?: null | { id: string; mention: boolean }[] }, "nonce"> & { nonce?: string })): Promise<any> {
            var msgData: any = {}
            
            if (data['content']) {
                msgData = data;
            } else {
                msgData.content = data;
            }

            var m: any = null;
            var proxy_tag: any = null;

            outer: for (let member of members) {
                console.log("[PkRv] On member "+member.name)
                for (let proxy of member.proxy_tags) {

					if (msgData.content.startsWith(proxy.prefix || "") && msgData.content.endsWith(proxy.suffix || "")) {
                        m = member;
                        proxy_tag = proxy;
                        break outer;
                    }
                }
            }

            if(m) {
                msgData.masquerade = {}

                var start = proxy_tag.prefix?.length ?? 0
                var end = msgData.content.length - (proxy_tag.suffix?.length ?? 0)

                msgData.content = msgData.content.slice(start, end);

				// Set the masquerade object.
                msgData.masquerade.name = m.display_name || m.name
                msgData.masquerade.avatar = m.avatar_url
            }

            await this.origSend(msgData);
        }
    }

    var client: import('revolt.js').Client = client = (window as any).controllers.client.getReadyClient();
    console.log('[PkRv] Received Client:', client.user.username);

    client.on("message", async (message) => {
        if (message.author == client.user && !monkeyPatchedChannels.has(message.channel)) {
            monkeypatchChannelSend(message.channel);

            // There is *no* reason to do this after monkey patching.
            // Do not set this outside of monkey patching as this *will*
            // cause an endless loop until ratelimiting.
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
