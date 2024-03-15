function ready(fn) {
    if (document.readyState !== 'loading') {
        fn()
    } else {
        document.addEventListener('DOMContentLoaded', fn)
    }
}


async function reloadConfig() {
    const result = await browser.storage.local.get('config')
    let config = result.config
    if (!config) {
        config = []
    }
    const tbody = document.getElementById('configured')
    tbody.replaceChildren()

    let i = 0
    for (let site of config) {
        const row = document.createElement('tr')
        const cell_delete = document.createElement('td')
        cell_delete.innerText = '❌'
        cell_delete.className = 'delete'
        cell_delete.dataset.idx = i
        cell_delete.addEventListener('click', async function() {
            config.splice(parseInt(this.dataset.idx), 1)
            await browser.storage.local.set({ config: config })
            await reloadConfig()
        })

        const cell_patterns = document.createElement('td')
        const cell_patterns_pre = document.createElement('pre')
        cell_patterns_pre.innerText = site.patterns
        cell_patterns.appendChild(cell_patterns_pre)

        const cell_token_url = document.createElement('td')
        cell_token_url.innerText = site.token_url

        const cell_username = document.createElement('td')
        cell_username.innerText = site.username

        const cell_client_id = document.createElement('td')
        cell_client_id.innerText = site.client_id

        row.append(cell_delete, cell_patterns, cell_token_url, cell_username, cell_client_id)
        i++
        tbody.appendChild(row)
    }
}


ready(async function () {
    await reloadConfig()
    document.getElementById('save').addEventListener('click', async function () {
        const newrow = {
            id: crypto.randomUUID(),
            patterns: document.getElementById('patterns').value,
            token_url: document.getElementById('token_url').value,
            username: document.getElementById('username').value,
            password: document.getElementById('password').value,
            client_id: document.getElementById('client_id').value,
            client_secret: document.getElementById('client_secret').value,
        }

        const result = await browser.storage.local.get('config')
        let config = result.config
        if (!config) {
            config = []
        }
        config.push(newrow)

        await browser.storage.local.set({ config: config })
        await reloadConfig()

        document.getElementById('patterns').value = ''
        document.getElementById('token_url').value = ''
        document.getElementById('username').value = ''
        document.getElementById('password').value = ''
        document.getElementById('client_id').value = ''
        document.getElementById('client_secret').value = ''
    })
})