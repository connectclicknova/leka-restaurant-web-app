import { useState, useRef, useEffect } from 'react'
import './App.css'

function App() {
  const [device, setDevice] = useState(null)
  const [characteristic, setCharacteristic] = useState(null)
  const [logs, setLogs] = useState([])
  const [isConnecting, setIsConnecting] = useState(false)
  
  const PRINTER_SERVICE_UUID = '000018f0-0000-1000-8000-00805f9b34fb' // Standard printer service
  const PRINTER_CHARACTERISTIC_UUID = '00002af1-0000-1000-8000-00805f9b34fb' // Standard printer characteristic

  const addLog = (message, type = '') => {
    setLogs(prev => [...prev.slice(-10), { text: `[${new Date().toLocaleTimeString()}] ${message}`, type }])
    console.log(`[Printer Debug] ${message}`)
  }

  const connectToPrinter = async () => {
    try {
      setIsConnecting(true)
      addLog('Scanning for Bluetooth printers...')
      
      const bluetoothDevice = await navigator.bluetooth.requestDevice({
        filters: [{
          services: [PRINTER_SERVICE_UUID]
        }],
        optionalServices: [PRINTER_SERVICE_UUID]
      })

      addLog(`Found device: ${bluetoothDevice.name}`, 'success')
      
      bluetoothDevice.addEventListener('gattserverdisconnected', onDisconnected)

      addLog('Connecting to GATT server...')
      const server = await bluetoothDevice.gatt.connect()
      
      addLog('Getting Service...')
      const service = await server.getPrimaryService(PRINTER_SERVICE_UUID)
      
      addLog('Getting Characteristic...')
      const char = await service.getCharacteristic(PRINTER_CHARACTERISTIC_UUID)
      
      setDevice(bluetoothDevice)
      setCharacteristic(char)
      addLog('Printer Connected Successfully!', 'success')
      
    } catch (error) {
      addLog(`Error: ${error.message}`, 'error')
      // Fallback: If filtering by service fails, try searching everything
      if (error.name === 'NotFoundError' || error.message.includes('No devices found')) {
         addLog('Trying broad scan due to filter failure...')
         tryScanningBroadly()
      }
    } finally {
      setIsConnecting(false)
    }
  }

  const tryScanningBroadly = async () => {
    try {
      setIsConnecting(true)
      const bluetoothDevice = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [PRINTER_SERVICE_UUID, '00001101-0000-1000-8000-00805f9b34fb']
      })
      addLog(`Found device: ${bluetoothDevice.name}`, 'success')
      
      const server = await bluetoothDevice.gatt.connect()
      // Try to find the correct service
      const services = await server.getPrimaryServices()
      addLog(`Found ${services.length} services`)
      
      // Look for common printer/serial services
      let targetService = null
      for (const service of services) {
        if (service.uuid === PRINTER_SERVICE_UUID || service.uuid.includes('18f0') || service.uuid.includes('1101')) {
          targetService = service
          break
        }
      }

      if (!targetService && services.length > 0) targetService = services[0]

      if (targetService) {
        const characteristics = await targetService.getCharacteristics()
        if (characteristics.length > 0) {
          setDevice(bluetoothDevice)
          setCharacteristic(characteristics[0])
          addLog('Printer Connected via common profile', 'success')
        }
      }
    } catch (error) {
       addLog(`Broad scan error: ${error.message}`, 'error')
    } finally {
       setIsConnecting(false)
    }
  }

  const onDisconnected = () => {
    addLog('Device disconnected', 'error')
    setDevice(null)
    setCharacteristic(null)
  }

  const printSample = async () => {
    if (!characteristic) {
      addLog('No printer connected!', 'error')
      return
    }

    try {
      addLog('Printing sample...')
      const encoder = new TextEncoder()
      
      // ESC/POS Commands
      const reset = '\x1b\x40'
      const center = '\x1b\x61\x01'
      const left = '\x1b\x61\x00'
      const boldOn = '\x1b\x45\x01'
      const boldOff = '\x1b\x45\x00'
      const lineFeed = '\x0a'
      const cut = '\x1d\x56\x41'

      const content = 
        reset + center + boldOn + "LEKA RESTAURANT\n" + boldOff +
        "------------------------------\n" +
        left + "Sample Test Print\n" +
        "Time: " + new Date().toLocaleTimeString() + "\n" +
        "------------------------------\n" +
        center + "Scan & Connect Works!\n\n" +
        lineFeed + lineFeed + lineFeed + cut

      const data = encoder.encode(content)
      
      // Write in chunks of 20 bytes (standard BLE limit) if needed, 
      // but modern ones usually handle a bit more. We'll try direct first.
      await characteristic.writeValue(data)
      addLog('Print command sent!', 'success')
    } catch (error) {
      addLog(`Print Error: ${error.message}`, 'error')
    }
  }

  return (
    <div className="app-container">
      <div className="header">
        <h1>Thermal Printer</h1>
        <div className={`status-badge ${device ? 'status-connected' : 'status-disconnected'}`}>
          <span className={`pulse ${device ? 'pulse-active' : ''}`}></span>
          {device ? `Connected to ${device.name}` : 'Disconnected'}
        </div>
      </div>

      <p>Manage your Bluetooth thermal printer connections and tests.</p>

      <div className="button-group">
        <button 
          className="btn-primary" 
          onClick={connectToPrinter} 
          disabled={isConnecting}
        >
          {isConnecting ? 'Connecting...' : 'Connect Printer'}
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.14 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
          </svg>
        </button>
        
        <button 
          className="btn-secondary" 
          onClick={printSample}
          disabled={!characteristic}
        >
          Print Sample
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
        </button>
      </div>

      <div className="logs">
        {logs.map((log, i) => (
          <div key={i} className={`log-entry ${log.type}`}>
            {log.text}
          </div>
        ))}
        {logs.length === 0 && <div className="log-entry">Waiting for activity...</div>}
      </div>
    </div>
  )
}

export default App
