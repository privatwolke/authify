async function login(username, password, token_url, client_id, client_secret) {
  const params = new URLSearchParams()
  params.set('grant_type', 'password')
  params.set('client_id', client_id)
  params.set('client_secret', client_secret)
  params.set('username', username)
  params.set('password', password)
  params.set('device', 'browser_auth')

  const response = await fetch(token_url, {
    method: 'POST',
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    body: params,
  })

  data = await response.json()
  data.expires = (new Date()).getTime() + data.expires_in * 1000

  return data
}

async function refresh(token, token_url, client_id, client_secret) {
  const params = new URLSearchParams()
  params.set('grant_type', 'refresh_token')
  params.set('client_id', client_id)
  params.set('client_secret', client_secret)
  params.set('refresh_token', token)

  const response = await fetch(token_url, {
    method: 'POST',
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    body: params,
  })

  data = await response.json()
  data.expires = (new Date()).getTime() + data.expires_in * 1000

  return data
}


browser.webRequest.onBeforeSendHeaders.addListener(
  async function (details) {
    result = await browser.storage.local.get('config')
    const config = result.config
    if (!config) {
      return
    }

    for (let site of config) {
      for (let pattern of site.patterns.split('\n')) {
        if (details.url.includes(pattern) && !details.url.includes(site.token_url)) {
          const result = await browser.storage.local.get('tokens')
          let tokens = result.tokens
          if (!tokens) {
            tokens = {}
          }

          if (!tokens[site.id] || !tokens[site.id].refresh_token) {
            tokens[site.id] = await login(site.username, site.password, site.token_url, site.client_id, site.client_secret)
            await browser.storage.local.set({ tokens: tokens })
          }
    
          if ((tokens[site.id].expires - new Date()) < 3000) {
            // refresh 30 seconds before expiry
            tokens[site.id] = await refresh(tokens[site.id].refresh_token, site.token_url)
            await browser.storage.local.set({ tokens: tokens })
          }
    
          const headers = details.requestHeaders
          headers.push({ name: 'Authorization', value: `${tokens[site.id].token_type} ${tokens[site.id].access_token}` })
          return { requestHeaders: headers }
        }
      }
    }
  },
  { urls: ['<all_urls>'] },
  ['blocking', 'requestHeaders']
)
