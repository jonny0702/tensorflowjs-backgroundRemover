import React, {
  useState,
  useEffect,
  useRef,
  SetStateAction,
  Dispatch,
} from "react";
import * as tf from "@tensorflow/tfjs";
import * as deeplab from "@tensorflow-models/deeplab";
import "@tensorflow/tfjs-backend-webgl";

import styles from "./styles/App.module.sass";


export const App: React.FC = () => {
  //REFS
  const modelSelectRef = useRef<HTMLSelectElement>(null);
  const generatedImage = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<any>();
  let ctx = useRef<CanvasRenderingContext2D | null>(null);
  //STATES
  const [model, setModel] = useState<React.SetStateAction<any>>();
  const [modelNameSelection, setModelName] = useState<string | null>(null);
  const [loadStatus, setLoadStatus] = useState(true);
  const [disableButton, setDisableButton] = useState(false);
  const [image, setImage] = useState<React.SetStateAction<string>>();
  const [legend, setLegend] = useState<any>({})

  const handleLoadModel = () => {
    setDisableButton(true);
    const modelName = `${
      modelSelectRef.current?.options[modelSelectRef.current.selectedIndex]
        .value
    }`;
    setModelName(modelName.toLocaleLowerCase());
  };

  const handleUploadImage = (e: any) => {
    const [file] = e.target.files;

    if (file) {
      const converterToURL = URL.createObjectURL(file);
      setImage(converterToURL);
      setDisableButton(false);
    }
  };
  const predict = async () => {
    let prediction = await model.segment(generatedImage.current);
    console.log(prediction);
    renderPredictionImage(prediction);
  };

  const loadModel = async (modelNameSelection: any) => {
    try {
      const modelLoaded = await deeplab.load({
        base: modelNameSelection,
        quantizationBytes: 2,
      });
      setModel(modelLoaded);
      setDisableButton(false);
      setLoadStatus(false);
      console.log("Model Loaded :D");
    } catch (error) {
      console.error(error, "ERROR TO LOAD MODEL");
    }
  };

  const renderPredictionImage = (prediction: any) => {
    const { legend, height, width, segmentationMap } = prediction;

    console.log("Prediction: " + JSON.stringify(legend));

    const segmentationMapData = new ImageData(segmentationMap, width, height);
    canvasRef.current.width = generatedImage.current?.width;
    canvasRef.current.height = generatedImage.current?.height;

    //Render CTX Canvas using the prediction parameters
    ctx.current?.putImageData(segmentationMapData, 0, 0);
    setLegend(legend)
  };

 const arrLegend = Object.keys(legend)

  useEffect(() => {
    modelNameSelection && loadModel(modelNameSelection);
    if (canvasRef.current) {
      ctx.current = canvasRef.current.getContext("2d");
    }
  }, [modelNameSelection]);
console.log(arrLegend)
  return (
    <div className={styles.App}>
      <h2>Deep lab Semantic Image Segmentation</h2>
      <div>
        <select name="ModelNameSelect" ref={modelSelectRef}>
          <option>pascal</option>
          <option>cityscapes</option>
          <option>ADE20K</option>
        </select>
        <button
          id="loadModel"
          onClick={handleLoadModel}
          disabled={disableButton}
        >
          Load Model
        </button>
        <p>{loadStatus ? "Model not Loaded..." : "Model Loaded :D"}</p>
      </div>
      <div>
        <input
          type="file"
          id="chooseFiles"
          accept="image/*"
          onChange={(e) => handleUploadImage(e)}
        />
        <button id="segmentImage" disabled={disableButton} onClick={predict}>
          Segment Image
        </button>
      </div>

      <img
        id="image"
        width="500"
        height="auto"
        crossOrigin={"anonymous"}
        src={`${image}`}
        ref={generatedImage}
      />

      <canvas id="canvas" ref={canvasRef}></canvas>

      <p id="legendLabel">Legend</p>
      <div id="legends" >
        {
          arrLegend.map((item)=>{
            const [red, green,blue] = legend[item]
             return (
              <span
                key={item}
                style={{
                  backgroundColor: `rgb(${red}, ${green}, ${blue})`,
                  padding: '10px',
                  marginRight: '10px',
                  color: '#ffffff'
                }}
              >
                  {item}
              </span>
             )
          })
        }
      </div>
    </div>
  );
};
