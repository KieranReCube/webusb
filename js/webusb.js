let port; // Variable to store the connected serial port
let reader; // Reader for the serial port
let buffer = ""; // Buffer to accumulate incoming chunks

// Device name to connect automatically; update this if the name changes
const deviceName = "cu.usbserial-1110";

// Automatically check for and connect to the serial port
async function autoConnect() {
  const statusElement = document.getElementById("status");
  const dataBox = document.getElementById("dataBox");

  // Continuously check for available serial ports
  while (true) {
    const ports = await navigator.serial.getPorts(); // Get all available ports

    // Look for the desired port
    const matchedPort = ports.find((p) => true); // Placeholder for more specific matching logic if needed

    if (matchedPort && port === undefined) {
      // If the port is found and not already connected, connect to it
      port = matchedPort;
      await connectToPort(port, statusElement, dataBox);
    } else if (!matchedPort && port) {
      // If the port is no longer available, disconnect immediately
      await disconnectFromPort(statusElement);
    }
  }
}

// Connect to the serial port
async function connectToPort(port, statusElement, dataBox) {
  // Open the port with the appropriate configuration
  await port.open({
    baudRate: 115200, // Set baud rate to 115200
    dataBits: 8,      // Set data bits to 8
    parity: "none",   // Set parity to none
    stopBits: 1,      // Set stop bits to 1
    flowControl: "none", // Set flow control to none
  });

  statusElement.textContent = `Device connected: ${deviceName}`;
  dataBox.value = ""; // Clear the text box when a new connection is established

  const textDecoder = new TextDecoderStream();
  const readableStreamClosed = port.readable.pipeTo(textDecoder.writable);
  reader = textDecoder.readable.getReader();

  // Continuously read data from the serial port
  while (port.readable) {
    const { value, done } = await reader.read();
    if (done) {
      break; // Exit the loop if the stream is closed
    }
    if (value) {
      buffer += value; // Append the chunk to the buffer
      processBuffer(dataBox); // Process the buffer to extract complete messages
    }
  }
}

// Process the buffer to extract and display complete JSON messages
function processBuffer(dataBox) {
  let startIndex = buffer.indexOf("{"); // Find the start of a JSON object
  let endIndex = buffer.indexOf("}");   // Find the end of a JSON object

  while (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
    const jsonString = buffer.substring(startIndex, endIndex + 1); // Extract the JSON string
    try {
      const json = JSON.parse(jsonString); // Try to parse the JSON string
      dataBox.value += JSON.stringify(json) + "\n"; // Append the parsed JSON to the data box
      dataBox.scrollTop = dataBox.scrollHeight; // Auto-scroll to the bottom
    } catch (error) {
      console.error("Invalid JSON:", jsonString); // Log invalid JSON
    }
    buffer = buffer.substring(endIndex + 1); // Remove the processed message from the buffer
    startIndex = buffer.indexOf("{"); // Find the next JSON object
    endIndex = buffer.indexOf("}");
  }
}

// Disconnect from the serial port
async function disconnectFromPort(statusElement) {
  if (reader) {
    await reader.cancel();
    reader.releaseLock();
  }

  if (port) {
    await port.close();
  }

  port = undefined; // Reset the port variable
  statusElement.textContent = "Status: Waiting for device..."; // Update status
  buffer = ""; // Clear the buffer on disconnection
}

// Start the auto-connect process when the page loads
window.addEventListener("load", autoConnect);