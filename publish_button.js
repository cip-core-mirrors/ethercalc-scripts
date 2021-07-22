const databaseUrl = document.currentScript.getAttribute('data-url')

let radarId = window.location.pathname.substring(window.location.pathname.lastIndexOf('/') + 1)

async function save_blips() {
    const url = `${window.location.pathname}.csv.json`
    const response = await fetch(url)
    const data = await response.json()

    const parsedData = parse_blips_data(data)
    await save_raw_blips({
        blips: parsedData.blips,
    })
    await save_blip_links({
        links: parsedData.links,
        parameters: parsedData.parameters,
    })
}

function parse_blips_data(data) {
    const paramHeaders = ['name', 'value']
    const paramIndexes = {}
    const radarHeaders = ['sector', 'ring', 'oldRing', 'value']
    const radarIndexes = {}
    const headers = {}

    const headersRow = data.shift()
    let i = 0
    let radarParamHeaderIndex
    for (const header of headersRow) {
        if (radarHeaders.indexOf(header) !== -1) radarIndexes[i] = header
        if (paramHeaders.indexOf(header) !== -1) paramIndexes[i] = header
        if (radarHeaders.indexOf(header) === -1) headers[i] = header

        if (header === radarHeaders[0]) radarParamHeaderIndex = i
        i++
    }

    const blips = []
    const links = []
    const parameters = []

    let rowIndex = 1
    for (const row of data) {
        rowIndex++
        const isRadarParam = !row[radarParamHeaderIndex]
        if (isRadarParam) {
            const radarParam = {}
            for (const entry of Object.entries(paramIndexes)) {
                radarParam[entry[1]] = row[entry[0]]
            }
            if (radarParam.name === 'sheetId') { // Override radarId
                radarId = radarParam.value
            }
            parameters.push(radarParam)
        } else {
            const blip = {}
            for (const i of Object.keys(headers)) {
                blip[headers[i]] = row[i]
            }
            blip.id = `${radarId}-${rowIndex}`
            blips.push(blip)

            const link = {}
            for (const entry of Object.entries(radarIndexes)) {
                link[entry[1]] = row[entry[0]]
            }
            link.blip = blip.id
            links.push(link)
        }
    }

    return {
        blips,
        links,
        parameters,
    }
}

async function save_raw_blips(data) {
    await fetch(databaseUrl, {
        method: 'PUT',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
        },
        //mode: 'no-cors',
        body: JSON.stringify(data),
    })
}

async function save_blip_links(data) {
    await fetch(`${databaseUrl}/radar/${radarId}`, {
        method: 'PUT',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
        },
        //mode: 'no-cors',
        body: JSON.stringify(data),
    })
}

function add_publish_button(graphTab) {
    const td = document.createElement('td');
    td.setAttribute('id', 'publish-database');
    td.setAttribute('style', graphTab.getAttribute('style'));
    td.style.cursor = 'pointer';
    td.onclick = save_blips;
    td.innerText = 'Publish';
    graphTab.parentElement.append(td);
}