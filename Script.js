const video = document.getElementById('video');
const scoreDiv = document.getElementById('score');
const startBtn = document.getElementById('startCam');

async function loadModels() {
  await faceapi.nets.tinyFaceDetector.loadFromUri('https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/');
  await faceapi.nets.faceLandmark68Net.loadFromUri('https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/');
  await faceapi.nets.faceExpressionNet.loadFromUri('https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/');
}

async function startCamera() {
  startBtn.style.display = 'none';
  video.style.display = 'block';
  scoreDiv.textContent = 'Detecting...';

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
    video.srcObject = stream;
  } catch (err) {
    scoreDiv.textContent = 'Camera access denied';
    console.error(err);
    return;
  }

  video.addEventListener('play', () => {
    const canvas = faceapi.createCanvasFromMedia(video);
    document.body.append(canvas);
    const displaySize = { width: video.width, height: video.height };
    faceapi.matchDimensions(canvas, displaySize);

    setInterval(async () => {
      const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
                                      .withFaceLandmarks()
                                      .withFaceExpressions();
      canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
      faceapi.draw.drawDetections(canvas, faceapi.resizeResults(detections, displaySize));

      if (detections.length > 0) {
        const landmarks = detections[0].landmarks;
        const expressions = detections[0].expressions;

        const leftEye = landmarks.getLeftEye();
        const rightEye = landmarks.getRightEye();
        const nose = landmarks.getNose();
        const noseCenter = Math.abs(nose[3].x - ((leftEye[0].x + rightEye[3].x)/2));
        const symmetryScore = Math.max(0, 100 - noseCenter*3);

        const smileScore = expressions.happy * 50;
        const randomFactor = Math.random() * 10;

        const totalScore = Math.min(100, Math.round(symmetryScore + smileScore + randomFactor));
        scoreDiv.textContent = `AI Rating: ${totalScore}/100 😎`;

        if (totalScore > 80) document.body.style.background = '#ffeb3b';
        else if (totalScore > 60) document.body.style.background = '#4caf50';
        else if (totalScore > 40) document.body.style.background = '#2196f3';
        else document.body.style.background = '#f44336';
      }
    }, 300);
  });
}

loadModels();
startBtn.addEventListener('click', startCamera);
