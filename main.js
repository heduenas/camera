const video = document.getElementById('video');
const intervalSelect = document.getElementById('interval');
const captureButton = document.getElementById('capture');
const stopButton = document.getElementById('stop');
const countdownDiv = document.getElementById('countdown');
const snapSound = new Audio('snap.mp3'); // Load the audio file
let timer = null;
let countdownTimer = null;
let gif = null;
let wakeLock = null;

// Get access to camera
navigator.mediaDevices.getUserMedia({
  video: {
    facingMode: 'environment',
    width: { ideal: 854 },
    height: { ideal: 480 },
  }
})
.then(stream => {
  video.srcObject = stream;
  video.play();
})
.catch(error => {
  console.error('Error accessing camera:', error);
  alert("in mozilla developer go to `about:config` set to `true` `media.devices.insecure.enabled` and `media.getusermedia.insecure.enabled`");
});

// Capture photo at selected interval
captureButton.addEventListener('click', async () => {
  if (timer === null) {
    // Hide the capture button and show the stop button
    captureButton.style.visibility = 'hidden';
    stopButton.style.visibility = 'visible';

    const interval = parseInt(intervalSelect.value);
    let countdown = interval / 1000;
    countdownDiv.innerText = `Next photo in ${countdown} seconds`;
    countdownTimer = setInterval(() => {
      countdown--;
      countdownDiv.innerText = `Next photo in ${countdown} seconds`;
    }, 1000);

    // Initialize gif instance
    gif = new GIF({
      workerScript: "./gif.worker.js",
      workers: 2,
      quality: 10,
      width: video.videoWidth,
      height: video.videoHeight
    });

    // Request a wake lock
    try {
      wakeLock = await navigator.wakeLock.request('screen');
    } catch (error) {
      console.error('Could not request wake lock:', error);
    }

    timer = setInterval(() => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
      gif.addFrame(canvas, { delay: interval });
      snapSound.play(); // Play the sound

      countdown = interval / 1000;
    }, interval);
  }
});

// Stop capturing photos and download the gif
stopButton.addEventListener('click', async () => {
  // Hide the stop button and show the capture button
  stopButton.style.visibility = 'hidden';
  captureButton.style.visibility = 'visible';

  clearInterval(timer);
  clearInterval(countdownTimer);
  timer = null;
  countdownTimer = null;
  countdownDiv.innerText = '';

  gif.on('finished', (blob) => {
    const link = document.createElement('a');
    link.download = 'animation.gif';
    link.href = URL.createObjectURL(blob);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });

  gif.render();

  // Release the wake lock
  if (wakeLock !== null) {
    await wakeLock.release();
    wakeLock = null;
  }
});
