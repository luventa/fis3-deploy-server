const http = require('http')
const formidable = require('formidable')
const fs = require('fs')
const mkdirp = require('mkdirp')
const yauzl = require("yauzl")
const path = require('path')
const rimraf = require('rimraf')
const port = parseInt(process.argv[2]) || 2333

const errorHandler = (res, err) => {
  console.log((new Date()).toGMTString(), '[ERROR]', err.toString())
  res.writeHead(500, {
    'Content-Type': 'text/plain'
  })
  res.end(err.toString())
}

const fileHandler = (res, filePath, to) => {
  yauzl.open(path.normalize(filePath), { lazyEntries: true }, (err, zipfile) => {
    if (err) {
      throw err
    }

    zipfile.on('close', () => {
      console.log((new Date()).toGMTString(), '[INFO]', 'Unzip completed, rmoving zip file.')
      fs.unlink(filePath, err => {
        if (err) return errorHandler(res, err)
        console.log((new Date()).toGMTString(), '[WARNING]', 'Cannot remove uploaded file at:', filePath)
        res.writeHead(200, {
          'Content-Type': 'text/plain'
        })
        res.end('0')
      })
    })

    unzipFile(zipfile, to)
  })
}

const unzipFile = (zipfile, to) => {
  zipfile.readEntry()
  zipfile.on('entry', entry => {
    let entryPath = path.resolve(to, entry.fileName)
    mkdirp(path.dirname(entryPath), 0777, err => {
      if (err) {
        throw err
      }

      zipfile.openReadStream(entry, (err, readStream) => {
        if (err) {
          throw err
        }

        readStream.on('end', () => {
          zipfile.readEntry()
        })

        let writeStream = fs.createWriteStream(entryPath)
        readStream.pipe(writeStream)
      })
    })
  })
}

const server = http.createServer((req, res) => {
  if (req.url === '/') {
    res.writeHead(200, {
      'Content-Type': 'text/html'
    })
    res.end('Deploy server is ready')
  } else if (req.url === '/deploy' && req.method.toLowerCase() === 'post') {
    let form = new formidable.IncomingForm()

    form.on('error', err => {
      console.log((new Date()).toGMTString(), '[FATAL]', 'Error occurs during transfer process:', err.toString())
    })

    form.parse(req, (err, fields, files) => {
      if (err) {
        errorHandler(res, err)
      } else {
        let to = path.dirname(fields.to)
        console.log((new Date()).toGMTString(), '[INFO]', 'Zip file is uploaded and ready for deployment')
        rimraf(to, () => {
          console.log((new Date()).toGMTString(), '[INFO]', 'Directory', to, 'is clean now')
          try {
            fileHandler(res, files.file.path, to)
          } catch (err) {
            errorHandler(res, err)
          }
        })
      }
    })
  }
})

server.listen(port, () => {
    console.log('Deploy server listen on:', port)
})
