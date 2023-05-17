const arg = require('arg')
const fs = require('node:fs/promises')
const fm = require('front-matter')
const createCsvWriter = require('csv-writer').createObjectCsvWriter

const args = arg({
// '--help': Boolean,
// '--version': Boolean,
    '--limit': Number, // --port <number> or --port=<number>
    '-l': '--limit',
    '--out': String,
    '-o': '--out',
})

const limit = args['--limit'] ?? Infinity

async function parse(files) {
    const data = await Promise.all(files
        .map(async fileName => {
            try {
                const content = fm(await fs.readFile(fileName, 'utf8'))
                const { attributes, body } = content
                const date = fileName.match(/\d{4}-\d{2}-\d{2}/)
                return {
                    body: body.split('\n').join('<br>'),
                    date: date && date[0],
                    ...attributes,
                }
            } catch(e) {
                console.error('Error in reading and parseing md files', e)
            }
        })
    )
    const headers = Array.from(new Set(data.flatMap(file => Object.keys(file))))
    return [headers, data]
}

async function csvWrite(headers, data, output) {
    const csvWriter = createCsvWriter({
        path: output,
        header: headers.map(name => ({ id: name, title: name}))
    })

    return csvWriter.writeRecords(data)
}
async function run() {
    const [headers, data] = await parse(args._.filter((fileName, idx) => idx < limit))
    await csvWrite(headers, data, args['--out'] ?? './out.csv')
    console.log('Done.')
}
run()
