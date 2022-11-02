() => {
    var script = document.createElement('script')
    script.src = "https://cdn.jsdelivr.net/npm/axios@1.1.2/dist/axios.min.js";
    document.body.appendChild(script);

    const PK_TOKEN = "QUEEEEEEEEEEEEER"
    const API_URL = "https://api.pluralkit.me/v2/"
    const SYSTEM_URL = "systems/@me/"
    const MEMBERS_URL = "members"

    function getPluralKitSystemTag() {
        fetch(API_URL+SYSTEM_URL, {
            headers: {'Authorization': PK_TOKEN}
        }).then(res => res.json().then(sys => {return sys.tag}));
    }

    let SYSTEM_TAG = getPluralKitSystemTag();
    var latch_mode: boolean = false;
    var last_proxied_member: any = null;

    async function getPluralKitMembers() {
        var res = await fetch(API_URL+SYSTEM_URL+MEMBERS_URL, {
            headers: {'Authorization': PK_TOKEN}
        })

        let data = await res.json()
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
        channel.sendMessage = async function(data: string | (Omit<{ attachments?: null | string[]; content?: null | string; embeds?: null | { colour?: null | string; description?: null | string; icon_url?: null | string; media?: null | string; title?: null | string; url?: null | string }[]; interactions?: null | { reactions?: null | string[]; restrict_reactions?: boolean }; masquerade?: null | { avatar?: null | string; colour?: null | string; name?: null | string }; nonce?: null | string; replies?: null | { id: string; mention: boolean }[] }, "nonce"> & { nonce?: string })): Promise<import('revolt.js').Message> {
            var msgData: any = {}

            if (data['content']) {
                msgData = data;
            } else {
                msgData.content = data;
            }

            if (msgData.content == "pk;ap latch") {
                latch_mode = !latch_mode
                if (!latch_mode) {
                    last_proxied_member = null;
                }
                msgData.content = "Latch set to "+latch_mode
                return await this.origSend(msgData);
            }

            var m: any = last_proxied_member;
            var proxy_tag: any = null;

            outer: for (let member of members) {
                for (let proxy of member.proxy_tags) {
                    if (msgData.content.startsWith(proxy.prefix || "") && msgData.content.endsWith(proxy.suffix || "")) {
                        m = member;
                        proxy_tag = proxy;
                        if (latch_mode) {
                            last_proxied_member = m
                        }
                        break outer;
                    }
                }
            }

            if (m) {
                msgData.masquerade = {}

                if (proxy_tag) {
                    var start = proxy_tag.prefix?.length ?? 0
                    var end = msgData.content.length - (proxy_tag.suffix?.length ?? 0)

                    msgData.content = msgData.content.slice(start, end);
                }

                // Set the masquerade object.
                msgData.masquerade.name = `${(m.display_name || m.name)} ${SYSTEM_TAG}`
                if (msgData.masquerade.name.length > 32) {
                    msgData.masquerade.name = (m.display_name || m.name)
                } if (msgData.masquerade.name.length > 32) {
                    msgData.masquerade.name = `${m.name} ${SYSTEM_TAG}`
                } if (msgData.masquerade.name.length > 32) {
                    msgData.masquerade.name = m.name
                } if (msgData.masquerade.name.length > 32) {
                    msgData.masquerade.name = "NAME TOO BIG"
                }
                msgData.masquerade.avatar = m.avatar_url
            }

            console.log(`[PkRv] ${JSON.stringify(msgData)}`)
            return await this.origSend(msgData);
        }
    }

    setTimeout(function yourFunction() {
        var client: import('revolt.js').Client = client = (window as any).controllers.client.getReadyClient();

        client.on("message", async (message) => {
            if (message.author == client.user && !monkeyPatchedChannels.has(message.channel)) {
                monkeypatchChannelSend(message.channel);

                await message.channel!.sendMessage(message.content);
                await message.delete()
            }
        });
    }, 3e3)

    return ({
        onUnload: () => {
            script.remove()

            for (let channel of monkeyPatchedChannels.keys()) {
                channel.sendMessage = channel['origSend'];
            }
            console.log('[PkRv] Plugin unloaded!');
        }
    });
};
