const video = document.getElementById('video');
const intervalSelect = document.getElementById('interval');
const captureButton = document.getElementById('capture');
const stopButton = document.getElementById('stop');
const countdownDiv = document.getElementById('countdown');
let timer = null;
let countdownTimer = null;
let gif = null;

// Get access to camera
navigator.mediaDevices.getUserMedia({ video: true })
  .then(stream => {
    video.srcObject = stream;
    video.play();
  })
  .catch(error => {
    console.error('Error accessing camera:', error);
    alert("in mozilla developer go to `about:config` set to `true` `media.devices.insecure.enabled` and `media.getusermedia.insecure.enabled`");
  });

// Capture photo at selected interval
captureButton.addEventListener('click', () => {
  if (timer === null) {
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

    timer = setInterval(() => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
      gif.addFrame(canvas, { delay: interval });

      countdown = interval / 1000;
    }, interval);
  }
});

// Stop capturing photos and download the gif
stopButton.addEventListener('click', () => {
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
});

// Stop capturing photos
stopButton.addEventListener('click', () => {
  clearInterval(timer);
  clearInterval(countdownTimer);
  timer = null;
  countdownTimer = null;
  countdownDiv.innerText = '';
});
