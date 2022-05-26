import React, { useState, useEffect, useRef } from "react";
import * as faceapi from "face-api.js";
import * as canvas from "canvas";
import WebCam from "react-webcam";

import axios from "axios";
import { message, notification } from "antd";

function DetectFace2({ detectSignedInUser, setFaceRecognised }) {
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [captureVideo, setCaptureVideo] = useState(false);
  const [userDetail, setUserDetail] = useState({});

  const videoRef = React.useRef();
  const videoHeight = 480;
  const videoWidth = 640;
  const canvasRef = React.useRef();

  React.useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = process.env.PUBLIC_URL + "/models";

      Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
        faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
        faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
        faceapi.nets.faceExpressionNet.loadFromUri("/models"),
        faceapi.nets.ageGenderNet.loadFromUri("/models"),
        faceapi.nets.ssdMobilenetv1.loadFromUri("/models"),
      ]).then(setModelsLoaded(true));
    };
    loadModels();
  }, []);

  const startVideo = () => {
    setCaptureVideo(true);
    navigator.mediaDevices
      .getUserMedia({ video: { width: 300 } })
      .then((stream) => {
        let video = videoRef.current;
        video.srcObject = stream;
        video.play();
      })
      .catch((err) => {
        console.error("error:", err);
      });
  };

  const getLabels = async () => {
    var list = [];
    var labelList = new Array();
    const token = localStorage.getItem("token") || "";
    console.log("token", token);
    const headers = {
      authorization: `Bearer ${token}`,
    };
    let url = "";
    if (detectSignedInUser) {
      url = `${process.env.REACT_APP_BACKEND_URL}/user`;
    } else {
      url = `${process.env.REACT_APP_BACKEND_URL}/users`;
    }
    const { data } = await axios.get(url, {
      headers,
    });
    // let userDetail = {};
    data.forEach((user) => {
      labelList.push(user.userName);
      userDetail[user.userName] = user;
    });
    console.log("labellist", labelList, userDetail);
    setUserDetail(userDetail);
    console.log("userDetail", userDetail);

    return labelList;
  };

  const loadLabeledImages = async () => {
    // getLabels().then((data) => {
    //   dataS = JSON.stringify(data);
    //   sessionStorage.setItem("list", dataS);
    // });
    const labels = await getLabels();
    // const labels = JSON.parse(sessionStorage.getItem("list"));

    // Error handling for no users registered, hence labels is undefined, null or empty.
    // Define 'Sheldon' as default labels value.
    if (labels === undefined || labels === null || labels.length == 0) {
      window.labels = ["Sheldon"];
    }
    console.log("Labels - ", labels); // check that labels cannot be [] or empty at this point.

    return Promise.all(
      labels.map(async (label) => {
        var descriptions = [];
        for (let i = 1; i <= 1; i++) {
          try {
            const imageUrl = "labeled_images/" + `${label}/${i}.jpg`;
            // const img = await canvas.loadImage(
            //   `labeled_images/${label}/${i}.jpg`
            // );
            console.log(
              "imageUrl",
              "https://raw.githubusercontent.com/harpreet0102/ms_engage/main/frontend/src/labeled_images/taran/1.jpg?token=GHSAT0AAAAAABUXWPCKUWMGLXZ342F7IRPCYULFM4A"
            );
            const img = await faceapi.fetchImage(
              `/labeled_images/${label}/${i}.jpg`
            );
            console.log("------------------");
            const detections = await faceapi
              .detectSingleFace(img)
              .withFaceLandmarks()
              .withFaceDescriptor();
            console.log("detections", detections);
            descriptions.push(detections.descriptor);
          } catch (err) {
            console.log("err here", err);
            // Do nothing or error handling
          }
        }
        return new faceapi.LabeledFaceDescriptors(label, descriptions);
      })
    );
  };

  const handleVideoOnPlay = async () => {
    const labeledFaceDescriptors = await loadLabeledImages();
    var faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.5);

    var stopDetection = false;

    if (detectSignedInUser) {
      setTimeout(() => (stopDetection = true), 60000);
    }

    setInterval(async () => {
      if (canvasRef && canvasRef.current) {
        canvasRef.current.innerHTML = faceapi.createCanvasFromMedia(
          videoRef.current
        );
        const displaySize = {
          width: videoWidth,
          height: videoHeight,
        };

        faceapi.matchDimensions(canvasRef.current, displaySize);

        const detections = await faceapi
          .detectAllFaces(
            videoRef.current,
            new faceapi.TinyFaceDetectorOptions()
          )
          .withFaceLandmarks()
          .withFaceExpressions()
          .withAgeAndGender()
          .withFaceDescriptors();

        const resizedDetections = faceapi.resizeResults(
          detections,
          displaySize
        );

        canvasRef &&
          canvasRef.current &&
          canvasRef.current
            .getContext("2d")
            .clearRect(0, 0, videoWidth, videoHeight);
        canvasRef &&
          canvasRef.current &&
          faceapi.draw.drawDetections(canvasRef.current, resizedDetections);
        canvasRef &&
          canvasRef.current &&
          faceapi.draw.drawFaceLandmarks(canvasRef.current, resizedDetections);
        canvasRef &&
          canvasRef.current &&
          faceapi.draw.drawFaceExpressions(
            canvasRef.current,
            resizedDetections
          );

        const results = resizedDetections.map((d) =>
          faceMatcher.findBestMatch(d.descriptor)
        );
        console.log("results", results, stopDetection);
        if (results.length > 0 && results[0]["_label"] != "unknown") {
          // window.alert(results[0]["_label"]);
          console.log(userDetail);
          notification.success({
            message: "Face recognised successfully!",
            description: `UserName - ${results[0]["_label"]} and  
            Email -
             ${userDetail[results[0]["_label"]].email}
            `,
          });
          setFaceRecognised(true);
          closeWebcam();
          return;
        }

        if (stopDetection) {
          notification.error({
            message: "Failed to match the face!",
          });
          closeWebcam();
          return;
        }
      }
    }, 1000);

    // setInterval(async () => {
    //   if (canvasRef && canvasRef.current) {
    //     canvasRef.current.innerHTML = faceapi.createCanvasFromMedia(
    //       videoRef.current
    //     );
    //     const displaySize = {
    //       width: videoWidth,
    //       height: videoHeight,
    //     };

    //     faceapi.matchDimensions(canvasRef.current, displaySize);

    //     const detections = await faceapi
    //       .detectAllFaces(
    //         videoRef.current,
    //         new faceapi.TinyFaceDetectorOptions()
    //       )
    //       .withFaceLandmarks()
    //       .withFaceExpressions()
    //       .withAgeAndGender()
    //       .withFaceDescriptors();

    //     const resizedDetections = faceapi.resizeResults(
    //       detections,
    //       displaySize
    //     );

    //     canvasRef &&
    //       canvasRef.current &&
    //       canvasRef.current
    //         .getContext("2d")
    //         .clearRect(0, 0, videoWidth, videoHeight);
    //     canvasRef &&
    //       canvasRef.current &&
    //       faceapi.draw.drawDetections(canvasRef.current, resizedDetections);
    //     canvasRef &&
    //       canvasRef.current &&
    //       faceapi.draw.drawFaceLandmarks(canvasRef.current, resizedDetections);
    //     canvasRef &&
    //       canvasRef.current &&
    //       faceapi.draw.drawFaceExpressions(
    //         canvasRef.current,
    //         resizedDetections
    //       );

    //     const results = resizedDetections.map((d) =>
    //       faceMatcher.findBestMatch(d.descriptor)
    //     );
    //     console.log("results", results);
    //     if (results.length > 0 && results[0]["_label"] != "unknown") {
    //       window.alert(results[0]["_label"]);
    //       setFaceRecognised(true);
    //       return;
    //     }
    //   }
    // }, 100);
  };

  const closeWebcam = () => {
    videoRef.current.pause();
    videoRef.current.srcObject.getTracks()[0].stop();
    setCaptureVideo(false);
  };

  return (
    <div>
      <div style={{ textAlign: "center", padding: "10px" }}>
        {captureVideo && modelsLoaded ? (
          <button
            onClick={closeWebcam}
            style={{
              cursor: "pointer",
              backgroundColor: "#1890ff",
              color: "white",
              padding: "10px",
              fontSize: "20px",
              border: "none",
              borderRadius: "10px",
            }}
          >
            Close Webcam
          </button>
        ) : (
          <button
            onClick={startVideo}
            style={{
              cursor: "pointer",
              backgroundColor: "#1890ff",
              color: "white",
              padding: "10px",
              fontSize: "20px",
              border: "none",
              borderRadius: "10px",
            }}
          >
            Open Webcam
          </button>
        )}
      </div>
      {captureVideo ? (
        modelsLoaded ? (
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                padding: "10px",
              }}
            >
              <video
                ref={videoRef}
                height={videoHeight}
                width={videoWidth}
                onPlay={handleVideoOnPlay}
                style={{ borderRadius: "10px" }}
              />
              <canvas ref={canvasRef} style={{ position: "absolute" }} />
            </div>
          </div>
        ) : (
          <>{message.info("Loading!")}</>
        )
      ) : (
        <></>
      )}
    </div>
  );
}

export default DetectFace2;
