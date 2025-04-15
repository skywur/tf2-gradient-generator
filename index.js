function hexToRgb(hex) {
    const bigint = parseInt(hex.slice(1), 16);
    return {
      r: (bigint >> 16) & 255,
      g: (bigint >> 8) & 255,
      b: bigint & 255
    };
  }

  function rgbToHex(r, g, b) {
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
  }

  function interpolateColor(start, end, factor) {
    return {
      r: Math.round(start.r + factor * (end.r - start.r)),
      g: Math.round(start.g + factor * (end.g - start.g)),
      b: Math.round(start.b + factor * (end.b - start.b))
    };
  }

  document.getElementById('generateButton').addEventListener('click', () => {
    const gradientBar = document.getElementById('gradient')
    const startColor = document.getElementById('startColor').value.trim();
    const endColor = document.getElementById('endColor').value.trim();
    const message = document.getElementById('message').value.trim();
    const output = document.getElementById('output');
    const error = document.getElementById('error');
    const saveButton = document.getElementById('saveButton');

    output.textContent = '';
    error.textContent = '';

    if (!/^#[0-9A-Fa-f]{6}$/.test(startColor) || !/^#[0-9A-Fa-f]{6}$/.test(endColor)) {
      error.textContent = 'Please enter valid hex colors (e.g., #FF0000).';
      return;
    }

    if (message.length === 0) {
      error.textContent = 'Message cannot be empty.';
      return;
    }

    if (message.length > 127) {
      error.textContent = 'Message is too long. The maxiumum tf2 chat message length is 127 characters.';
      return;
    }


    const startRgb = hexToRgb(startColor);
    const endRgb = hexToRgb(endColor);

    // Calculate the maximum number of gradient steps to stay within 127 characters
    const maxSteps = Math.floor(127 / (message.length + 8)); // 8 characters for formatting + color codes
    let steps = Math.min(message.length, maxSteps);
    if (steps < message.length) {
      error.textContent = 'Gradient quality has been lowered to fit within the TF2 chat message length limit.';
    }

    

    const gradient = [];
    let lastHexColor = null;
    for (let i = 0; i < message.length; i++) {
      const factor = Math.floor(i / (message.length / steps)) / (steps - 1);
      const interpolatedColor = interpolateColor(startRgb, endRgb, factor);
      const hexColor = rgbToHex(interpolatedColor.r, interpolatedColor.g, interpolatedColor.b).slice(1); // Remove the '#' from the hex code
      
      if (hexColor !== lastHexColor) {
        gradient.push(`XXXXXXX${hexColor}${message[i]}`);
        lastHexColor = hexColor;
      } else {
        gradient.push(message[i]);
      }
    }

    output.innerHTML = parseColoredOutput(gradient.join(''));
    //output.textContent += `\n\nMessage Length: ${message.length}, Steps Used: ${steps}, Result Length: ${gradient.join('').length}`;
    //output.textContent += `\n\nNote: Copy the above text and paste it into TF2 chat. The colors will appear as a gradient.`;

    gradientBar.style.background = `linear-gradient(to right, ${startColor}, ${endColor})`;
    gradientBar.style.width = '100%';
    gradientBar.style.height = '20px';
    
    saveButton.style.display = 'block'; // Show the save button


  });

  function copyToClipboard(button) {
    const text = document.getElementById('output').innerText; // Get the text from the output element
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  
    // Add the animate class to the button
    button.classList.add('animate');
  
    // Remove the animate class when the animation ends
    button.addEventListener('animationend', () => {
      button.classList.remove('animate');
    });
  }

  // Utility to manage cookies
  function setCookie(name, value, days) {
    const expires = new Date(Date.now() + days * 86400000).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/`;
  }
  
  function getCookie(name) {
    const cookies = document.cookie.split('; ').reduce((acc, cookie) => {
      const [key, val] = cookie.split('=');
      acc[key] = decodeURIComponent(val);
      return acc;
    }, {});
    return cookies[name];
  }
  
  function deleteCookie(name) {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
  }
  
  // Save output to cookies
  function saveOutput(output) {
    const savedOutputs = JSON.parse(getCookie('savedOutputs') || '[]');
    savedOutputs.push(output);
    setCookie('savedOutputs', JSON.stringify(savedOutputs), 30);
    renderSavedOutputs();
    console.log('Saved output:', output); // Debug log

  }
  
  // Render saved outputs in the sidebar
  function renderSavedOutputs() {
    const savedOutputs = JSON.parse(getCookie('savedOutputs') || '[]');
    const savedOutputsList = document.getElementById('savedOutputs');
    savedOutputsList.innerHTML = '';
  
    savedOutputs.forEach((output, index) => {
      const listItem = document.createElement('li');
      listItem.className = 'p-2 bg-base-300 rounded flex justify-between items-center overflow-x-scroll h-12';
      listItem.onclick = () => {
        const outputText = document.getElementById('output');
        outputText.textContent = output;
        copyToClipboard(this); // Copy to clipboard when clicked
      }
      // show copied tooltip
      const copiedTooltip = document.createElement('span');
      copiedTooltip.className = 'tooltip tooltip-bottom tooltip-open';
      copiedTooltip.textContent = 'Copied!';
      copiedTooltip.style.display = 'none'; // Initially hidden
      listItem.appendChild(copiedTooltip);

  
      const outputPreview = document.createElement('span');
      outputPreview.innerHTML = parseColoredOutput(output); // Render colored output
      listItem.appendChild(outputPreview);
  
      const deleteButton = document.createElement('button');
      deleteButton.textContent = 'Delete';
      deleteButton.className = 'btn btn-error btn-sm ml-auto';
      deleteButton.style.marginLeft = '10px';
      deleteButton.style.position = 'absolute';
      deleteButton.style.right = '10px';
      deleteButton.addEventListener('click', () => {
        savedOutputs.splice(index, 1);
        setCookie('savedOutputs', JSON.stringify(savedOutputs), 30);
        renderSavedOutputs();
      });
      listItem.appendChild(deleteButton);
  
      savedOutputsList.appendChild(listItem);
    });
  }
  
  // Parse output and render colored text
  function parseColoredOutput(output) {
    return output.replace(/XXXXXXX([0-9A-Fa-f]{6})([^]*)/g, (_, color, text) => {
      return `<span style="color: #${color}">XXXXXXX${color}${text}</span>`;
    });
  }
  
  // Add save button functionality
  document.getElementById('saveButton').addEventListener('click', () => {
  
    // Save the output
    saveOutput(output.textContent);
    renderSavedOutputs();
  });
  
  // Initial render of saved outputs
  document.addEventListener('DOMContentLoaded', renderSavedOutputs);