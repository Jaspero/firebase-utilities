const {join} = require('path');
const {tmpdir} = require('os');
const {dirname} = require('path');
const sharp = require('sharp');

const PROJECT_ID = process.env.PI;
const SERVICE_ACCOUNT = join('../', process.env.SV);
const BUCKET_NAME = process.env.BN + '.appspot.com';
const THUMB_MEDIUM = {width: 600, height: 600};

const lookUps = [
    {
        method: (name) => name.replace(/(.jpg|.png|.jpeg)/, '.webp'),
        generate: (file, name, storage, metadata) => {

            const tempFile = join(tmpdir(), name.replace(/(.jpg|.png|.jpeg)/, '.webp'));

            return sharp(file)
                .webp({lossless: true})
                .toFile(tempFile)
                .then(() =>
                    storage.upload(tempFile, {
                        metadata: {
                            ...metadata,
                            contentType: 'image/webp'
                        },
                        destination: join(dirname(name), name.replace(/(.jpg|.png|.jpeg)/, '.webp'))
                    })
                )
        }
    },
    {
        method: (name) => 'thumb_m_' + name,
        generate: (file, name, storage, metadata) => {

            const tempFile = join(tmpdir(), 'thumb_m_' + name);

            return sharp(file)
                .resize(THUMB_MEDIUM.width, THUMB_MEDIUM.height, {fit: 'inside'})
                .toFile(tempFile)
                .then(() =>
                    storage.upload(tempFile, {
                        metadata,
                        destination: join(dirname(name), 'thumb_m_' + name)
                    })
                )
        }
    },
    {
        method: (name) => 'thumb_m_' + name.replace(/(.jpg|.png|.jpeg)/, '.webp'),
        generate: (file, name, storage, metadata) => {

            const tempFile = join(tmpdir(), 'thumb_m_' + name.replace(/(.jpg|.png|.jpeg)/, '.webp'));

            return sharp(file)
                .resize(THUMB_MEDIUM.width, THUMB_MEDIUM.height, {fit: 'inside'})
                .webp({lossless: true})
                .toFile(tempFile)
                .then(() =>
                    storage.upload(tempFile, {
                        metadata: {
                            ...metadata,
                            contentType: 'image/webp'
                        },
                        destination: join(dirname(name), 'thumb_m_' + name.replace(/(.jpg|.png|.jpeg)/, '.webp'))
                    })
                )
        }
    },
];

async function listFiles() {
    const {Storage} = require('@google-cloud/storage');

    // Creates a client
    const storage = new Storage({projectId: PROJECT_ID, keyFilename: SERVICE_ACCOUNT});

    const storageBucket = await storage.bucket(BUCKET_NAME);
    const [files] = await storageBucket.getFiles();

    /**
     * Files that have something missing
     */
    const baseFiles = [];

    for (const file of files) {
        if (!file.name.startsWith('thumb_') && !file.name.endsWith('.webp')) {

            if (!files.find(fi => {
                return lookUps.find(lu => lu.method(file.name) === fi.name);
            })) {
                baseFiles.push(file);
            }
        }
    }

    console.log(files.length, baseFiles.length, baseFiles[0].name);

    const requests = [];

    for (let i = 0; i < baseFiles.length; i++) {
        const file = baseFiles[i];
        const destination = join(tmpdir(), file.name);

        requests.push(
            storageBucket.file(file.name).download({destination})
                .then(() => {
                    const toExec = [];

                    for (const met of lookUps) {
                        if (!files.find(fi => fi.name === met.method(file.name))) {
                            toExec.push(met.generate(
                                destination,
                                file.name,
                                storageBucket,
                                {
                                    contentType: file.metadata.contentType,
                                    generated: true,
                                    generatedByScript: true,
                                    source: file.name
                                }
                            ))
                        }
                    }

                    return Promise.all(toExec)
                })
        )
    }

    await Promise.all(requests);
}

listFiles()
    .then();

