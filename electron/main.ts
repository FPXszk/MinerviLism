import { app, BrowserWindow } from 'electron'
import path from 'path'

const isDevServerEnabled = process.env.USE_DEV_SERVER === 'true'
const devServerUrl = process.env.ELECTRON_RENDERER_URL?.trim() || 'http://127.0.0.1:3000'

function resolveRendererPath(): string {
  return path.join(__dirname, '..', 'renderer-dist', 'index.html')
}

async function createWindow(): Promise<void> {
  const window = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 1200,
    minHeight: 760,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  window.once('ready-to-show', () => {
    window.show()
  })

  if (isDevServerEnabled) {
    await window.loadURL(devServerUrl)
    return
  }

  await window.loadFile(resolveRendererPath())
}

app.whenReady().then(async () => {
  await createWindow()

  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
