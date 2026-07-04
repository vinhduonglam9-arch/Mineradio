const { app, BrowserWindow, ipcMain, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');

app.whenReady().then(() => {
  const win = new BrowserWindow({
    show: false,
    width: 256,
    height: 256,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  const htmlPath = path.join(__dirname, 'icon-gen.html');
  fs.writeFileSync(htmlPath, `
    <html>
      <body style="margin:0;padding:0;overflow:hidden;background:transparent;">
        <canvas id="c" width="256" height="256"></canvas>
        <script>
          const ctx = document.getElementById('c').getContext('2d');
          
          ctx.clearRect(0, 0, 256, 256);
          
          const gradient = ctx.createLinearGradient(0, 0, 256, 256);
          gradient.addColorStop(0, '#ff0000');
          gradient.addColorStop(0.2, '#ff7f00');
          gradient.addColorStop(0.4, '#ffff00');
          gradient.addColorStop(0.6, '#00ff00');
          gradient.addColorStop(0.8, '#0000ff');
          gradient.addColorStop(1, '#8f00ff');
          
          ctx.fillStyle = gradient;
          ctx.font = '900 160px system-ui, -apple-system, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('LI', 128, 140);
          
          const { ipcRenderer } = require('electron');
          const dataURL = document.getElementById('c').toDataURL('image/png');
          ipcRenderer.send('save-icon', dataURL);
        </script>
      </body>
    </html>
  `);

  win.loadFile(htmlPath);

  ipcMain.on('save-icon', (event, dataUrl) => {
    const img = nativeImage.createFromDataURL(dataUrl);
    const pngPath = path.join(__dirname, 'build/icon.png');
    const icoPath = path.join(__dirname, 'build/icon.ico');
    
    const pngBuf = img.toPNG();
    fs.writeFileSync(pngPath, pngBuf);
    
    // Create ICO manually from 256x256 PNG
    const icoBuf = Buffer.alloc(22 + pngBuf.length);
    // ICONDIR
    icoBuf.writeUInt16LE(0, 0); // reserved
    icoBuf.writeUInt16LE(1, 2); // type 1=ico
    icoBuf.writeUInt16LE(1, 4); // 1 image
    // ICONDIRENTRY
    icoBuf.writeUInt8(0, 6); // width 256
    icoBuf.writeUInt8(0, 7); // height 256
    icoBuf.writeUInt8(0, 8); // colors
    icoBuf.writeUInt8(0, 9); // reserved
    icoBuf.writeUInt16LE(1, 10); // planes
    icoBuf.writeUInt16LE(32, 12); // bpp
    icoBuf.writeUInt32LE(pngBuf.length, 14); // size
    icoBuf.writeUInt32LE(22, 18); // offset
    pngBuf.copy(icoBuf, 22);
    
    fs.writeFileSync(icoPath, icoBuf);
    console.log('Icon generated successfully!');
    app.quit();
  });
});
